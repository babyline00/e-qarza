import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user) return null
  if (user.role === 'admin') return user
  if (user.role === 'staff') {
    const access = (user.staffAccess || '').split(',')
    if (access.includes('kyc')) return user
  }
  return null
}

// GET /api/admin/kyc?status=submitted|approved|rejected|all — list KYCs by status
export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = new URL(req.url).searchParams.get('status') || 'submitted'
  const where = status === 'all' ? {} : { status }

  const profiles = await db.kycProfile.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    include: { user: { select: { id: true, email: true, name: true, phone: true } } },
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
