import { NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { computeCreditScore } from '@/lib/credit-score'

// GET /api/plans — list active loan plans, with credit-based discount for good scores
export async function GET() {
  const plans = await db.loanPlan.findMany({
    where: { active: true },
    orderBy: { amount: 'asc' },
  })

  // compute credit-based discount for the logged-in user
  let discountPct = 0
  let creditRating: string | null = null
  let completedLoans = 0
  const user = await getSessionUser()
  if (user && user.role !== 'admin') {
    const score = await computeCreditScore(user.id)
    creditRating = score.rating
    completedLoans = score.factors.completedLoans
    // discount tiers based on credit rating
    if (score.rating === 'excellent') discountPct = 25
    else if (score.rating === 'good') discountPct = 15
    else if (score.rating === 'fair') discountPct = 5
  }

  const plansWithDiscount = plans.map((p) => {
    const discountedFee = discountPct > 0
      ? Math.round(p.processingFee * (1 - discountPct / 100))
      : p.processingFee
    return {
      ...p,
      originalProcessingFee: discountPct > 0 ? p.processingFee : null,
      processingFee: discountedFee,
      discountPct: discountPct > 0 ? discountPct : null,
    }
  })

  return NextResponse.json({
    plans: plansWithDiscount,
    credit: creditRating ? { rating: creditRating, discountPct, completedLoans } : null,
  })
}
