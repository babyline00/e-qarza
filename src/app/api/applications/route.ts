import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET /api/applications — current user's applications (newest first)
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const apps = await db.loanApplication.findMany({
    where: { userId: user.id },
    orderBy: { appliedAt: 'desc' },
    include: {
      plan: { select: { name: true } },
      installments: { orderBy: { number: 'asc' } },
      payments: { orderBy: { createdAt: 'desc' } },
    },
  })

  const data = apps.map((a) => ({
    id: a.id,
    planName: a.plan.name,
    amount: a.amount,
    interestRate: a.interestRate,
    tenureMonths: a.tenureMonths,
    processingFee: a.processingFee,
    status: a.status,
    rejectReason: a.rejectReason,
    appliedAt: a.appliedAt.toISOString(),
    activatedAt: a.activatedAt?.toISOString() || null,
    installments: a.installments.map((i) => ({
      id: i.id,
      number: i.number,
      dueDate: i.dueDate,
      amount: i.amount,
      status: i.status,
      paidAt: i.paidAt?.toISOString() || null,
    })),
    feePayment: a.payments.find((p) => p.type === 'processing_fee') || null,
  }))

  return NextResponse.json({ applications: data })
}
