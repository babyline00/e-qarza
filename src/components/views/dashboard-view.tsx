'use client'

import { useState } from 'react'
import { useAppStore, type View } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { PageHeader } from '@/components/shared/page-header'
import { InstallmentPaymentDialog } from '@/components/shared/installment-payment-dialog'
import { fmtPKR, fmtDate, timeAgo, loanTotals } from '@/lib/format'
import {
  LayoutDashboard, CreditCard, Wallet, TrendingUp, Bell, ArrowRight,
  CheckCircle2, Clock, AlertCircle, CalendarClock, Sparkles,
} from 'lucide-react'

interface Props {
  onNavigate: (v: View) => void
  onRefresh: () => void
}

export function DashboardView({ onNavigate, onRefresh }: Props) {
  const { user, applications, notifications } = useAppStore()
  const [payInstallment, setPayInstallment] = useState<{ id: string; number: number; dueDate: string; amount: number; status: string } | null>(null)

  const activeApp = applications.find((a) => a.status === 'active' || a.status === 'completed')
  const installments = activeApp?.installments || []
  const paidCount = installments.filter((i) => i.status === 'paid').length
  const progress = installments.length ? Math.round((paidCount / installments.length) * 100) : 0
  const nextDue = installments.find((i) => i.status === 'pending' || i.status === 'overdue')

  const totalPaid = installments.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
  const totalRemaining = installments.filter((i) => i.status !== 'paid').reduce((s, i) => s + i.amount, 0)

  const t = activeApp ? loanTotals(activeApp.amount, activeApp.interestRate, activeApp.tenureMonths) : null
  const recentNotifs = notifications.slice(0, 4)

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title={`Welcome, ${user?.name?.split(' ')[0] || 'there'}`}
        description="Here’s an overview of your loan activity."
        icon={LayoutDashboard}
      >
        <Button variant="outline" size="sm" onClick={() => onNavigate('my_loans')}>
          View My Loans <ArrowRight className="size-4" />
        </Button>
      </PageHeader>

      {!activeApp ? (
        <Card className="mt-6 border-dashed">
          <CardContent className="py-12 text-center">
            <Wallet className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No active loan yet</p>
            <p className="text-sm text-muted-foreground mt-1">Once your loan is approved, your dashboard will show your repayment schedule here.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {/* Active loan summary */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="bg-gradient-to-br from-primary to-primary/80 p-5 text-primary-foreground">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs opacity-80">Active Loan</p>
                  <p className="text-2xl font-bold">{fmtPKR(activeApp.amount)}</p>
                  <p className="text-sm opacity-90 mt-0.5">{activeApp.planName} plan • {activeApp.tenureMonths} months</p>
                </div>
                <Badge className="bg-white/20 text-white border-0">
                  {activeApp.status === 'completed' ? 'Completed' : 'Active'}
                </Badge>
              </div>
            </div>
            <CardContent className="pt-5 space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">Repayment progress</span>
                  <span className="font-medium">{paidCount} / {installments.length} paid</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                <div>
                  <p className="text-xs text-muted-foreground">Monthly</p>
                  <p className="font-semibold">{t && fmtPKR(t.monthlyInstallment)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total paid</p>
                  <p className="font-semibold text-primary">{fmtPKR(totalPaid)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Remaining</p>
                  <p className="font-semibold">{fmtPKR(totalRemaining)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Rate</p>
                  <p className="font-semibold">{activeApp.interestRate}%</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Next installment */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><CalendarClock className="size-4" /> Next Installment</CardTitle>
            </CardHeader>
            <CardContent>
              {nextDue ? (
                <>
                  <p className="text-3xl font-bold">{fmtPKR(nextDue.amount)}</p>
                  <p className="text-sm text-muted-foreground mt-0.5">Due {fmtDate(nextDue.dueDate)}</p>
                  {nextDue.status === 'overdue' && (
                    <Badge variant="destructive" className="mt-2">Overdue</Badge>
                  )}
                  <Button className="w-full mt-4" onClick={() => setPayInstallment(nextDue)}>
                    Pay Now
                  </Button>
                </>
              ) : (
                <div className="text-center py-4">
                  <CheckCircle2 className="size-10 text-primary mx-auto mb-2" />
                  <p className="font-medium">All installments paid!</p>
                  <p className="text-xs text-muted-foreground mt-1">Your loan is fully repaid.</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Installment schedule */}
          <Card className="lg:col-span-2">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><CreditCard className="size-4" /> Installment Schedule</CardTitle>
              <CardDescription>Tap “Pay” on any pending installment to submit a payment.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-80 overflow-y-auto -mx-2 px-2 space-y-2">
                {installments.map((i) => (
                  <div key={i.id} className="flex items-center justify-between rounded-lg border p-3 gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className={`grid size-9 place-items-center rounded-full text-xs font-semibold shrink-0 ${
                        i.status === 'paid' ? 'bg-primary/10 text-primary' :
                        i.status === 'verifying' ? 'bg-amber-100 text-amber-700' :
                        i.status === 'overdue' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                      }`}>
                        {i.status === 'paid' ? <CheckCircle2 className="size-4" /> : i.status === 'verifying' ? <Clock className="size-4" /> : `#${i.number}`}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium">Installment #{i.number}</p>
                        <p className="text-xs text-muted-foreground">Due {fmtDate(i.dueDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <p className="text-sm font-semibold">{fmtPKR(i.amount)}</p>
                        <Badge variant={i.status === 'paid' ? 'secondary' : i.status === 'verifying' ? 'outline' : 'default'} className="text-xs">
                          {i.status === 'paid' ? 'Paid' : i.status === 'verifying' ? 'Verifying' : i.status === 'overdue' ? 'Overdue' : 'Pending'}
                        </Badge>
                      </div>
                      {(i.status === 'pending' || i.status === 'overdue') && (
                        <Button size="sm" variant="outline" onClick={() => setPayInstallment(i)}>Pay</Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent notifications */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2"><Bell className="size-4" /> Recent</CardTitle>
                <Button size="sm" variant="ghost" onClick={() => onNavigate('notifications')}>All</Button>
              </div>
            </CardHeader>
            <CardContent>
              {recentNotifs.length === 0 ? (
                <p className="text-sm text-muted-foreground py-6 text-center">No notifications yet.</p>
              ) : (
                <div className="space-y-2.5">
                  {recentNotifs.map((n) => (
                    <div key={n.id} className="flex gap-2.5">
                      <div className={`mt-0.5 grid size-7 place-items-center rounded-full shrink-0 ${
                        n.type === 'success' ? 'bg-primary/10 text-primary' :
                        n.type === 'error' ? 'bg-destructive/10 text-destructive' :
                        n.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
                      }`}>
                        {n.type === 'success' ? <CheckCircle2 className="size-3.5" /> : n.type === 'error' ? <AlertCircle className="size-3.5" /> : <Bell className="size-3.5" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium leading-tight">{n.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{n.message}</p>
                        <p className="text-xs text-muted-foreground/70 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {!activeApp && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <Card className="hover:shadow-md transition-shadow cursor-default">
            <CardContent className="pt-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><TrendingUp className="size-5" /></span>
              <div><p className="text-sm font-medium">Quick approval</p><p className="text-xs text-muted-foreground">Verified in minutes</p></div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-default">
            <CardContent className="pt-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="size-5" /></span>
              <div><p className="text-sm font-medium">Flexible terms</p><p className="text-xs text-muted-foreground">3 to 12 months</p></div>
            </CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow cursor-default">
            <CardContent className="pt-6 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary"><Wallet className="size-5" /></span>
              <div><p className="text-sm font-medium">Up to Rs 100,000</p><p className="text-xs text-muted-foreground">Based on eligibility</p></div>
            </CardContent>
          </Card>
        </div>
      )}

      <InstallmentPaymentDialog
        installment={payInstallment}
        onClose={() => setPayInstallment(null)}
        onPaid={onRefresh}
      />
    </div>
  )
}
