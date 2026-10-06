'use client'

import { useAppStore, type View } from './store'

// Decide which view to show based on user stage + kyc status + latest application status.
// This is the single source of truth for SPA routing.
//
// The dashboard is gated behind an approved KYC: any stage that would otherwise
// land on the dashboard is redirected unless kycStatus === 'approved'.
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
  if (stage === 'rejected') return 'kyc' // let them re-submit if rejected at kyc

  // 'active', 'fee_paid' and any unrecognised stage land here. Only an approved
  // KYC may reach the dashboard — otherwise fall back to the KYC screens.
  if (kycStatus === 'approved') return stage === 'active' ? 'active' : 'dashboard'
  if (kycStatus === 'submitted') return 'kyc_pending'
  return 'kyc'
}

export function useResolvedView(): View {
  const { user, kyc, applications, activeView } = useAppStore()
  if (!user) return 'auth'
  // If the user explicitly navigated somewhere allowed, respect it
  const latestApp = applications[0]
  const auto = resolveView(user.stage, kyc?.status, latestApp?.status)
  // Free navigation only once active *and* KYC-approved
  if (user.stage === 'active' && kyc?.status === 'approved') {
    return activeView === 'auth' ? 'dashboard' : activeView
  }
  return auto
}
