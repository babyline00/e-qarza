'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { api } from '@/lib/api-client'
import { fmtPKR, fmtDate } from '@/lib/format'
import { toast } from 'sonner'
import { TrendingUp, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Award, Banknote, Info } from 'lucide-react'

interface ScoreData {
  score: number
  rating: 'poor' | 'fair' | 'good' | 'excellent'
  factors: {
    onTimePayments: number
    totalInstallments: number
    completedLoans: number
    totalRepaid: number
    overdueCount: number
    kycVerified: boolean
  }
  breakdown: {
    label: string
    description: string
    weight: number
    points: number
    icon: string
  }[]
  maxAmount: number
}

const RATING_CONFIG = {
  excellent: { label: 'Excellent', color: '#10B981', bg: 'bg-success/10', text: 'text-success', desc: 'Outstanding repayment history' },
  good: { label: 'Good', color: '#3B82F6', bg: 'bg-blue-100', text: 'text-blue-700', desc: 'Healthy credit standing' },
  fair: { label: 'Fair', color: '#F59E0B', bg: 'bg-amber-100', text: 'text-amber-700', desc: 'Building credit history' },
  poor: { label: 'Poor', color: '#EF4444', bg: 'bg-destructive/10', text: 'text-destructive', desc: 'Needs improvement' },
}

const iconMap: Record<string, React.ElementType> = {
  CheckCircle2, AlertTriangle, ShieldCheck, Award, Banknote, Info,
}

interface HistoryEntry {
  id: string
  score: number
  rating: string
  createdAt: string
}

export function CreditScoreCard() {
  const [data, setData] = useState<ScoreData | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBreakdown, setShowBreakdown] = useState(false)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  useEffect(() => {
    let cancelled = false
    api<{ score: ScoreData }>('/api/credit-score')
      .then((r) => { if (!cancelled) setData(r.score) })
      .catch((e) => { if (!cancelled) toast.error((e as Error).message) })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  // fetch history when modal opens
  useEffect(() => {
    if (!showBreakdown) return
    let cancelled = false
    api<{ history: HistoryEntry[] }>('/api/credit-score/history')
      .then((r) => { if (!cancelled) setHistory(r.history) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [showBreakdown])

  if (loading) {
    return (
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <Skeleton className="h-4 w-32 mb-3" />
          <div className="flex items-center gap-4">
            <Skeleton className="size-20 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-3 w-full" />
              <Skeleton className="h-3 w-3/4" />
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }
  if (!data) return null

  const config = RATING_CONFIG[data.rating]
  // circular progress (score 300-900 → 0-100%)
  const pct = ((data.score - 300) / 600) * 100
  const circumference = 2 * Math.PI * 36
  const dashOffset = circumference - (pct / 100) * circumference

  return (
    <>
    <Card className="rounded-2xl overflow-hidden">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
            <TrendingUp className="size-4" />
          </span>
          <h3 className="text-sm font-bold">Credit Score</h3>
        </div>

        <div className="flex items-center gap-4">
          {/* circular score gauge */}
          <div className="relative shrink-0">
            <svg className="size-24 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="36" fill="none" stroke="#E5E7EB" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="36" fill="none"
                stroke={config.color}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.8s ease' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-extrabold" style={{ color: config.color }}>{data.score}</span>
              <span className="text-[9px] text-muted-foreground uppercase tracking-wide">of 900</span>
            </div>
          </div>

          {/* rating + factors */}
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-bold ${config.bg} ${config.text}`}>
                {config.label}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{config.desc}</p>

            <div className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1 text-[11px]">
              <div className="flex items-center gap-1">
                <CheckCircle2 className="size-3 text-success" />
                <span className="text-muted-foreground">On-time:</span>
                <span className="font-medium">{data.factors.onTimePayments}/{data.factors.totalInstallments}</span>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="size-3 text-primary" />
                <span className="text-muted-foreground">KYC:</span>
                <span className="font-medium">{data.factors.kycVerified ? 'Verified' : 'Pending'}</span>
              </div>
              {data.factors.overdueCount > 0 && (
                <div className="flex items-center gap-1">
                  <AlertTriangle className="size-3 text-destructive" />
                  <span className="text-muted-foreground">Overdue:</span>
                  <span className="font-medium text-destructive">{data.factors.overdueCount}</span>
                </div>
              )}
              {data.factors.completedLoans > 0 && (
                <div className="flex items-center gap-1">
                  <CheckCircle2 className="size-3 text-success" />
                  <span className="text-muted-foreground">Closed loans:</span>
                  <span className="font-medium">{data.factors.completedLoans}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* max eligible amount + breakdown button */}
        <div className="mt-3 flex items-center justify-between rounded-lg bg-muted/50 px-3 py-2">
          <span className="text-xs text-muted-foreground">Recommended max loan</span>
          <span className="text-sm font-bold text-brand">{fmtPKR(data.maxAmount)}</span>
        </div>
        <Button variant="ghost" size="sm" className="w-full mt-2 text-xs gap-1" onClick={() => setShowBreakdown(true)}>
          <Info className="size-3.5" /> How is my score calculated?
        </Button>
      </CardContent>
    </Card>

    {/* Breakdown modal */}
    <Dialog open={showBreakdown} onOpenChange={setShowBreakdown}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" /> Credit Score Breakdown
          </DialogTitle>
          <DialogDescription>
            Your score of <strong style={{ color: config.color }}>{data.score}</strong> ({config.label}) is calculated from these factors:
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {data.breakdown.map((f, i) => {
            const Icon = iconMap[f.icon] || Info
            const isPenalty = f.points < 0
            const pct = f.weight > 0 ? Math.max(0, (f.points / f.weight) * 100) : 0
            return (
              <div key={i} className="rounded-xl border p-3">
                <div className="flex items-center gap-2">
                  <span className={`grid size-8 place-items-center rounded-lg shrink-0 ${isPenalty ? 'bg-destructive/10 text-destructive' : f.points > 0 ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                    <Icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold">{f.label}</p>
                      <span className={`text-sm font-bold ${isPenalty ? 'text-destructive' : 'text-success'}`}>
                        {f.points > 0 ? '+' : ''}{f.points} pts
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{f.description}</p>
                  </div>
                </div>
                {f.weight > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={isPenalty ? 'bg-destructive' : 'bg-success'}
                        style={{ width: `${pct}%`, transition: 'width 0.5s ease' }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{f.points} / {f.weight} max points</p>
                  </div>
                )}
              </div>
            )
          })}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs text-muted-foreground">Base score starts at 300. Maximum possible: 900.</p>
          </div>

          {/* Score history chart */}
          {history.length > 1 && (
            <div className="mt-4">
              <p className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                <TrendingUp className="size-4 text-primary" /> Score History (90 days)
              </p>
              <div className="h-40 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history.map((h) => ({ date: fmtDate(h.createdAt), score: h.score }))} margin={{ top: 5, right: 8, left: -8, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                    <XAxis dataKey="date" tick={{ fontSize: 9, fill: '#6B7280' }} tickLine={false} axisLine={false} />
                    <YAxis domain={[300, 900]} tick={{ fontSize: 10, fill: '#6B7280' }} tickLine={false} axisLine={false} width={32} />
                    <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #E5E7EB', fontSize: 12 }} />
                    <ReferenceLine y={750} stroke="#10B981" strokeDasharray="3 3" strokeOpacity={0.4} />
                    <ReferenceLine y={650} stroke="#3B82F6" strokeDasharray="3 3" strokeOpacity={0.4} />
                    <ReferenceLine y={550} stroke="#F59E0B" strokeDasharray="3 3" strokeOpacity={0.4} />
                    <Line type="monotone" dataKey="score" stroke="#F97316" strokeWidth={2.5} dot={{ r: 3, fill: '#F97316' }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <p className="text-[10px] text-muted-foreground text-center mt-1">
                Green line = Excellent threshold (750) · Blue = Good (650) · Amber = Fair (550)
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
    </>
  )
}
