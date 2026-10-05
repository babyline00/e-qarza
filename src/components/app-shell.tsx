'use client'

import { useEffect, useCallback } from 'react'
import { useAppStore } from '@/lib/store'
import { resolveView } from '@/lib/router'
import { api } from '@/lib/api-client'
import { AuthView } from '@/components/views/auth-view'
import { KycView } from '@/components/views/kyc-view'
import { KycPendingView } from '@/components/views/kyc-pending-view'
import { LoanSelectView } from '@/components/views/loan-select-view'
import { FeePaymentView } from '@/components/views/fee-payment-view'
import { FeePendingView } from '@/components/views/fee-pending-view'
import { DashboardView } from '@/components/views/dashboard-view'
import { ProfileView } from '@/components/views/profile-view'
import { MyLoansView } from '@/components/views/my-loans-view'
import { NotificationsView } from '@/components/views/notifications-view'
import { HelpView } from '@/components/views/help-view'
import { TransactionsView } from '@/components/views/transactions-view'
import { AdminView } from '@/components/views/admin-view'
import { DashboardSkeleton } from '@/components/shared/dashboard-skeleton'
import { KeyboardShortcutsHelp } from '@/components/shared/keyboard-shortcuts-help'
import { OnboardingTour } from '@/components/shared/onboarding-tour'
import { TopNav } from '@/components/layout/top-nav'
import { Footer } from '@/components/layout/footer'
import { useKeyboardShortcuts } from '@/lib/use-keyboard-shortcuts'
import { Loader2 } from 'lucide-react'

interface MeResponse {
  user: {
    id: string
    email: string
    name: string | null
    phone: string | null
    role: string
    stage: string
  } | null
  kyc: Record<string, unknown> | null
  applications: Record<string, unknown>[]
  notifications: Record<string, unknown>[]
  banks: Record<string, unknown>[]
  plans: Record<string, unknown>[]
}

export function AppShell() {
  const {
    user, kyc, applications, activeView, loading,
    setUser, setKyc, setApplications, setNotifications, setBankDetails, setPlans, setLoading, setView, logout,
  } = useAppStore()

  const refresh = useCallback(async () => {
    try {
      const data = await api<MeResponse>('/api/me')
      setUser(data.user as never)
      setKyc(data.kyc as never)
      setApplications(data.applications as never)
      setNotifications(data.notifications as never)
      setBankDetails(data.banks as never)
      setPlans(data.plans as never)
      if (!data.user) setView('auth')
    } catch {
      // ignore — keep current state
    } finally {
      setLoading(false)
    }
  }, [setUser, setKyc, setApplications, setNotifications, setBankDetails, setPlans, setLoading, setView])

  useEffect(() => {
    refresh()
    // poll every 12s so verification / admin approvals reflect quickly
    const t = setInterval(refresh, 12000)
    return () => clearInterval(t)
  }, [refresh])

  const handleLogout = useCallback(async () => {
    try {
      await api('/api/auth/logout', { method: 'POST' })
    } catch {
      /* ignore */
    }
    logout()
  }, [logout])

  // keyboard shortcuts — must be called unconditionally (hooks rules)
  // enabled only for active regular users
  useKeyboardShortcuts({ onNavigate: setView, enabled: !!user && user.role !== 'admin' && user.stage === 'active' })

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <div className="sticky top-0 z-40 h-16 border-b bg-brand-gradient" />
        <main className="flex-1">
          <DashboardSkeleton />
        </main>
        <Footer />
      </div>
    )
  }

  // Not authenticated
  if (!user) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <main className="flex-1 flex flex-col">
          <AuthView onAuthed={refresh} />
        </main>
        <Footer />
      </div>
    )
  }

  // Admin
  if (user.role === 'admin') {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <TopNav onLogout={handleLogout} onRefresh={refresh} />
        <main className="flex-1">
          <AdminView />
        </main>
        <Footer />
      </div>
    )
  }

  // Resolve view for regular user
  const latestApp = applications[0] as { status?: string } | undefined
  const autoView = resolveView(user.stage, kyc?.status as string | undefined, latestApp?.status)
  // active users can navigate freely among dashboard views
  const view = user.stage === 'active' ? (activeView === 'auth' ? 'dashboard' : activeView) : autoView

  let content: React.ReactNode = null
  switch (view) {
    case 'auth':
      content = <AuthView onAuthed={refresh} />
      break
    case 'kyc':
      content = <KycView onDone={refresh} />
      break
    case 'kyc_pending':
      content = <KycPendingView onRefresh={refresh} />
      break
    case 'loan_select':
      content = <LoanSelectView onApplied={refresh} />
      break
    case 'fee_payment':
      content = <FeePaymentView onSubmitted={refresh} />
      break
    case 'fee_pending':
      content = <FeePendingView onRefresh={refresh} />
      break
    case 'active':
    case 'dashboard':
      content = <DashboardView onNavigate={setView} onRefresh={refresh} />
      break
    case 'profile':
      content = <ProfileView onRefresh={refresh} />
      break
    case 'my_loans':
      content = <MyLoansView onRefresh={refresh} />
      break
    case 'notifications':
      content = <NotificationsView />
      break
    case 'help':
      content = <HelpView />
      break
    case 'transactions':
      content = <TransactionsView />
      break
    default:
      content = <DashboardView onNavigate={setView} onRefresh={refresh} />
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <TopNav onLogout={handleLogout} onRefresh={refresh} onNavigate={setView} activeView={view} />
      <main id="main-content" className="flex-1">{content}</main>
      <Footer />
      <KeyboardShortcutsHelp />
      <OnboardingTour />
    </div>
  )
}
