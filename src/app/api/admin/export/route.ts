import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET /api/admin/export?type=users|payments|applications — download CSV
export async function GET(req: NextRequest) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const type = new URL(req.url).searchParams.get('type') as 'users' | 'payments' | 'applications'
  if (!['users', 'payments', 'applications'].includes(type)) {
    return NextResponse.json({ error: 'Invalid type' }, { status: 400 })
  }

  let headers: string[]
  let rows: string[][]

  if (type === 'users') {
    const users = await db.user.findMany({
      where: { role: 'user' },
      orderBy: { createdAt: 'desc' },
      include: { kycProfile: { select: { status: true, cnicName: true, city: true, phoneNumber: true } }, _count: { select: { applications: true } } },
    })
    headers = ['ID', 'Name', 'Email', 'Phone', 'Stage', 'Banned', 'KYC Status', 'KYC Name', 'City', 'Applications', 'Joined']
    rows = users.map((u) => [
      u.id, u.name || '', u.email, u.phone || '', u.stage, String(u.banned),
      u.kycProfile?.status || 'none', u.kycProfile?.cnicName || '', u.kycProfile?.city || '',
      String(u._count.applications), u.createdAt.toISOString().slice(0, 19),
    ])
  } else if (type === 'payments') {
    const payments = await db.payment.findMany({
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, application: { include: { plan: { select: { name: true } } } } },
    })
    headers = ['ID', 'User', 'Email', 'Type', 'Amount (Rs)', 'Status', 'Txn Ref', 'Plan', 'Created', 'Reviewed']
    rows = payments.map((p) => [
      p.id, p.user.name || '', p.user.email, p.type, String(p.amount / 100), p.status,
      p.txnRef || '', p.application?.plan.name || '', p.createdAt.toISOString().slice(0, 19),
      p.reviewedAt?.toISOString().slice(0, 19) || '',
    ])
  } else {
    const apps = await db.loanApplication.findMany({
      orderBy: { appliedAt: 'desc' },
      include: { user: { select: { name: true, email: true } }, plan: { select: { name: true } }, _count: { select: { installments: true } } },
    })
    headers = ['ID', 'User', 'Email', 'Plan', 'Amount (Rs)', 'Rate %', 'Tenure (mo)', 'Fee (Rs)', 'Status', 'Applied', 'Activated']
    rows = apps.map((a) => [
      a.id, a.user.name || '', a.user.email, a.plan.name, String(a.amount / 100), String(a.interestRate),
      String(a.tenureMonths), String(a.processingFee / 100), a.status,
      a.appliedAt.toISOString().slice(0, 19), a.activatedAt?.toISOString().slice(0, 19) || '',
    ])
  }

  // build CSV
  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`
  const csv = [headers, ...rows].map((r) => r.map(escape).join(',')).join('\n')

  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="e-qarza-${type}-${new Date().toISOString().slice(0, 10)}.csv"`,
    },
  })
}
