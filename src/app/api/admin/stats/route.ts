import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { processScheduledBroadcasts } from '@/lib/scheduled-broadcast'

// GET /api/admin/stats — aggregate platform metrics for admin analytics
export async function GET() {
  const u = await getSessionUser()
  if (!u || u.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  // lazily process any due scheduled broadcasts
  await processScheduledBroadcasts()

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

  // repayment rate by plan (paid installments / total installments)
  const repaymentByPlan = await Promise.all(
    plans.map(async (p) => {
      const apps = await db.loanApplication.findMany({
        where: { planId: p.id, status: { in: ['active', 'completed'] } },
        include: { installments: { select: { status: true } } },
      })
      const allInstallments = apps.flatMap((a) => a.installments)
      const total = allInstallments.length
      const paid = allInstallments.filter((i) => i.status === 'paid').length
      const rate = total > 0 ? Math.round((paid / total) * 100) : 0
      return { name: p.name, rate, paid, total }
    })
  )

  // recent activity: last 8 new users + last 8 applications
  const [recentUsers, recentApps, overdueInstallments, newUsersThisMonth] = await Promise.all([
    db.user.findMany({
      where: { role: 'user' },
      orderBy: { createdAt: 'desc' },
      take: 5,
      select: { id: true, name: true, email: true, createdAt: true, stage: true },
    }),
    db.loanApplication.findMany({
      orderBy: { appliedAt: 'desc' },
      take: 5,
      include: {
        user: { select: { name: true, email: true } },
        plan: { select: { name: true } },
      },
    }),
    db.installment.count({ where: { status: 'overdue' } }),
    db.user.count({
      where: {
        role: 'user',
        createdAt: { gte: new Date(now.getFullYear(), now.getMonth(), 1) },
      },
    }),
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
        overdueInstallments,
        newUsersThisMonth,
      },
      byPlan,
      monthlyTrend: months,
      paymentStatus: { approved, submitted, rejected },
      repaymentByPlan,
      recentUsers: recentUsers.map((u) => ({
        id: u.id,
        name: u.name || u.email,
        email: u.email,
        stage: u.stage,
        createdAt: u.createdAt.toISOString(),
      })),
      recentApplications: recentApps.map((a) => ({
        id: a.id,
        userName: a.user.name || a.user.email,
        planName: a.plan.name,
        amount: a.amount,
        status: a.status,
        appliedAt: a.appliedAt.toISOString(),
      })),
    },
  })
}
