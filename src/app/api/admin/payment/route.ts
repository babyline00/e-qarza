import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { creditWallet } from '@/lib/wallet'

async function requireAdmin() {
  const user = await getSessionUser()
  if (!user || user.role !== 'admin') return null
  return user
}

// GET /api/admin/payment — list submitted payments awaiting verification
export async function GET() {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const payments = await db.payment.findMany({
    where: { status: 'submitted' },
    orderBy: { createdAt: 'asc' },
    include: {
      user: { select: { id: true, email: true, name: true } },
    },
  })

  // enrich with plan name + installment number
  const enriched = await Promise.all(
    payments.map(async (p) => {
      const app = p.applicationId
        ? await db.loanApplication.findUnique({
            where: { id: p.applicationId },
            include: { plan: { select: { name: true } } },
          })
        : null
      const installment = p.type === 'installment'
        ? await db.installment.findFirst({ where: { paymentId: p.id } })
        : null
      return {
        id: p.id,
        userId: p.userId,
        userEmail: p.user.email,
        userName: p.user.name,
        applicationId: p.applicationId,
        type: p.type,
        amount: p.amount,
        status: p.status,
        txnRef: p.txnRef,
        proofPath: p.proofPath,
        createdAt: p.createdAt.toISOString(),
        planName: app?.plan?.name || null,
        installmentNumber: installment?.number || null,
      }
    })
  )

  return NextResponse.json({ payments: enriched })
}

// POST /api/admin/payment — approve or reject { paymentId, action: 'approve'|'reject', reason? }
export async function POST(req: NextRequest) {
  const admin = await requireAdmin()
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  let body: { paymentId?: string; action?: string; reason?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid body' }, { status: 400 })
  }
  if (!body.paymentId || !['approve', 'reject'].includes(body.action || '')) {
    return NextResponse.json({ error: 'paymentId and action required' }, { status: 400 })
  }

  const payment = await db.payment.findUnique({ where: { id: body.paymentId! } })
  if (!payment) return NextResponse.json({ error: 'Payment not found' }, { status: 404 })
  if (payment.status !== 'submitted') {
    return NextResponse.json({ error: 'Payment already reviewed' }, { status: 400 })
  }

  if (body.action === 'approve') {
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'approved', reviewedAt: new Date(), rejectReason: null },
    })

    if (payment.type === 'processing_fee' && payment.applicationId) {
      // activate loan + generate installments
      const app = await db.loanApplication.findUnique({
        where: { id: payment.applicationId },
        include: { installments: true },
      })
      if (app && app.status === 'fee_submitted') {
        // flat interest: total = principal * (1 + rate/100 * tenure/12)
        const principal = app.amount
        const totalInterest = Math.round((principal * app.interestRate * app.tenureMonths) / (100 * 12))
        const totalPayable = principal + totalInterest
        const installmentAmount = Math.round(totalPayable / app.tenureMonths)

        const installments: { number: number; dueDate: string; amount: number; applicationId: string; status: string }[] = []
        const start = new Date()
        for (let i = 1; i <= app.tenureMonths; i++) {
          const due = new Date(start.getFullYear(), start.getMonth() + i, start.getDate())
          installments.push({
            number: i,
            dueDate: due.toISOString().slice(0, 10),
            amount: installmentAmount,
            applicationId: app.id,
            status: 'pending',
          })
        }
        await db.installment.createMany({ data: installments })
        await db.loanApplication.update({
          where: { id: app.id },
          data: { status: 'active', activatedAt: new Date() },
        })
        await db.user.update({ where: { id: payment.userId }, data: { stage: 'active' } })

        // Disburse loan principal to wallet (loan amount minus processing fee)
        const disbursementAmount = app.amount - app.processingFee
        await creditWallet(
          payment.userId,
          disbursementAmount,
          'loan_disbursement',
          `Loan disbursement: ${app.planName} plan`,
          app.id
        )

        await db.notification.create({
          data: {
            userId: payment.userId,
            title: 'Loan Activated 🎉',
            message: `Your ${app.tenureMonths}-month loan is now active. Rs ${(disbursementAmount / 100).toLocaleString()} has been credited to your E-Qarza wallet. First installment due ${installments[0]?.dueDate}.`,
            type: 'success',
          },
        })
      }
    } else if (payment.type === 'installment') {
      // mark installment paid
      const inst = await db.installment.findFirst({ where: { paymentId: payment.id } })
      if (inst) {
        await db.installment.update({
          where: { id: inst.id },
          data: { status: 'paid', paidAt: new Date() },
        })
        // check completion
        const app = await db.loanApplication.findUnique({
          where: { id: inst.applicationId },
          include: { installments: true },
        })
        if (app && app.installments.every((i) => i.status === 'paid')) {
          await db.loanApplication.update({ where: { id: app.id }, data: { status: 'completed' } })
          // reset user stage to loan_select so they can apply for a new loan (refinancing)
          await db.user.update({ where: { id: app.userId }, data: { stage: 'loan_select' } })
          await db.notification.create({
            data: {
              userId: app.userId,
              title: 'Loan Completed 🎉',
              message: 'Congratulations! You have paid off your loan in full. You can now apply for a new loan if needed.',
              type: 'success',
            },
          })
        } else {
          await db.notification.create({
            data: {
              userId: payment.userId,
              title: `Installment #${inst.number} Paid`,
              message: `Installment #${inst.number} has been verified and marked paid.`,
              type: 'success',
            },
          })
        }
      }
    }
  } else {
    // reject
    await db.payment.update({
      where: { id: payment.id },
      data: { status: 'rejected', reviewedAt: new Date(), rejectReason: body.reason || 'Proof invalid' },
    })
    if (payment.type === 'processing_fee' && payment.applicationId) {
      await db.loanApplication.update({
        where: { id: payment.applicationId },
        data: { status: 'fee_pending', feePaymentId: null },
      })
    } else if (payment.type === 'installment') {
      const inst = await db.installment.findFirst({ where: { paymentId: payment.id } })
      if (inst) {
        await db.installment.update({ where: { id: inst.id }, data: { status: 'pending', paymentId: null } })
      }
    }
    await db.notification.create({
      data: {
        userId: payment.userId,
        title: 'Payment Rejected',
        message: `Your ${payment.type === 'processing_fee' ? 'processing fee' : 'installment'} payment was rejected. ${body.reason || 'Please submit a valid proof.'}`,
        type: 'error',
      },
    })
  }

  return NextResponse.json({ ok: true })
}
