import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

async function requireAdmin() {
  const u = await getSessionUser()
  if (!u || u.role !== 'admin') return null
  return u
}

// GET /api/admin/applications — list all loan applications with user info
export async function GET(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const status = new URL(req.url).searchParams.get('status')
  const where = status ? { status } : {}

  const apps = await db.loanApplication.findMany({
    where,
    orderBy: { appliedAt: 'desc' },
    take: 100,
    include: {
      user: { select: { id: true, email: true, name: true, phone: true } },
      plan: { select: { name: true } },
      installments: { select: { id: true, status: true } },
    },
  })

  const data = apps.map((a) => ({
    id: a.id,
    userId: a.userId,
    userName: a.user.name || a.user.email,
    userEmail: a.user.email,
    userPhone: a.user.phone,
    planName: a.plan.name,
    amount: a.amount,
    interestRate: a.interestRate,
    tenureMonths: a.tenureMonths,
    processingFee: a.processingFee,
    status: a.status,
    rejectReason: a.rejectReason,
    appliedAt: a.appliedAt.toISOString(),
    activatedAt: a.activatedAt?.toISOString() || null,
    installmentCount: a.installments.length,
    paidInstallments: a.installments.filter((i) => i.status === 'paid').length,
  }))

  return NextResponse.json({ applications: data })
}

// POST — reject an application { applicationId, reason }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { applicationId?: string; action?: 'reject' | 'approve'; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.applicationId || !['reject', 'approve'].includes(body.action || '')) {
    return NextResponse.json({ error: 'applicationId and action required' }, { status: 400 })
  }

  const app = await db.loanApplication.findUnique({
    where: { id: body.applicationId },
    include: { user: true },
  })
  if (!app) return NextResponse.json({ error: 'Application not found' }, { status: 404 })

  if (body.action === 'reject') {
    if (app.status === 'active' || app.status === 'completed') {
      return NextResponse.json({ error: 'Cannot reject an active/completed loan' }, { status: 400 })
    }
    const reason = body.reason || 'Application rejected by administrator'
    await db.loanApplication.update({
      where: { id: app.id },
      data: { status: 'rejected', rejectReason: reason },
    })
    // reset user stage so they can apply again
    await db.user.update({ where: { id: app.userId }, data: { stage: 'loan_select' } })
    await db.notification.create({
      data: {
        userId: app.userId,
        title: 'Loan Application Rejected',
        message: `Your ${app.planName} plan application was rejected. Reason: ${reason}. You can apply for a different plan.`,
        type: 'error',
      },
    })
  } else {
    // approve (only for fee_pending applications that haven't paid yet — admin override)
    if (app.status !== 'fee_pending') {
      return NextResponse.json({ error: 'Can only approve applications in fee_pending state' }, { status: 400 })
    }
    await db.loanApplication.update({
      where: { id: app.id },
      data: { status: 'fee_approved' },
    })
  }

  return NextResponse.json({ ok: true })
}
