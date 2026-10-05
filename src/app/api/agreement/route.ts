import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { loanTotals } from '@/lib/format'

// GET /api/agreement?applicationId=<id> — fetch full loan agreement data
export async function GET(req: NextRequest) {
  const user = await getSessionUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const applicationId = new URL(req.url).searchParams.get('applicationId')
  if (!applicationId) return NextResponse.json({ error: 'applicationId required' }, { status: 400 })

  const app = await db.loanApplication.findFirst({
    where: { id: applicationId, userId: user.id },
    include: {
      plan: { select: { name: true } },
      installments: { orderBy: { number: 'asc' } },
    },
  })
  if (!app) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (app.status !== 'active' && app.status !== 'completed') {
    return NextResponse.json({ error: 'Loan not active' }, { status: 400 })
  }

  const kyc = await db.kycProfile.findUnique({ where: { userId: user.id } })
  const t = loanTotals(app.amount, app.interestRate, app.tenureMonths)

  return NextResponse.json({
    agreement: {
      agreementNo: `EQL-${app.id.slice(-8).toUpperCase()}`,
      activatedAt: app.activatedAt?.toISOString() || app.appliedAt.toISOString(),
      lender: {
        name: 'E-Qarza Pvt Ltd',
        address: 'Plot 12, I.I. Chundrigar Road, Karachi, Pakistan',
        email: 'help@e-qarza.pk',
      },
      borrower: {
        name: kyc?.cnicName || user.name || '—',
        fatherName: kyc?.fatherName || '—',
        cnicDob: kyc?.dob || '—',
        phone: kyc?.phoneNumber || user.phone || '—',
        address: kyc?.address || '—',
        city: kyc?.city || '—',
        email: user.email,
      },
      loan: {
        planName: app.plan.name,
        principal: app.amount,
        interestRate: app.interestRate,
        tenureMonths: app.tenureMonths,
        processingFee: app.processingFee,
        totalInterest: t.totalInterest,
        totalPayable: t.totalPayable,
        monthlyInstallment: t.monthlyInstallment,
        status: app.status,
      },
      schedule: app.installments.map((i) => ({
        number: i.number,
        dueDate: i.dueDate,
        amount: i.amount,
        status: i.status,
      })),
    },
  })
}
