'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api-client'
import { fmtPKR, timeAgo, fmtDate } from '@/lib/format'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie,
} from 'recharts'
import {
  Users, ShieldCheck, CreditCard, Banknote, TrendingUp, Wallet, Clock, RefreshCw,
  AlertTriangle, Download, UserPlus, FileText, ArrowRight, Activity, Zap,
} from 'lucide-react'

interface Stats {
  totals: {
    users: number
    activeUsers: number
    kycPending: number
    kycApproved: number
    totalApplications: number
    activeLoans: number
    completedLoans: number
    pendingPayments: number
    totalDisbursed: number
    totalCollected: number
    overdueInstallments?: number
    newUsersThisMonth?: number
  }
  byPlan: { name: string; count: number; amount: number }[]
  monthlyTrend: { label: string; apps: number; disbursed: number }[]
  paymentStatus: { approved: number; submitted: number; rejected: number }
  repaymentByPlan: { name: string; rate: number; paid: number; total: number }[]
  recentUsers?: { id: string; name: string; email: string; stage: string; createdAt: string }[]
  recentApplications?: { id: string; userName: string; planName: string; amount: number; status: string; appliedAt: string }[]
}

// hex colors (recharts SVG attributes don't reliably support oklch())
const C = {
  orange: '#F97316',
  green: '#10B981',
  red: '#EF4444',
  blue: '#3B82F6',
  gray: '#6B7280',
  border: '#E5E7EB',
}
const PIE_COLORS = [C.green, C.orange, C.red]

const STAGE_LABEL: Record<string, string> = {
  auth: 'New',
  kyc: 'KYC',
  kyc_pending: 'KYC Review',
  loan_select: 'Browsing',
  fee_pending: 'Fee Due',
  active: 'Active',
  rejected: 'Rejected',
}

const APP_STATUS_CLS: Record<string, string> = {
  fee_pending: 'bg-amber-100 text-amber-700',
  fee_submitted: 'bg-blue-100 text-blue-700',
  active: 'bg-success/15 text-success',
  completed: 'bg-muted text-muted-foreground',
  rejected: 'bg-destructive/10 text-destructive',
}

export function AdminAnalyticsTab({ onNavigate }: { onNavigate?: (tab: string) => void }) {
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api<{ stats: Stats }>('/api/admin/stats')
      setStats(r.stats)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 20000)
    return () => clearInterval(t)
  }, [load])

  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <Skeleton className="h-64 rounded-2xl" />
        <div className="grid sm:grid-cols-2 gap-4">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
      </div>
    )
  }
  if (!stats) return null

  const { totals, byPlan, monthlyTrend, paymentStatus, recentUsers, recentApplications } = stats

  const kpiCards = [
    { label: 'Total Users', value: totals.users, sub: `${totals.newUsersThisMonth || 0} new this month`, icon: Users, color: 'text-primary', bg: 'bg-primary/10', trend: totals.newUsersThisMonth ? `+${totals.newUsersThisMonth}` : null },
    { label: 'KYC Approved', value: totals.kycApproved, sub: `${totals.kycPending} pending`, icon: ShieldCheck, color: 'text-success', bg: 'bg-success/10', trend: totals.kycPending > 0 ? `${totals.kycPending} pending` : 'All clear' },
    { label: 'Active Loans', value: totals.activeLoans, sub: `${totals.completedLoans} completed`, icon: CreditCard, color: 'text-primary', bg: 'bg-primary/10', trend: totals.activeLoans > 0 ? 'Active' : 'None active' },
    { label: 'Pending Payments', value: totals.pendingPayments, sub: 'awaiting review', icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', trend: totals.pendingPayments > 0 ? 'Action needed' : 'All clear' },
  ]

  const pieData = [
    { name: 'Approved', value: paymentStatus.approved },
    { name: 'Submitted', value: paymentStatus.submitted },
    { name: 'Rejected', value: paymentStatus.rejected },
  ].filter((d) => d.value > 0)

  // quick actions
  const quickActions = [
    { label: 'Review KYC', count: totals.kycPending, icon: ShieldCheck, color: 'text-primary', tab: 'kyc' },
    { label: 'Review Payments', count: totals.pendingPayments, icon: Banknote, color: 'text-amber-600', tab: 'payments' },
    { label: 'Applications', count: totals.totalApplications, icon: FileText, color: 'text-blue-600', tab: 'applications' },
    { label: 'Manage Plans', count: null, icon: Wallet, color: 'text-primary', tab: 'manage' },
  ]

  return (
    <div className="space-y-4">
      {/* Top bar: refresh + export */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground flex items-center gap-1.5">
          <Activity className="size-4" /> Live data — auto-refreshes every 20s
        </p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1.5" onClick={() => window.open('/api/admin/export?type=applications', '_blank')}>
            <Download className="size-3.5" /> Export
          </Button>
          <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-8 gap-1.5">
            <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {quickActions.map((a) => (
          <button
            key={a.label}
            onClick={() => onNavigate?.(a.tab)}
            className="group flex items-center gap-3 rounded-2xl border bg-card p-3.5 text-left transition hover:border-primary/30 hover-lift"
          >
            <span className={`grid size-10 place-items-center rounded-xl ${a.color === 'text-primary' ? 'bg-primary/10' : a.color === 'text-amber-600' ? 'bg-amber-100' : 'bg-blue-100'} ${a.color}`}>
              <a.icon className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold">{a.label}</p>
              {a.count != null && a.count > 0 && (
                <Badge className={`mt-0.5 text-[10px] border-0 ${a.color === 'text-amber-600' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'}`}>
                  {a.count} pending
                </Badge>
              )}
              {a.count != null && a.count === 0 && (
                <p className="text-[11px] text-muted-foreground mt-0.5">All clear</p>
              )}
              {a.count === null && (
                <p className="text-[11px] text-muted-foreground mt-0.5">Plans & banks</p>
              )}
            </div>
            <ArrowRight className="size-4 text-muted-foreground group-hover:text-primary transition" />
          </button>
        ))}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label} className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className={`grid size-9 place-items-center rounded-lg ${k.bg} ${k.color}`}>
                  <k.icon className="size-4.5" />
                </span>
                {k.trend && (
                  <span className={`text-[10px] font-medium rounded-full px-2 py-0.5 ${
                    k.trend.includes('pending') || k.trend.includes('Action') ? 'bg-amber-100 text-amber-700' :
                    k.trend.includes('clear') || k.trend.includes('Active') ? 'bg-success/15 text-success' :
                    k.trend.startsWith('+') ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'
                  }`}>
                    {k.trend}
                  </span>
                )}
              </div>
              <p className="mt-2 text-2xl font-bold">{k.value}</p>
              <p className="text-xs font-medium">{k.label}</p>
              <p className="text-[11px] text-muted-foreground">{k.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Disbursement + collected */}
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className="rounded-2xl overflow-hidden">
          <div className="bg-brand-gradient p-4 text-white">
            <div className="flex items-center gap-2">
              <Wallet className="size-5" />
              <span className="text-xs font-medium uppercase tracking-wide opacity-90">Total Disbursed</span>
            </div>
            <p className="mt-1 text-3xl font-extrabold">{fmtPKR(totals.totalDisbursed)}</p>
            <p className="text-xs opacity-80 mt-0.5">{totals.totalApplications} applications • {totals.activeLoans} active + {totals.completedLoans} completed</p>
          </div>
        </Card>
        <Card className="rounded-2xl overflow-hidden">
          <div className="bg-success p-4 text-white">
            <div className="flex items-center gap-2">
              <Banknote className="size-5" />
              <span className="text-xs font-medium uppercase tracking-wide opacity-90">Total Collected</span>
            </div>
            <p className="mt-1 text-3xl font-extrabold">{fmtPKR(totals.totalCollected)}</p>
            <p className="text-xs opacity-80 mt-0.5">{paymentStatus.approved} approved payments</p>
          </div>
        </Card>
      </div>

      {/* Alerts row */}
      {(totals.kycPending > 0 || totals.pendingPayments > 0 || (totals.overdueInstallments || 0) > 0) && (
        <div className="grid gap-2 sm:grid-cols-3">
          {totals.kycPending > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
              <AlertTriangle className="size-4 shrink-0" />
              <span><strong>{totals.kycPending}</strong> KYC{totals.kycPending > 1 ? 's' : ''} awaiting review</span>
            </div>
          )}
          {totals.pendingPayments > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-800">
              <AlertTriangle className="size-4 shrink-0" />
              <span><strong>{totals.pendingPayments}</strong> payment{totals.pendingPayments > 1 ? 's' : ''} awaiting verification</span>
            </div>
          )}
          {(totals.overdueInstallments || 0) > 0 && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/5 border border-destructive/20 p-2.5 text-xs text-destructive">
              <AlertTriangle className="size-4 shrink-0" />
              <span><strong>{totals.overdueInstallments}</strong> overdue installment{totals.overdueInstallments! > 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
      )}

      {/* Monthly trend line chart */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm"><TrendingUp className="size-4 text-primary" /> 6-Month Trend</CardTitle>
          <CardDescription>Applications received and amount disbursed per month.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrend} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: C.gray }} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" tick={{ fontSize: 10, fill: C.gray }} tickLine={false} axisLine={false} width={32} allowDecimals={false} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 10, fill: C.gray }} tickLine={false} axisLine={false} width={48} tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}k`} allowDecimals={false} />
                <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12 }} formatter={(val: number, name: string) => name === 'Disbursed' ? [fmtPKR(val), 'Disbursed'] : [val, 'Applications']} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line yAxisId="left" type="monotone" dataKey="apps" name="Applications" stroke={C.blue} strokeWidth={2} dot={{ r: 3, fill: C.blue }} activeDot={{ r: 5 }} isAnimationActive={false} />
                <Line yAxisId="right" type="monotone" dataKey="disbursed" name="Disbursed" stroke={C.orange} strokeWidth={2.5} dot={{ r: 3, fill: C.orange }} activeDot={{ r: 5 }} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Charts row */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* By plan bar chart */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Disbursement by Plan</CardTitle>
            <CardDescription>Active + completed loans grouped by plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={byPlan} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: C.gray }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fill: C.gray }} tickLine={false} axisLine={false} width={40} tickFormatter={(v: number) => `${(v / 100000).toFixed(0)}k`} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12 }} formatter={(val: number) => [fmtPKR(val), 'Amount']} />
                  <Bar dataKey="amount" fill={C.orange} radius={[6, 6, 0, 0]} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Payment status pie */}
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Payment Status</CardTitle>
            <CardDescription>Breakdown of all payment proofs.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData.map((d, i) => ({ ...d, fill: PIE_COLORS[i % PIE_COLORS.length] }))}
                    dataKey="value"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={75}
                    paddingAngle={2}
                    isAnimationActive={false}
                  />
                  <Tooltip contentStyle={{ borderRadius: 8, border: `1px solid ${C.border}`, fontSize: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Repayment rate by plan */}
      {stats.repaymentByPlan && stats.repaymentByPlan.some((p) => p.total > 0) && (
        <Card className="rounded-2xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Repayment Rate by Plan</CardTitle>
            <CardDescription>% of installments paid on time per plan.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 pt-2">
              {stats.repaymentByPlan.filter((p) => p.total > 0).map((p) => (
                <div key={p.name}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.paid}/{p.total} paid • <strong className={p.rate >= 80 ? 'text-success' : p.rate >= 50 ? 'text-amber-700' : 'text-destructive'}>{p.rate}%</strong></span>
                  </div>
                  <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                    <div
                      className={p.rate >= 80 ? 'bg-success' : p.rate >= 50 ? 'bg-amber-500' : 'bg-destructive'}
                      style={{ width: `${p.rate}%`, transition: 'width 0.6s ease' }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Activity: New users + Recent applications */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Recent users */}
        {recentUsers && recentUsers.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><UserPlus className="size-4 text-primary" /> Recent Sign-ups</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentUsers.map((u) => (
                  <div key={u.id} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{u.email}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[10px] border-0 ${STAGE_LABEL[u.stage] === 'Active' ? 'bg-success/15 text-success' : 'bg-muted text-muted-foreground'}`}>
                        {STAGE_LABEL[u.stage] || u.stage}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(u.createdAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent applications */}
        {recentApplications && recentApplications.length > 0 && (
          <Card className="rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm"><FileText className="size-4 text-primary" /> Recent Applications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {recentApplications.map((a) => (
                  <div key={a.id} className="flex items-center justify-between rounded-lg border p-2.5">
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{a.userName}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{a.planName} • {fmtPKR(a.amount)}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="outline" className={`text-[10px] border-0 capitalize ${APP_STATUS_CLS[a.status] || 'bg-muted text-muted-foreground'}`}>
                        {a.status.replace('_', ' ')}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">{timeAgo(a.appliedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
