'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api-client'
import { fmtPKR, fmtDate, fmtDateTime } from '@/lib/format'
import { Loader2, ShieldCheck, Ban, CreditCard, Banknote, TrendingUp, FileText } from 'lucide-react'

interface UserDetail {
  id: string
  email: string
  name: string | null
  phone: string | null
  stage: string
  banned: boolean
  avatarPath: string | null
  createdAt: string
  kyc: {
    status: string
    cnicName: string | null
    city: string | null
    occupation: string | null
    monthlyIncome: number | null
    rejectReason: string | null
  } | null
  applications: {
    id: string
    planName: string
    amount: number
    status: string
    appliedAt: string
    paidInstallments: number
    installmentCount: number
  }[]
  payments: {
    id: string
    type: string
    amount: number
    status: string
    txnRef: string | null
    createdAt: string
    planName: string | null
  }[]
  creditScore: {
    score: number
    rating: string
    factors: { onTimePayments: number; totalInstallments: number; completedLoans: number; overdueCount: number }
  }
  scoreHistory: { id: string; score: number; rating: string; createdAt: string }[]
}

interface Props {
  userId: string | null
  onClose: () => void
}

const RATING_CLS: Record<string, string> = {
  excellent: 'bg-success/15 text-success',
  good: 'bg-blue-100 text-blue-700',
  fair: 'bg-amber-100 text-amber-700',
  poor: 'bg-destructive/10 text-destructive',
}

function DetailContent({ userId }: { userId: string }) {
  const [state, setState] = useState<{ data: UserDetail | null; loading: boolean }>(() => ({ data: null, loading: true }))

  useEffect(() => {
    let cancelled = false
    api<{ user: UserDetail }>(`/api/admin/users/${userId}`)
      .then((r) => { if (!cancelled) setState({ data: r.user, loading: false }) })
      .catch(() => { if (!cancelled) setState({ data: null, loading: false }) })
    return () => { cancelled = true }
  }, [userId])

  if (state.loading) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm">Loading user details…</span>
      </div>
    )
  }
  if (!state.data) return <div className="py-8 text-center text-sm text-destructive">User not found</div>

  const u = state.data
  const initials = (u.kyc?.cnicName || u.name || u.email).slice(0, 2).toUpperCase()

  return (
    <div className="space-y-4 max-h-[70vh] overflow-y-auto scrollbar-thin pr-1">
      {/* User header */}
      <div className="flex items-center gap-3 rounded-xl bg-brand-gradient p-4 text-white">
        <Avatar className="size-14 border-2 border-white/30">
          {u.avatarPath ? <AvatarImage src={u.avatarPath} /> : null}
          <AvatarFallback className="bg-white/20 text-white font-bold">{initials}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-bold truncate">{u.kyc?.cnicName || u.name || 'Unnamed'}</p>
          <p className="text-xs text-white/80 truncate">{u.email}{u.phone && ` • ${u.phone}`}</p>
          <div className="mt-1 flex items-center gap-1.5 flex-wrap">
            <Badge className="bg-white/20 text-white border-0 text-[10px] capitalize">{u.stage.replace('_', ' ')}</Badge>
            {u.kyc?.status === 'approved' && <Badge className="bg-success text-white border-0 text-[10px] gap-0.5"><ShieldCheck className="size-2.5" /> Verified</Badge>}
            {u.banned && <Badge className="bg-red-600 text-white border-0 text-[10px] gap-0.5"><Ban className="size-2.5" /> Banned</Badge>}
          </div>
        </div>
      </div>

      {/* Credit score */}
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><TrendingUp className="size-3" /> Credit Score</p>
          <p className="text-2xl font-bold mt-1">{u.creditScore.score}</p>
          <Badge className={`mt-1 border-0 text-[10px] ${RATING_CLS[u.creditScore.rating] || ''}`}>{u.creditScore.rating}</Badge>
        </div>
        <div className="rounded-xl border p-3">
          <p className="text-xs text-muted-foreground flex items-center gap-1"><CreditCard className="size-3" /> Loans</p>
          <p className="text-2xl font-bold mt-1">{u.applications.length}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{u.applications.filter((a) => a.status === 'active').length} active</p>
        </div>
      </div>

      <Separator />

      {/* Applications */}
      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1"><CreditCard className="size-3" /> Loan Applications ({u.applications.length})</p>
        {u.applications.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No applications</p>
        ) : (
          <div className="space-y-1.5">
            {u.applications.map((a) => (
              <div key={a.id} className="flex items-center justify-between rounded-lg border p-2 text-xs">
                <div>
                  <p className="font-medium">{a.planName} • {fmtPKR(a.amount)}</p>
                  <p className="text-muted-foreground">{fmtDate(a.appliedAt)} • {a.paidInstallments}/{a.installmentCount} paid</p>
                </div>
                <Badge variant="outline" className="text-[10px] capitalize border-0">{a.status.replace('_', ' ')}</Badge>
              </div>
            ))}
          </div>
        )}
      </div>

      <Separator />

      {/* Payments */}
      <div>
        <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1"><Banknote className="size-3" /> Payments ({u.payments.length})</p>
        {u.payments.length === 0 ? (
          <p className="text-xs text-muted-foreground py-2">No payments</p>
        ) : (
          <div className="space-y-1.5 max-h-40 overflow-y-auto scrollbar-thin">
            {u.payments.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg border p-2 text-xs">
                <div>
                  <p className="font-medium">{p.type === 'processing_fee' ? 'Processing Fee' : 'Installment'}</p>
                  <p className="text-muted-foreground">{fmtDateTime(p.createdAt)}{p.txnRef && ` • ${p.txnRef}`}</p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{fmtPKR(p.amount)}</p>
                  <Badge variant="outline" className={`text-[10px] border-0 ${p.status === 'approved' ? 'bg-success/15 text-success' : p.status === 'rejected' ? 'bg-destructive/10 text-destructive' : 'bg-amber-100 text-amber-700'}`}>{p.status}</Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {u.scoreHistory.length > 0 && (
        <>
          <Separator />
          <div>
            <p className="text-xs font-bold uppercase text-muted-foreground mb-2 flex items-center gap-1"><TrendingUp className="size-3" /> Score History ({u.scoreHistory.length})</p>
            <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
              {u.scoreHistory.map((h) => (
                <div key={h.id} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{fmtDate(h.createdAt)}</span>
                  <span className="font-medium">{h.score} <Badge className={`ml-1 border-0 text-[9px] ${RATING_CLS[h.rating] || ''}`}>{h.rating}</Badge></span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export function UserDetailModal({ userId, onClose }: Props) {
  return (
    <Dialog open={!!userId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="size-5 text-primary" /> User Details</DialogTitle>
          <DialogDescription>Full history: applications, payments, credit score</DialogDescription>
        </DialogHeader>
        {userId && <DetailContent key={userId} userId={userId} />}
      </DialogContent>
    </Dialog>
  )
}
