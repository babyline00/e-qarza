import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET /api/transactions/export — download current user's transactions as CSV
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const payments = await db.payment.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    include: { application: { include: { plan: { select: { name: true } } } } },
  })

  const headers = ['Date', 'Type', 'Plan', 'Amount (Rs)', 'Status', 'Txn Ref', 'Reviewed']
  const rows = await Promise.all(
    payments.map(async (p) => {
      let installmentNumber: number | null = null
      if (p.type === 'installment') {
        const inst = await db.installment.findFirst({ where: { paymentId: p.id } })
        installmentNumber = inst?.number || null
      }
      return [
        p.createdAt.toISOString().slice(0, 19),
        p.type === 'processing_fee' ? 'Processing Fee' : `Installment #${installmentNumber || '?'}`,
        p.application?.plan.name || '',
        String(p.amount / 100),
        p.status,
        p.txnRef || '',
        p.reviewedAt?.toISOString().slice(0, 19) || '',
      ]
    })
  )

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="e-qarza-transactions-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
