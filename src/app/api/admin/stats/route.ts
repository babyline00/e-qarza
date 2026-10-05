import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'

// GET /api/admin/stats — aggregate platform metrics for admin analytics
export async function GET() {
  const u = await getSessionUser()
  if (!u || u.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const [
    totalUsers,
    activeUsers,
    kycPending,
    kycApproved,
    totalApplications,
    activeLoans,
    completedLoans,
    pendingPayments,
    totalDisbursed,   // sum of principal of active+completed
    totalCollected,  // sum of approved payments
    plans,
  ] = await Promise.all([
    db.user.count({ where: { role: 'user' } }),
    db.user.count({ where: { role: 'user', stage: 'active' } }),
    db.kycProfile.count({ where: { status: 'submitted' } }),
    db.kycProfile.count({ where: { status: 'approved' } }),
    db.loanApplication.count(),
    db.loanApplication.count({ where: { status: 'active' } }),
    db.loanApplication.count({ where: { status: 'completed' } }),
    db.payment.count({ where: { status: 'submitted' } }),
    db.loanApplication.aggregate({ where: { status: { in: ['active', 'completed'] } }, _sum: { amount: true } }),
    db.payment.aggregate({ where: { status: 'approved' }, _sum: { amount: true } }),
    db.loanPlan.findMany({ orderBy: { amount: 'asc' } }),
  ])

  // disbursement by plan (for bar chart)
  const byPlan = await Promise.all(
    plans.map(async (p) => {
      const apps = await db.loanApplication.aggregate({
        where: { planId: p.id, status: { in: ['active', 'completed'] } },
        _count: true,
        _sum: { amount: true },
      })
      return { name: p.name, count: apps._count, amount: apps._sum.amount || 0 }
    })
  )

  // last 6 months applications + disbursement (for line chart)
  const months: { label: string; apps: number; disbursed: number }[] = []
  const now = new Date()
  for (let i = 5; i >= 0; i--) {
    const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 1)
    const [apps, disb] = await Promise.all([
      db.loanApplication.count({ where: { appliedAt: { gte: start, lt: end } } }),
      db.loanApplication.aggregate({
        where: { activatedAt: { gte: start, lt: end }, status: { in: ['active', 'completed'] } },
        _sum: { amount: true },
      }),
    ])
    months.push({
      label: start.toLocaleString('en', { month: 'short' }),
      apps,
      disbursed: disb._sum.amount || 0,
    })
  }

  // payment status breakdown (for pie chart)
  const [approved, submitted, rejected] = await Promise.all([
    db.payment.count({ where: { status: 'approved' } }),
    db.payment.count({ where: { status: 'submitted' } }),
    db.payment.count({ where: { status: 'rejected' } }),
  ])

  return NextResponse.json({
    stats: {
      totals: {
        users: totalUsers,
        activeUsers,
        kycPending,
        kycApproved,
        totalApplications,
        activeLoans,
        completedLoans,
        pendingPayments,
        totalDisbursed: totalDisbursed._sum.amount || 0,
        totalCollected: totalCollected._sum.amount || 0,
      },
      byPlan,
      monthlyTrend: months,
      paymentStatus: { approved, submitted, rejected },
    },
  })
}
