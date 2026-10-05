import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET /api/transactions — all payments for the current user (newest first)
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payments = await db.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: {
      application: { include: { plan: { select: { name: true } } } },
    },
    take: 100,
  })

  // also fetch installment number for installment-type payments
  const data = await Promise.all(
    payments.map(async (p) => {
      let installmentNumber: number | null = null
      if (p.type === 'installment') {
        const inst = await db.installment.findFirst({ where: { paymentId: p.id } })
        installmentNumber = inst?.number || null
      }
      return {
        id: p.id,
        type: p.type,
        amount: p.amount,
        status: p.status,
        txnRef: p.txnRef,
        proofPath: p.proofPath,
        rejectReason: p.rejectReason,
        createdAt: p.createdAt.toISOString(),
        reviewedAt: p.reviewedAt?.toISOString() || null,
        planName: p.application?.plan.name || null,
        installmentNumber,
      }
    })
  )

  return NextResponse.json({ transactions: data })
}
