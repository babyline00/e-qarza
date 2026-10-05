import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { randomBytes } from 'crypto'
import { promises as fs } from 'fs'
import path from 'path'

// POST /api/payments/proof — upload payment proof for processing fee
// multipart: applicationId, txnRef, proofImage
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await req.formData()
  const applicationId = String(formData.get('applicationId') || '')
  const txnRef = String(formData.get('txnRef') || '').trim()
  const file = formData.get('proofImage')

  if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })
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

  const app = await db.loanApplication.findFirst({
    where: { id: applicationId, userId: user.id },
  })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })
  if (app.status !== 'fee_pending') {
    return NextResponse.json({ error: 'Processing fee already submitted or not due' }, { status: 400 })
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
      applicationId: app.id,
      type: 'processing_fee',
      amount: app.processingFee,
      status: 'submitted',
      proofPath,
      txnRef,
    },
  })

  await db.loanApplication.update({
    where: { id: app.id },
    data: { status: 'fee_submitted', feePaymentId: payment.id },
  })

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Processing Fee Submitted',
      message: `Your processing fee proof (ref: ${txnRef}) has been submitted and is pending verification.`,
      type: 'info',
    },
  })

  return NextResponse.json({ ok: true })
}
