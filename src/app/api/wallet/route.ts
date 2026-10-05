import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { getOrCreateWallet } from '@/lib/wallet'

// GET /api/wallet — user's wallet balance + recent transactions + withdrawal requests
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wallet = await getOrCreateWallet(user.id)

  const [transactions, withdrawals] = await Promise.all([
    db.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    db.withdrawal.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ])

  return NextResponse.json({
    wallet: {
      id: wallet.id,
      balance: wallet.balance,
    },
    transactions: transactions.map((t) => ({
      id: t.id,
      type: t.type,
      amount: t.amount,
      description: t.description,
      referenceId: t.referenceId,
      createdAt: t.createdAt.toISOString(),
    })),
    withdrawals: withdrawals.map((w) => ({
      id: w.id,
      amount: w.amount,
      status: w.status,
      bankName: w.bankName,
      accountNumber: w.accountNumber,
      iban: w.iban,
      rejectReason: w.rejectReason,
      createdAt: w.createdAt.toISOString(),
      reviewedAt: w.reviewedAt?.toISOString() || null,
    })),
  })
}
