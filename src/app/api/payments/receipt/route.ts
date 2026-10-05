import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET /api/payments/receipt?id=<paymentId> — fetch a single payment for receipt rendering
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const id = new URL(req.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const payment = await db.payment.findUnique({
    where: { id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      application: { include: { plan: { select: { name: true } } } },
    },
  })
  if (!payment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (payment.userId !== user.id && user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // installment number (if installment payment)
  let installmentNumber: number | null = null
  if (payment.type === 'installment') {
    const inst = await db.installment.findFirst({ where: { paymentId: payment.id } })
    installmentNumber = inst?.number || null
  }

  return NextResponse.json({
    payment: {
      id: payment.id,
      type: payment.type,
      amount: payment.amount,
      status: payment.status,
      txnRef: payment.txnRef,
      proofPath: payment.proofPath,
      createdAt: payment.createdAt.toISOString(),
      reviewedAt: payment.reviewedAt?.toISOString() || null,
      user: payment.user,
      application: payment.application
        ? {
            planName: payment.application.plan.name,
            amount: payment.application.amount,
            interestRate: payment.application.interestRate,
            tenureMonths: payment.application.tenureMonths,
          }
        : null,
      installmentNumber,
    },
  })
}
