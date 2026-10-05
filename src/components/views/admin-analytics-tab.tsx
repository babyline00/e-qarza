'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'
import { fmtPKR } from '@/lib/format'
import { toast } from 'sonner'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie,
} from 'recharts'
import {
  Users, ShieldCheck, CreditCard, Banknote, TrendingUp, Wallet, Clock, RefreshCw,
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
  }
  byPlan: { name: string; count: number; amount: number }[]
  monthlyTrend: { label: string; apps: number; disbursed: number }[]
  paymentStatus: { approved: number; submitted: number; rejected: number }
  repaymentByPlan: { name: string; rate: number; paid: number; total: number }[]
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

export function AdminAnalyticsTab() {
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

  const { totals, byPlan, monthlyTrend, paymentStatus } = stats
  const kpiCards = [
    { label: 'Total Users', value: totals.users, sub: `${totals.activeUsers} active`, icon: Users, color: 'text-primary' },
    { label: 'KYC Approved', value: totals.kycApproved, sub: `${totals.kycPending} pending`, icon: ShieldCheck, color: 'text-success' },
    { label: 'Active Loans', value: totals.activeLoans, sub: `${totals.completedLoans} completed`, icon: CreditCard, color: 'text-primary' },
    { label: 'Pending Payments', value: totals.pendingPayments, sub: 'awaiting review', icon: Clock, color: 'text-amber-600' },
  ]

  const pieData = [
    { name: 'Approved', value: paymentStatus.approved },
    { name: 'Submitted', value: paymentStatus.submitted },
    { name: 'Rejected', value: paymentStatus.rejected },
  ].filter((d) => d.value > 0)

  return (
    <div className="space-y-4">
      {/* refresh */}
      <div className="flex justify-end">
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="h-8">
          <RefreshCw className={`size-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {kpiCards.map((k) => (
          <Card key={k.label} className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className={`grid size-9 place-items-center rounded-lg bg-primary/10 ${k.color}`}>
                  <k.icon className="size-4.5" />
                </span>
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
            <p className="text-xs opacity-80 mt-0.5">{totals.totalApplications} applications received</p>
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
        <Card className="rounded-2xl mt-4">
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
    </div>
  )
}

