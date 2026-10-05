import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// POST /api/plans/apply — create a loan application for a plan
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  if (user.role === 'admin') return NextResponse.json({ error: 'Admin cannot apply' }, { status: 403 })

  // must be KYC approved
  const kyc = await db.kycProfile.findUnique({ where: { userId: user.id } })
  if (!kyc || kyc.status !== 'approved') {
    return NextResponse.json({ error: 'Your KYC must be approved before applying for a loan' }, { status: 400 })
  }

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  const planId = String(body.planId || '')
  if (!planId) return NextResponse.json({ error: 'planId is required' }, { status: 400 })

  const plan = await db.loanPlan.findUnique({ where: { id: planId } })
  if (!plan || !plan.active) return NextResponse.json({ error: 'Plan not found' }, { status: 404 })

  // prevent multiple active applications
  const existing = await db.loanApplication.findFirst({
    where: { userId: user.id, status: { in: ['fee_pending', 'fee_submitted', 'fee_approved', 'active'] } },
  })
  if (existing) {
    return NextResponse.json({ error: 'You already have an active loan application' }, { status: 400 })
  }

  const app = await db.loanApplication.create({
    data: {
      userId: user.id,
      planId: plan.id,
      amount: plan.amount,
      interestRate: plan.interestRate,
      tenureMonths: plan.tenureMonths,
      processingFee: plan.processingFee,
      status: 'fee_pending',
    },
  })

  await db.user.update({ where: { id: user.id }, data: { stage: 'fee_pending' } })

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Loan Application Created',
      message: `You applied for the ${plan.name} plan (Rs ${(plan.amount / 100).toLocaleString()}). Please pay the processing fee to proceed.`,
      type: 'info',
    },
  })

  return NextResponse.json({ ok: true, applicationId: app.id })
}
