'use client'

import { useAppStore, type View } from './store'

// Decide which view to show based on user stage + kyc status + latest application status.
// This is the single source of truth for SPA routing.
export function resolveView(
  stage: string,
  kycStatus?: string | null,
  appStatus?: string | null
): View {
  if (stage === 'auth') return 'auth'
  if (stage === 'kyc') return 'kyc'
  if (stage === 'kyc_pending') return 'kyc_pending'
  if (stage === 'loan_select') return 'loan_select'
  if (stage === 'fee_pending') {
    // show fee payment form if not yet submitted, else waiting
    if (appStatus === 'fee_submitted') return 'fee_pending'
    return 'fee_payment'
  }
  if (stage === 'active') return 'active'
  if (stage === 'rejected') return 'kyc' // let them re-submit if rejected at kyc
  return 'dashboard'
}

export function useResolvedView(): View {
  const { user, kyc, applications, activeView } = useAppStore()
  if (!user) return 'auth'
  // If the user explicitly navigated somewhere allowed, respect it
  const latestApp = applications[0]
  const auto = resolveView(user.stage, kyc?.status, latestApp?.status)
  // Only allow free navigation once active / dashboard-capable
  if (user.stage === 'active') {
    return activeView === 'auth' ? 'dashboard' : activeView
  }
  return auto
}
