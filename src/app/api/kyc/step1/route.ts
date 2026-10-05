import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { saveUpload } from '@/lib/upload'

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const cnicName = String(formData.get('cnicName') || '').trim()
  const fatherName = String(formData.get('fatherName') || '').trim()
  const dob = String(formData.get('dob') || '').trim()
  const phoneNumber = String(formData.get('phoneNumber') || '').trim()

  if (!cnicName || !fatherName || !dob || !phoneNumber) {
    return NextResponse.json({ error: 'All identity fields are required' }, { status: 400 })
  }
  // validate phone (Pakistani mobile: 03XXXXXXXXX)
  if (!/^03\d{9}$/.test(phoneNumber)) {
    return NextResponse.json({ error: 'Phone must be 11 digits starting with 03' }, { status: 400 })
  }

  // save 3 images
  const files = ['cnicFrontImage', 'cnicBackImage', 'selfieImage']
  const paths: Record<string, string> = {}
  for (const f of files) {
    const file = formData.get(f)
    if (!file || !(file instanceof File)) {
      return NextResponse.json({ error: `Image ${f} is required` }, { status: 400 })
    }
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: `${f} too large (max 5MB)` }, { status: 400 })
    }
    if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
      return NextResponse.json({ error: `${f} must be JPG/PNG/WEBP` }, { status: 400 })
    }
  }
  // process saves via a small helper using the formData
  const { promises: fs } = await import('fs')
  const pathMod = await import('path')
  const { randomBytes } = await import('crypto')
  const UPLOAD_DIR = pathMod.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  for (const f of files) {
    const file = formData.get(f) as File
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
    const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
    const fname = `${randomBytes(12).toString('hex')}.${safeExt}`
    const buf = Buffer.from(await file.arrayBuffer())
    await fs.writeFile(pathMod.join(UPLOAD_DIR, fname), buf)
    paths[f] = `/uploads/${fname}`
  }

  // upsert kyc profile (draft) with step 1 data; also store phone on user
  const kyc = await db.kycProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      cnicName,
      fatherName,
      dob,
      phoneNumber,
      cnicFrontPath: paths.cnicFrontImage,
      cnicBackPath: paths.cnicBackImage,
      selfiePath: paths.selfieImage,
      status: 'draft',
    },
    update: {
      cnicName,
      fatherName,
      dob,
      phoneNumber,
      cnicFrontPath: paths.cnicFrontImage,
      cnicBackPath: paths.cnicBackImage,
      selfiePath: paths.selfieImage,
      // if previously rejected, allow re-edit -> reset to draft
      status: user.kycProfile?.status === 'rejected' ? 'draft' : undefined,
      rejectReason: user.kycProfile?.status === 'rejected' ? null : undefined,
    },
  })

  await db.user.update({
    where: { id: user.id },
    data: { phone: phoneNumber, name: cnicName },
  })

  return NextResponse.json({ ok: true, kyc: { status: kyc.status } })
}
