import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { syncOverdueStatus } from '@/lib/overdue'
import { computeCreditScore } from '@/lib/credit-score'

// GET /api/me — aggregate state used by the SPA to route
export async function GET() {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ user: null, kyc: null, applications: [], notifications: [], banks: [], plans: [], credit: null })

  // lazily flag overdue installments
  await syncOverdueStatus()

  const [applications, notifications, banks, plans] = await Promise.all([
    db.loanApplication.findMany({
      where: { userId: user.id },
      orderBy: { appliedAt: 'desc' },
      include: {
        plan: { select: { name: true } },
        installments: { orderBy: { number: 'asc' } },
        payments: { orderBy: { createdAt: 'desc' } },
      },
    }),
    db.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' }, take: 50 }),
    db.bankDetail.findMany({ where: { active: true }, orderBy: { createdAt: 'asc' } }),
    db.loanPlan.findMany({ where: { active: true }, orderBy: { amount: 'asc' } }),
  ])

  // compute credit-based discount
  let discountPct = 0
  let creditRating: string | null = null
  let completedLoans = 0
  if (user.role !== 'admin') {
    const score = await computeCreditScore(user.id)
    creditRating = score.rating
    completedLoans = score.factors.completedLoans
    if (score.rating === 'excellent') discountPct = 25
    else if (score.rating === 'good') discountPct = 15
    else if (score.rating === 'fair') discountPct = 5
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      stage: user.stage,
      avatarPath: user.avatarPath,
    },
    kyc: user.kycProfile
      ? {
          status: user.kycProfile.status,
          cnicName: user.kycProfile.cnicName,
          cnicNumber: user.kycProfile.cnicNumber,
          fatherName: user.kycProfile.fatherName,
          dob: user.kycProfile.dob,
          phoneNumber: user.kycProfile.phoneNumber,
          cnicFrontPath: user.kycProfile.cnicFrontPath,
          cnicBackPath: user.kycProfile.cnicBackPath,
          selfiePath: user.kycProfile.selfiePath,
          education: user.kycProfile.education,
          maritalStatus: user.kycProfile.maritalStatus,
          gender: user.kycProfile.gender,
          city: user.kycProfile.city,
          address: user.kycProfile.address,
          occupation: user.kycProfile.occupation,
          monthlyIncome: user.kycProfile.monthlyIncome,
          employment: user.kycProfile.employment,
          referenceName: user.kycProfile.referenceName,
          referencePhone: user.kycProfile.referencePhone,
          referenceRelation: user.kycProfile.referenceRelation,
          rejectReason: user.kycProfile.rejectReason,
        }
      : null,
    applications: applications.map((a) => ({
      id: a.id,
      planName: a.plan.name,
      amount: a.amount,
      interestRate: a.interestRate,
      tenureMonths: a.tenureMonths,
      processingFee: a.processingFee,
      status: a.status,
      rejectReason: a.rejectReason,
      appliedAt: a.appliedAt.toISOString(),
      activatedAt: a.activatedAt?.toISOString() || null,
      installments: a.installments.map((i) => ({
        id: i.id,
        number: i.number,
        dueDate: i.dueDate,
        amount: i.amount,
        status: i.status,
        paidAt: i.paidAt?.toISOString() || null,
        paymentId: i.paymentId || null,
      })),
      feePayment: a.payments.find((p) => p.type === 'processing_fee') || null,
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      title: n.title,
      message: n.message,
      type: n.type,
      channel: n.channel,
      deliveryStatus: n.deliveryStatus,
      read: n.read,
      createdAt: n.createdAt.toISOString(),
    })),
    banks: banks.map((b) => ({
      id: b.id,
      bankName: b.bankName,
      accountTitle: b.accountTitle,
      accountNumber: b.accountNumber,
      iban: b.iban,
    })),
    plans: plans.map((p) => {
      const discountedFee = discountPct > 0
        ? Math.round(p.processingFee * (1 - discountPct / 100))
        : p.processingFee
      return {
        id: p.id,
        name: p.name,
        amount: p.amount,
        interestRate: p.interestRate,
        tenureMonths: p.tenureMonths,
        processingFee: discountedFee,
        description: p.description,
        originalProcessingFee: discountPct > 0 ? p.processingFee : null,
        discountPct: discountPct > 0 ? discountPct : null,
      }
    }),
    credit: creditRating ? { rating: creditRating, discountPct, completedLoans } : null,
  })
}
