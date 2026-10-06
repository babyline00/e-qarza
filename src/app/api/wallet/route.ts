import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { getOrCreateWallet } from '@/lib/wallet'

// GET /api/wallet — user's wallet balance + recent transactions + withdrawal requests + active loan breakdown
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const wallet = await getOrCreateWallet(user.id)

  const [transactions, withdrawals, activeLoan] = await Promise.all([
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
    // Active loan — used to show "Balance = Loan + Processing Fee" breakdown
    // and to gate withdrawals behind the first installment being paid.
    db.loanApplication.findFirst({
      where: { userId: user.id, status: 'active' },
      orderBy: { activatedAt: 'desc' },
      include: {
        plan: { select: { name: true } },
        installments: { orderBy: { number: 'asc' }, take: 1 },
      },
    }),
  ])

  // First installment of the active loan (number === 1). Used by the wallet UI
  // to gate withdrawals — users must pay their first installment before they
  // can withdraw funds to their bank account.
  const firstInstallment = activeLoan?.installments[0]
    ? {
        id: activeLoan.installments[0].id,
        number: activeLoan.installments[0].number,
        amount: activeLoan.installments[0].amount,
        dueDate: activeLoan.installments[0].dueDate,
        status: activeLoan.installments[0].status,
      }
    : null

  // Build loan breakdown if there's an active loan
  const loanBreakdown = activeLoan
    ? {
        applicationId: activeLoan.id,
        planName: activeLoan.plan.name,
        principal: activeLoan.amount, // total loan amount
        processingFee: activeLoan.processingFee, // fee deducted upfront
        netDisbursed: activeLoan.amount - activeLoan.processingFee, // amount actually credited to wallet
        interestRate: activeLoan.interestRate,
        tenureMonths: activeLoan.tenureMonths,
        activatedAt: activeLoan.activatedAt?.toISOString() || null,
      }
    : null

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
    loanBreakdown,
    firstInstallment,
  })
}
