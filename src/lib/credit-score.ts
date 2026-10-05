import { db } from './db'

// Credit score system — computes a 300-900 score based on repayment history.
// Factors:
// - Payment completion ratio (on-time vs total installments) — 40%
// - Completed loans — 20%
// - Total volume repaid — 15%
// - Overdue history penalty — 15%
// - KYC verification — 10%
export interface CreditScore {
  score: number // 300-900
  rating: 'poor' | 'fair' | 'good' | 'excellent'
  factors: {
    onTimePayments: number
    totalInstallments: number
    completedLoans: number
    totalRepaid: number // paisa
    overdueCount: number
    kycVerified: boolean
  }
  maxAmount: number // recommended max loan (paisa) based on score
}

const BASE = 300
const MAX = 900

export async function computeCreditScore(userId: string): Promise<CreditScore> {
  const [applications, kyc] = await Promise.all([
    db.loanApplication.findMany({
      where: { userId },
      include: { installments: true, payments: true },
    }),
    db.kycProfile.findUnique({ where: { userId } }),
  ])

  const allInstallments = applications.flatMap((a) => a.installments)
  const totalInstallments = allInstallments.length
  const onTimePayments = allInstallments.filter((i) => i.status === 'paid').length
  const overdueCount = allInstallments.filter((i) => i.status === 'overdue').length
  const completedLoans = applications.filter((a) => a.status === 'completed').length

  // total repaid (approved payments)
  const approvedPayments = applications.flatMap((a) => a.payments).filter((p) => p.status === 'approved')
  const totalRepaid = approvedPayments.reduce((s, p) => s + p.amount, 0)
  const kycVerified = kyc?.status === 'approved'

  // --- score computation ---
  let score = BASE

  // payment completion ratio (40% = 240 pts)
  if (totalInstallments > 0) {
    const ratio = onTimePayments / totalInstallments
    score += Math.round(ratio * 240)
  } else if (kycVerified) {
    // no installments yet but verified → small bonus
    score += 30
  }

  // completed loans (20% = 120 pts), max 2 loans counted
  score += Math.min(completedLoans, 2) * 60

  // total volume repaid (15% = 90 pts) — scale by 100k rupee increments up to 5
  const repaidRupees = totalRepaid / 100
  const volumeScore = Math.min(Math.floor(repaidRupees / 100000), 5) * 18
  score += volumeScore

  // overdue penalty (15% = up to -90 pts)
  score -= Math.min(overdueCount * 30, 90)

  // KYC verification (10% = 60 pts)
  if (kycVerified) score += 60

  score = Math.max(BASE, Math.min(MAX, score))

  const rating =
    score >= 750 ? 'excellent' :
    score >= 650 ? 'good' :
    score >= 550 ? 'fair' : 'poor'

  // recommended max loan based on score tier
  const maxAmount =
    score >= 750 ? 20000000 :  // Rs 200,000
    score >= 650 ? 10000000 :  // Rs 100,000
    score >= 550 ? 5000000 :   // Rs 50,000
    2500000                    // Rs 25,000

  return {
    score,
    rating,
    factors: {
      onTimePayments,
      totalInstallments,
      completedLoans,
      totalRepaid,
      overdueCount,
      kycVerified,
    },
    maxAmount,
  }
}
