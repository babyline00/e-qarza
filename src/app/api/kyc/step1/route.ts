import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { saveUpload } from '@/lib/upload'

function calculateAge(dob: string): number {
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const m = today.getMonth() - birth.getMonth()
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--
  return age
}

export async function POST(req: Request) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const cnicName = String(formData.get('cnicName') || '').trim()
  const cnicNumber = String(formData.get('cnicNumber') || '').trim()
  const fatherName = String(formData.get('fatherName') || '').trim()
  const dob = String(formData.get('dob') || '').trim()
  const phoneNumber = String(formData.get('phoneNumber') || '').trim()

  if (!cnicName || !cnicNumber || !fatherName || !dob || !phoneNumber) {
    return NextResponse.json({ error: 'All identity fields are required' }, { status: 400 })
  }

  // Validate CNIC number: 13 digits (XXXXX-XXXXXXX-X)
  const cnicDigits = cnicNumber.replace(/[^0-9]/g, '')
  if (!/^\d{13}$/.test(cnicDigits)) {
    return NextResponse.json({ error: 'CNIC number must be 13 digits (e.g. 35202-1234567-1)' }, { status: 400 })
  }

  // Validate phone (Pakistani mobile: 03XXXXXXXXX)
  if (!/^03\d{9}$/.test(phoneNumber)) {
    return NextResponse.json({ error: 'Phone must be 11 digits starting with 03' }, { status: 400 })
  }

  // Validate age 18+
  const age = calculateAge(dob)
  if (age < 18) {
    return NextResponse.json({ error: `You must be at least 18 years old to apply. Your age: ${age} years.` }, { status: 400 })
  }
  if (age > 120) {
    return NextResponse.json({ error: 'Please enter a valid date of birth' }, { status: 400 })
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
  // process saves
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

  // Selfie vs CNIC front auto-match check using VLM
  let autoApproved = false
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default
    const zai = await ZAI.create()

    // Read both images as base64
    const selfieBuf = await fs.readFile(pathMod.join(process.cwd(), 'public', paths.selfieImage))
    const cnicFrontBuf = await fs.readFile(pathMod.join(process.cwd(), 'public', paths.cnicFrontImage))
    const selfieB64 = `data:image/jpeg;base64,${selfieBuf.toString('base64')}`
    const cnicB64 = `data:image/jpeg;base64,${cnicFrontBuf.toString('base64')}`

    const matchResponse = await zai.chat.completions.createVision({
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: 'Compare the face in the selfie (image 1) with the face on the CNIC ID card (image 2). Do they belong to the same person? Answer with ONLY "YES" or "NO" followed by a brief reason.' },
            { type: 'image_url', image_url: { url: selfieB64 } },
            { type: 'image_url', image_url: { url: cnicB64 } },
          ],
        },
      ],
      thinking: { type: 'disabled' },
    })

    const matchText = matchResponse.choices[0]?.message?.content || ''
    autoApproved = matchText.toUpperCase().startsWith('YES')
  } catch {
    // If VLM fails, default to manual review (not auto-approved)
    autoApproved = false
  }

  // upsert kyc profile with step 1 data
  const kyc = await db.kycProfile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      cnicName,
      cnicNumber: cnicDigits,
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
      cnicNumber: cnicDigits,
      fatherName,
      dob,
      phoneNumber,
      cnicFrontPath: paths.cnicFrontImage,
      cnicBackPath: paths.cnicBackImage,
      selfiePath: paths.selfieImage,
      status: user.kycProfile?.status === 'rejected' ? 'draft' : undefined,
      rejectReason: user.kycProfile?.status === 'rejected' ? null : undefined,
    },
  })

  await db.user.update({
    where: { id: user.id },
    data: { phone: phoneNumber, name: cnicName },
  })

  return NextResponse.json({ ok: true, kyc: { status: kyc.status }, autoApproved })
}
