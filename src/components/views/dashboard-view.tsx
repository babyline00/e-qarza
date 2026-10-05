'use client'

import { useState } from 'react'
import { useAppStore, type View } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { InstallmentPaymentDialog } from '@/components/shared/installment-payment-dialog'
import { SettlementCalculator } from '@/components/shared/settlement-calculator'
import { RepaymentChart } from './repayment-chart'
import { CreditScoreCard } from './credit-score-card'
import { fmtPKR, fmtDate, timeAgo, loanTotals } from '@/lib/format'
import {
  Wallet, FileText, Bell, ArrowRight, ChevronRight,
  CheckCircle2, Clock, AlertCircle, CalendarClock, Coins, Calculator,
} from 'lucide-react'

interface Props {
  onNavigate: (v: View) => void
  onRefresh: () => void
}

export function DashboardView({ onNavigate, onRefresh }: Props) {
  const { user, applications, notifications } = useAppStore()
  const [payInstallment, setPayInstallment] = useState<{ id: string; number: number; dueDate: string; amount: number; status: string } | null>(null)
  const [showSettlement, setShowSettlement] = useState(false)

  const activeApp = applications.find((a) => a.status === 'active' || a.status === 'completed')
  const installments = activeApp?.installments || []
  const paidCount = installments.filter((i) => i.status === 'paid').length
  const progress = installments.length ? Math.round((paidCount / installments.length) * 100) : 0
  const nextDue = installments.find((i) => i.status === 'pending' || i.status === 'overdue')

  const recentNotifs = notifications.slice(0, 3)
  const firstName = user?.name?.split(' ')[0] || 'there'
  const totalLoanAmount = activeApp ? loanTotals(activeApp.amount, activeApp.interestRate, activeApp.tenureMonths).totalPayable : 0

  const quickActions = [
    {
      label: 'Pay Installment',
      icon: Wallet,
      onClick: () => {
        if (nextDue && (nextDue.status === 'pending' || nextDue.status === 'overdue')) {
          setPayInstallment(nextDue)
        } else {
          onNavigate('my_loans')
        }
      },
    },
    { label: 'My Loan', icon: FileText, onClick: () => onNavigate('my_loans') },
    { label: 'Notifications', icon: Bell, onClick: () => onNavigate('notifications') },
  ]

  return (
    <div className="mx-auto max-w-5xl px-4 pb-10">
      {/* Greeting */}
      <div className="pt-6 pb-4">
        <h1 className="text-xl font-bold tracking-tight">Hello, {firstName} 👋</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Welcome back!</p>
      </div>

      {/* Hero card */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-5 text-white shadow-md animate-fade-up">
        <div className="relative z-10">
          <p className="text-xs font-medium uppercase tracking-wide text-white/80">Total Loan Amount</p>
          <p className="mt-1 text-3xl font-extrabold">{fmtPKR(totalLoanAmount)}</p>
          {activeApp && (
            <p className="mt-0.5 text-xs text-white/80">
              {activeApp.planName} plan • {activeApp.tenureMonths} months
            </p>
          )}
          <Button
            size="sm"
            onClick={() => onNavigate('my_loans')}
            className="mt-4 h-8 gap-1.5 rounded-lg bg-white text-brand hover:bg-white/90"
          >
            View Details <ArrowRight className="size-3.5" />
          </Button>
        </div>
        <Coins className="absolute -right-3 -bottom-2 size-28 text-white/15" />
        <Wallet className="absolute right-5 top-5 size-8 text-white/25" />
      </div>

      {/* Quick actions */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="group flex flex-col items-center gap-2 rounded-2xl border bg-card p-3 text-center shadow-sm transition hover:border-primary/40 hover-lift"
          >
            <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary transition group-hover:bg-brand-gradient group-hover:text-white">
              <a.icon className="size-5" />
            </span>
            <span className="text-xs font-medium leading-tight">{a.label}</span>
          </button>
        ))}
      </div>

      {/* Empty state when no active loan */}
      {!activeApp ? (
        <Card className="mt-4 rounded-2xl border-dashed">
          <CardContent className="py-10 text-center">
            <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Wallet className="size-7" />
            </span>
            <p className="font-semibold">No active loan yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Once your loan is approved, your dashboard will show the repayment schedule here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="mt-4 rounded-2xl shadow-sm">
          <CardContent className="p-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold">Loan Overview</h2>
              <div className="flex items-center gap-2">
                {activeApp.status === 'active' && paidCount < installments.length && (
                  <Button size="sm" variant="outline" className="h-7 gap-1 text-primary" onClick={() => setShowSettlement(true)}>
                    <Calculator className="size-3.5" /> Settle Early
                  </Button>
                )}
                <Badge variant={activeApp.status === 'completed' ? 'secondary' : 'default'} className="rounded-full">
                  {activeApp.status === 'completed' ? 'Completed' : 'Active'}
                </Badge>
              </div>
            </div>

            {/* Progress */}
            <div className="mt-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Repayment progress</span>
                <span className="font-semibold">{progress}%</span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-success transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>

            {/* Active loan row */}
            <button
              onClick={() => onNavigate('my_loans')}
              className="mt-4 flex w-full items-center justify-between rounded-xl border p-3 text-left transition hover:border-primary/40 hover:bg-accent/50"
            >
              <span className="text-sm text-muted-foreground">Active Loan</span>
              <span className="flex items-center gap-1 text-sm font-semibold">
                {fmtPKR(activeApp.amount)} <ChevronRight className="size-4 text-muted-foreground" />
              </span>
            </button>

            {/* Installments paid row */}
            <div className="mt-2 flex items-center justify-between rounded-xl border p-3">
              <span className="text-sm text-muted-foreground">{paidCount} of {installments.length} Installments Paid</span>
              <span className="text-sm font-semibold">{progress}%</span>
            </div>

            {/* Next installment */}
            <div className="mt-3 rounded-xl bg-primary/5 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground">Next Installment</p>
                  {nextDue ? (
                    <>
                      <p className="text-xl font-bold">{fmtPKR(nextDue.amount)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                        <CalendarClock className="size-3.5" /> Due {fmtDate(nextDue.dueDate)}
                      </p>
                      {nextDue.status === 'overdue' && (
                        <Badge variant="destructive" className="mt-1.5">Overdue</Badge>
                      )}
                    </>
                  ) : (
                    <>
                      <p className="text-base font-bold text-success flex items-center gap-1.5">
                        <CheckCircle2 className="size-5" /> All paid!
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">Your loan is fully repaid.</p>
                    </>
                  )}
                </div>
                {nextDue && (nextDue.status === 'pending' || nextDue.status === 'overdue') && (
                  <Button
                    onClick={() => setPayInstallment(nextDue)}
                    className="rounded-lg bg-brand-gradient text-white hover:opacity-90"
                  >
                    Pay Now
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Repayment history chart */}
      {activeApp && (activeApp.status === 'active' || activeApp.status === 'completed') && (
        <div className="mt-4">
          <RepaymentChart application={activeApp} />
        </div>
      )}

      {/* Credit score card */}
      <div className="mt-4">
        <CreditScoreCard />
      </div>

      {/* Recent notifications */}
      <Card className="mt-4 rounded-2xl shadow-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold">Recent Notifications</h2>
            <Button size="sm" variant="ghost" onClick={() => onNavigate('notifications')} className="text-primary h-7">
              All
            </Button>
          </div>
          {recentNotifs.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
          ) : (
            <div className="mt-3 space-y-2.5">
              {recentNotifs.map((n) => (
                <div key={n.id} className="flex gap-3">
                  <span
                    className={`mt-0.5 grid size-8 shrink-0 place-items-center rounded-full ${
                      n.type === 'success' ? 'bg-success/10 text-success' :
                      n.type === 'error' ? 'bg-destructive/10 text-destructive' :
                      n.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
                    }`}
                  >
                    {n.type === 'success' ? <CheckCircle2 className="size-4" /> :
                     n.type === 'error' ? <AlertCircle className="size-4" /> :
                     n.type === 'warning' ? <Clock className="size-4" /> : <Bell className="size-4" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-tight">{n.title}</p>
                    <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{n.message}</p>
                    <p className="mt-0.5 text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <InstallmentPaymentDialog
        installment={payInstallment}
        onClose={() => setPayInstallment(null)}
        onPaid={onRefresh}
      />
      <SettlementCalculator
        application={showSettlement ? activeApp : null}
        onClose={() => setShowSettlement(false)}
      />
    </div>
  )
}
