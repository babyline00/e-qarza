import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { computeCreditScore } from '@/lib/credit-score'

// GET /api/admin/users/[id] — full detail for a single user (applications, payments, credit score, history)
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getSessionUser()
  if (!admin || admin.role !== 'admin') return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const { id } = await params
  const user = await db.user.findUnique({
    where: { id },
    include: {
      kycProfile: true,
      applications: {
        orderBy: { appliedAt: 'desc' },
        include: {
          plan: { select: { name: true } },
          installments: { orderBy: { number: 'asc' }, select: { id: true, number: true, dueDate: true, amount: true, status: true, paidAt: true } },
          payments: { orderBy: { createdAt: 'desc' } },
        },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
        include: { application: { include: { plan: { select: { name: true } } } } },
      },
    },
  })
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  if (user.role === 'admin') return NextResponse.json({ error: 'Cannot view admin details' }, { status: 400 })

  const credit = await computeCreditScore(user.id)
  const scoreHistory = await db.creditScoreHistory.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
    take: 30,
  })

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      stage: user.stage,
      banned: user.banned,
      avatarPath: user.avatarPath,
      createdAt: user.createdAt.toISOString(),
      kyc: user.kycProfile
        ? {
            status: user.kycProfile.status,
            cnicName: user.kycProfile.cnicName,
            fatherName: user.kycProfile.fatherName,
            dob: user.kycProfile.dob,
            phoneNumber: user.kycProfile.phoneNumber,
            city: user.kycProfile.city,
            occupation: user.kycProfile.occupation,
            monthlyIncome: user.kycProfile.monthlyIncome,
            employment: user.kycProfile.employment,
            rejectReason: user.kycProfile.rejectReason,
            submittedAt: user.kycProfile.submittedAt?.toISOString() || null,
          }
        : null,
      applications: user.applications.map((a) => ({
        id: a.id,
        planName: a.plan.name,
        amount: a.amount,
        status: a.status,
        appliedAt: a.appliedAt.toISOString(),
        activatedAt: a.activatedAt?.toISOString() || null,
        rejectReason: a.rejectReason,
        installmentCount: a.installments.length,
        paidInstallments: a.installments.filter((i) => i.status === 'paid').length,
      })),
      payments: user.payments.map((p) => ({
        id: p.id,
        type: p.type,
        amount: p.amount,
        status: p.status,
        txnRef: p.txnRef,
        createdAt: p.createdAt.toISOString(),
        reviewedAt: p.reviewedAt?.toISOString() || null,
        planName: p.application?.plan.name || null,
      })),
      creditScore: credit,
      scoreHistory: scoreHistory.map((h) => ({
        id: h.id,
        score: h.score,
        rating: h.rating,
        createdAt: h.createdAt.toISOString(),
      })),
    },
  })
}
