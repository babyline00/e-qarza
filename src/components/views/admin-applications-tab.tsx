'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { api } from '@/lib/api-client'
import { useAdminRefresh } from '@/lib/use-admin-refresh'
import { fmtPKR, fmtDate } from '@/lib/format'
import { toast } from 'sonner'
import {
  FileText, Loader2, CheckCircle2, XCircle, Inbox, Wallet, Download, Filter, X,
} from 'lucide-react'

interface AppItem {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string | null
  planName: string
  amount: number
  interestRate: number
  tenureMonths: number
  processingFee: number
  status: string
  rejectReason: string | null
  appliedAt: string
  activatedAt: string | null
  installmentCount: number
  paidInstallments: number
}

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  fee_pending: { label: 'Fee Due', cls: 'bg-amber-100 text-amber-700' },
  fee_submitted: { label: 'Fee Verifying', cls: 'bg-blue-100 text-blue-700' },
  fee_approved: { label: 'Fee Approved', cls: 'bg-primary/10 text-primary' },
  active: { label: 'Active', cls: 'bg-success/15 text-success' },
  completed: { label: 'Completed', cls: 'bg-muted text-muted-foreground' },
  rejected: { label: 'Rejected', cls: 'bg-destructive/10 text-destructive' },
}

export function AdminApplicationsTab() {
  const [apps, setApps] = useState<AppItem[]>([])
  const [loading, setLoading] = useState(true)
  const [rejecting, setRejecting] = useState<AppItem | null>(null)
  const [reason, setReason] = useState('')
  const [acting, setActing] = useState(false)
  const [statusFilter, setStatusFilter] = useState<string>('')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const load = useCallback(async (force = false) => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (statusFilter) params.set('status', statusFilter)
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      const qs = params.toString()
      const r = await api<{ applications: AppItem[] }>(`/api/admin/applications${qs ? '?' + qs : ''}`, { force })
      setApps(r.applications)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, fromDate, toDate])

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  useAdminRefresh(useCallback(() => load(true), [load]))

  async function confirmReject() {
    if (!rejecting) return
    setActing(true)
    try {
      await api('/api/admin/applications', {
        method: 'POST',
        body: JSON.stringify({ applicationId: rejecting.id, action: 'reject', reason }),
      })
      toast.success('Application rejected')
      setRejecting(null)
      setReason('')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setActing(false)
    }
  }

  if (loading && apps.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm">Loading applications…</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* filter bar */}
      <div className="rounded-xl border bg-card p-3 space-y-2">
        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="size-4 text-muted-foreground shrink-0" />
          <Select value={statusFilter || 'all'} onValueChange={(v) => setStatusFilter(v === 'all' ? '' : v)}>
            <SelectTrigger className="h-8 w-36 text-xs"><SelectValue placeholder="All statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="fee_pending">Fee Due</SelectItem>
              <SelectItem value="fee_submitted">Fee Verifying</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-1">
            <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 w-36 text-xs" />
            <span className="text-xs text-muted-foreground">to</span>
            <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 w-36 text-xs" />
          </div>
          {(statusFilter || fromDate || toDate) && (
            <Button variant="ghost" size="sm" className="h-8 px-2 text-xs" onClick={() => { setStatusFilter(''); setFromDate(''); setToDate('') }}>
              <X className="size-3" /> Clear
            </Button>
          )}
          <div className="ml-auto">
            <Button variant="outline" size="sm" className="gap-1.5 h-8" onClick={() => window.open('/api/admin/export?type=applications', '_blank')}>
              <Download className="size-3.5" /> Export CSV
            </Button>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{apps.length} application{apps.length !== 1 ? 's' : ''}</p>
      </div>
      {apps.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Inbox className="size-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No loan applications</p>
            <p className="text-xs mt-0.5">Applications will appear here as users submit them.</p>
          </CardContent>
        </Card>
      ) : (
        apps.map((a) => {
          const badge = STATUS_BADGE[a.status] || { label: a.status, cls: 'bg-muted text-muted-foreground' }
          const canReject = a.status === 'fee_pending' || a.status === 'fee_submitted'
          return (
            <Card key={a.id} className="rounded-2xl">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white">
                      <Wallet className="size-5" />
                    </span>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-bold text-sm">{a.planName} Plan</p>
                        <Badge className={`text-[10px] h-5 border-0 ${badge.cls}`}>{badge.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {a.userName} • Applied {fmtDate(a.appliedAt)}
                      </p>
                      <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-muted-foreground">
                        <span>Loan: <strong className="text-foreground">{fmtPKR(a.amount)}</strong></span>
                        <span>Rate: <strong className="text-foreground">{a.interestRate}%</strong></span>
                        <span>Tenure: <strong className="text-foreground">{a.tenureMonths}mo</strong></span>
                        {a.installmentCount > 0 && (
                          <span>Installments: <strong className="text-foreground">{a.paidInstallments}/{a.installmentCount}</strong></span>
                        )}
                      </div>
                      {a.rejectReason && (
                        <p className="text-[11px] text-destructive mt-1">⚠ {a.rejectReason}</p>
                      )}
                    </div>
                  </div>
                  {canReject && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 gap-1 text-destructive border-destructive/30 hover:bg-destructive/5 shrink-0"
                      onClick={() => { setRejecting(a); setReason('') }}
                    >
                      <XCircle className="size-3.5" /> Reject
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )
        })
      )}

      {/* Reject dialog */}
      <Dialog open={!!rejecting} onOpenChange={(o) => !o && setRejecting(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <XCircle className="size-5 text-destructive" /> Reject Application
            </DialogTitle>
            <DialogDescription>
              Reject {rejecting?.userName}'s {rejecting?.planName} plan application. They will be able to apply for a different plan.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reject-reason">Reason (optional)</Label>
            <Textarea
              id="reject-reason"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder="e.g. Income too low for this plan amount"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejecting(null)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmReject} disabled={acting}>
              {acting ? <Loader2 className="size-4 animate-spin" /> : <XCircle className="size-4" />} Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
