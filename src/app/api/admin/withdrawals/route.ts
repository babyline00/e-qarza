import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { creditWallet } from '@/lib/wallet'

async function requireAdmin() {
  const u = await getSessionUser()
  if (!u || u.role !== 'admin') return null
  return u
}

// GET /api/admin/withdrawals — list pending withdrawals
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const withdrawals = await db.withdrawal.findMany({
    where: { status: 'pending' },
    orderBy: { createdAt: 'asc' },
  })

  // fetch user info separately since Withdrawal has no relation to User
  const userIds = [...new Set(withdrawals.map((w) => w.userId))]
  const users = await db.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, email: true, name: true, phone: true },
  })
  const userMap = new Map(users.map((u) => [u.id, u]))

  const data = withdrawals.map((w) => {
    const u = userMap.get(w.userId)
    return {
      id: w.id,
      userId: w.userId,
      userName: u?.name || u?.email || 'Unknown',
      userEmail: u?.email || '',
      userPhone: u?.phone || null,
      amount: w.amount,
      status: w.status,
      bankName: w.bankName,
      accountNumber: w.accountNumber,
      iban: w.iban,
      createdAt: w.createdAt.toISOString(),
    }
  })

  return NextResponse.json({ withdrawals: data })
}

// POST /api/admin/withdrawals — approve or reject { withdrawalId, action, reason? }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { withdrawalId?: string; action?: 'approve' | 'reject'; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }

  if (!body.withdrawalId || !['approve', 'reject'].includes(body.action || '')) {
    return NextResponse.json({ error: 'withdrawalId and action (approve|reject) required' }, { status: 400 })
  }

  const withdrawal = await db.withdrawal.findUnique({ where: { id: body.withdrawalId! } })
  if (!withdrawal) return NextResponse.json({ error: 'Withdrawal not found' }, { status: 404 })
  if (withdrawal.status !== 'pending') {
    return NextResponse.json({ error: 'Withdrawal already processed' }, { status: 400 })
  }

  if (body.action === 'approve') {
    // Mark as completed — funds were already debited when request was created
    await db.withdrawal.update({
      where: { id: withdrawal.id },
      data: { status: 'completed', reviewedAt: new Date() },
    })
    await db.notification.create({
      data: {
        userId: withdrawal.userId,
        title: 'Withdrawal Completed ✅',
        message: `Your withdrawal of Rs ${(withdrawal.amount / 100).toLocaleString()} to ${withdrawal.bankName} has been processed. Funds should appear in your account within 1-2 business days.`,
        type: 'success',
      },
    })
  } else {
    // Reject — refund the debited amount back to wallet
    await creditWallet(
      withdrawal.userId,
      withdrawal.amount,
      'refund',
      `Withdrawal rejected: ${body.reason || 'Rejected by admin'}`,
      undefined
    )
    await db.withdrawal.update({
      where: { id: withdrawal.id },
      data: { status: 'rejected', reviewedAt: new Date(), rejectReason: body.reason || 'Rejected by admin' },
    })
    await db.notification.create({
      data: {
        userId: withdrawal.userId,
        title: 'Withdrawal Rejected',
        message: `Your withdrawal request was rejected. Reason: ${body.reason || 'Rejected by admin'}. The amount has been refunded to your wallet.`,
        type: 'error',
      },
    })
  }

  return NextResponse.json({ ok: true })
}
