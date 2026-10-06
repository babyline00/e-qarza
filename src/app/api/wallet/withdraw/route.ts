import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { getOrCreateWallet, debitWallet } from '@/lib/wallet'

// POST /api/wallet/withdraw — request a withdrawal from wallet to bank account
export async function POST(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let body: { amount?: number; bankName?: string; accountNumber?: string; iban?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  const amount = Number(body.amount)
  if (!Number.isFinite(amount) || amount <= 0) {
    return NextResponse.json({ error: 'Invalid amount' }, { status: 400 })
  }
  const amountMinor = Math.round(amount * 100) // convert rupees to paisa
  if (amountMinor < 10000) {
    return NextResponse.json({ error: 'Minimum withdrawal is Rs 100' }, { status: 400 })
  }

  const bankName = (body.bankName || '').trim()
  const accountNumber = (body.accountNumber || '').trim()
  const iban = (body.iban || '').trim()
  if (!bankName || !accountNumber || !iban) {
    return NextResponse.json({ error: 'Bank details are required' }, { status: 400 })
  }

  // check for pending withdrawals
  const existing = await db.withdrawal.findFirst({
    where: { userId: user.id, status: 'pending' },
  })
  if (existing) {
    return NextResponse.json({ error: 'You already have a pending withdrawal request' }, { status: 400 })
  }

  // check balance
  const wallet = await getOrCreateWallet(user.id)
  if (wallet.balance < amountMinor) {
    return NextResponse.json({ error: `Insufficient balance. Available: Rs ${(wallet.balance / 100).toLocaleString()}` }, { status: 400 })
  }

  // create withdrawal request (funds held — debited immediately)
  await debitWallet(user.id, amountMinor, 'withdrawal', `Withdrawal to ${bankName}`, undefined)

  const withdrawal = await db.withdrawal.create({
    data: {
      walletId: wallet.id,
      userId: user.id,
      amount: amountMinor,
      status: 'pending',
      bankName,
      accountNumber,
      iban,
    },
  })

  await db.notification.create({
    data: {
      userId: user.id,
      title: 'Withdrawal Requested',
      message: `Your withdrawal request of Rs ${(amountMinor / 100).toLocaleString()} to ${bankName} is pending review. You will be notified once processed.`,
      type: 'info',
    },
  })

  return NextResponse.json({ ok: true, withdrawalId: withdrawal.id })
}
