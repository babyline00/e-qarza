import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { randomBytes } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

// POST /api/payments/installment — upload proof for a specific installment
// multipart: installmentId, txnRef, proofImage
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const installmentId = String(formData.get('installmentId') || '')
  const txnRef = String(formData.get('txnRef') || '').trim()
  const file = formData.get('proofImage')

  if (!installmentId) return NextResponse.json({ error: 'installmentId required' }, { status: 400 })
  // txnRef is now optional
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: 'Payment proof image is required' }, { status: 400 })
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
  }
  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    return NextResponse.json({ error: 'Only JPG/PNG/WEBP allowed' }, { status: 400 })
  }

  const installment = await db.installment.findUnique({
    where: { id: installmentId },
    include: { application: true },
  })
  if (!installment || installment.application.userId !== user.id) {
    return NextResponse.json({ error: 'Installment not found' }, { status: 404 })
  }
  if (installment.application.status !== 'active') {
    return NextResponse.json({ error: 'Loan is not active' }, { status: 400 })
  }
  if (installment.status === 'paid') {
    return NextResponse.json({ error: 'Installment already paid' }, { status: 400 })
  }
  if (installment.status === 'verifying') {
    return NextResponse.json({ error: 'Installment payment already submitted for verification' }, { status: 400 })
  }

  // save file
  const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads')
  await fs.mkdir(UPLOAD_DIR, { recursive: true })
  const ext = (file.name.split('.').pop() || 'jpg').toLowerCase()
  const safeExt = ['jpg', 'jpeg', 'png', 'webp'].includes(ext) ? ext : 'jpg'
  const fname = `${randomBytes(12).toString('hex')}.${safeExt}`
  await fs.writeFile(path.join(UPLOAD_DIR, fname), Buffer.from(await file.arrayBuffer()))
  const proofPath = `/uploads/${fname}`

  const payment = await db.payment.create({
    data: {
      userId: user.id,
      applicationId: installment.application.id,
      type: 'installment',
      amount: installment.amount,
      status: 'submitted',
      proofPath,
      txnRef,
    },
  })

  await db.installment.update({
    where: { id: installment.id },
    data: { status: 'verifying', paymentId: payment.id },
  })

  await db.notification.create({
    data: {
      userId: user.id,
      title: `Installment #${installment.number} Submitted`,
      message: `Payment proof for installment #${installment.number} (ref: ${txnRef}) is pending verification.`,
      type: 'info',
    },
  })

  return NextResponse.json({ ok: true })
}
