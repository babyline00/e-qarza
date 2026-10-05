import { db } from './db'

// Loan eligibility rules:
// - Monthly installment must not exceed 40% of monthly income (debt-to-income ratio)
// - Minimum income threshold: Rs 10,000/month
// Returns eligibility result + reason
export interface EligibilityResult {
  eligible: boolean
  reason: string
  maxAffordableAmount: number // minor units (paisa) — max loan this user can afford
  dti: number | null // debt-to-income ratio % (null if income unknown)
}

const MAX_DTI = 0.40 // 40% max debt-to-income
const MIN_INCOME = 1000000 // Rs 10,000 in paisa

export async function checkEligibility(userId: string, planAmount: number, interestRate: number, tenureMonths: number): Promise<EligibilityResult> {
  const kyc = await db.kycProfile.findUnique({ where: { userId } })
  const income = kyc?.monthlyIncome // in paisa

  if (income == null || income <= 0) {
    return {
      eligible: false,
      reason: 'Please complete your KYC with monthly income to apply for loans.',
      maxAffordableAmount: 0,
      dti: null,
    }
  }

  if (income < MIN_INCOME) {
    return {
      eligible: false,
      reason: `Minimum monthly income of Rs 10,000 required. Your declared income is Rs ${(income / 100).toLocaleString('en-PK')}.`,
      maxAffordableAmount: 0,
      dti: null,
    }
  }

  // compute the monthly installment for this plan (flat interest)
  const totalInterest = Math.round((planAmount * interestRate * tenureMonths) / (100 * 12))
  const totalPayable = planAmount + totalInterest
  const monthlyInstallment = Math.round(totalPayable / tenureMonths)

  // convert installment to rupees for DTI calc
  const installmentRs = monthlyInstallment / 100
  const incomeRs = income / 100
  const dti = installmentRs / incomeRs

  if (dti > MAX_DTI) {
    return {
      eligible: false,
      reason: `Monthly installment of Rs ${installmentRs.toLocaleString('en-PK', { maximumFractionDigits: 0 })} exceeds 40% of your income (Rs ${incomeRs.toLocaleString('en-PK', { maximumFractionDigits: 0 })}). Please choose a smaller plan or longer tenure.`,
      maxAffordableAmount: computeMaxAffordable(income, interestRate, tenureMonths),
      dti: Math.round(dti * 100),
    }
  }

  return {
    eligible: true,
    reason: `You're eligible! Monthly installment (Rs ${installmentRs.toLocaleString('en-PK', { maximumFractionDigits: 0 })}) is ${Math.round(dti * 100)}% of your income — within the 40% limit.`,
    maxAffordableAmount: computeMaxAffordable(income, interestRate, tenureMonths),
    dti: Math.round(dti * 100),
  }
}

// Given income + rate + tenure, compute the max loan amount where DTI stays at 40%
function computeMaxAffordable(income: number, interestRate: number, tenureMonths: number): number {
  const incomeRs = income / 100
  const maxInstallment = incomeRs * MAX_DTI
  // installment = (principal * (1 + rate*tenure/1200)) / tenure
  // principal = installment * tenure / (1 + rate*tenure/1200)
  const factor = 1 + (interestRate * tenureMonths) / 1200
  const maxPrincipal = Math.floor((maxInstallment * tenureMonths) / factor)
  return Math.round(maxPrincipal * 100) // back to paisa
}
