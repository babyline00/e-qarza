import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') return null
  return user
}

// GET /api/admin/kyc — list submitted KYCs
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const profiles = await db.kycProfile.findMany({
    where: { status: 'submitted' },
    orderBy: { submittedAt: 'asc' },
    include: { user: { select: { id: true, email: true, name: true } } },
  })
  return NextResponse.json({ profiles })
}

// POST /api/admin/kyc — approve or reject { kycId, action: 'approve'|'reject', reason? }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { kycId?: string; action?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (!body.kycId || !['approve', 'reject'].includes(body.action || '')) {
    return NextResponse.json({ error: 'kycId and action (approve|reject) required' }, { status: 400 })
  }

  const kyc = await db.kycProfile.findUnique({ where: { id: body.kycId } })
  if (!kyc) return NextResponse.json({ error: 'KYC not found' }, { status: 404 })

  if (body.action === 'approve') {
    await db.kycProfile.update({
      where: { id: kyc.id },
      data: { status: 'approved', reviewedAt: new Date(), rejectReason: null },
    })
    await db.user.update({ where: { id: kyc.userId }, data: { stage: 'loan_select' } })
    await db.notification.create({
      data: {
        userId: kyc.userId,
        title: 'KYC Approved 🎉',
        message: 'Your KYC has been approved! You can now browse and apply for loan plans.',
        type: 'success',
      },
    })
  } else {
    await db.kycProfile.update({
      where: { id: kyc.id },
      data: { status: 'rejected', reviewedAt: new Date(), rejectReason: body.reason || 'Did not meet requirements' },
    })
    await db.user.update({ where: { id: kyc.userId }, data: { stage: 'kyc' } })
    await db.notification.create({
      data: {
        userId: kyc.userId,
        title: 'KYC Rejected',
        message: `Your KYC was rejected. Reason: ${body.reason || 'Did not meet requirements'}. Please update your details and resubmit.`,
        type: 'error',
      },
    })
  }

  return NextResponse.json({ ok: true })
}
