'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { ReceiptModal } from '@/components/shared/receipt-modal'
import { PageHeader } from '@/components/shared/page-header'
import { api } from '@/lib/api-client'
import { fmtPKR, fmtDateTime } from '@/lib/format'
import { toast } from 'sonner'
import {
  Receipt as ReceiptIcon, Banknote, Loader2, Download, CheckCircle2, Clock, XCircle, Filter, Inbox,
} from 'lucide-react'

interface Txn {
  id: string
  type: string
  amount: number
  status: string
  txnRef: string | null
  proofPath: string | null
  rejectReason: string | null
  createdAt: string
  reviewedAt: string | null
  planName: string | null
  installmentNumber: number | null
}

type FilterType = 'all' | 'approved' | 'submitted' | 'rejected'

export function TransactionsView() {
  const [txns, setTxns] = useState<Txn[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [receiptId, setReceiptId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api<{ transactions: Txn[] }>('/api/transactions')
      setTxns(r.transactions)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const filtered = txns.filter((t) => filter === 'all' || t.status === filter)

  const summary = {
    total: txns.length,
    approved: txns.filter((t) => t.status === 'approved').length,
    submitted: txns.filter((t) => t.status === 'submitted').length,
    rejected: txns.filter((t) => t.status === 'rejected').length,
    totalPaid: txns.filter((t) => t.status === 'approved').reduce((s, t) => s + t.amount, 0),
  }

  const filters: { value: FilterType; label: string; count: number }[] = [
    { value: 'all', label: 'All', count: summary.total },
    { value: 'approved', label: 'Approved', count: summary.approved },
    { value: 'submitted', label: 'Pending', count: summary.submitted },
    { value: 'rejected', label: 'Rejected', count: summary.rejected },
  ]

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader title="Transaction History" description="All your payments in one place." icon={ReceiptIcon}>
        <Button size="sm" variant="outline" className="gap-1.5" onClick={() => window.open('/api/transactions/export', '_blank')}>
          <Download className="size-3.5" /> Export CSV
        </Button>
      </PageHeader>

      {/* summary cards */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="rounded-2xl">
          <CardContent className="p-3.5">
            <p className="text-xs text-muted-foreground">Total Payments</p>
            <p className="text-xl font-bold">{summary.total}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-success/5 border-success/20">
          <CardContent className="p-3.5">
            <p className="text-xs text-success">Approved</p>
            <p className="text-xl font-bold text-success">{summary.approved}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-amber-50 border-amber-200">
          <CardContent className="p-3.5">
            <p className="text-xs text-amber-700">Pending</p>
            <p className="text-xl font-bold text-amber-700">{summary.submitted}</p>
          </CardContent>
        </Card>
        <Card className="rounded-2xl bg-brand-gradient text-white overflow-hidden">
          <CardContent className="p-3.5">
            <p className="text-xs opacity-90">Total Paid</p>
            <p className="text-xl font-bold">{fmtPKR(summary.totalPaid)}</p>
          </CardContent>
        </Card>
      </div>

      {/* filter tabs */}
      <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="size-4 text-muted-foreground shrink-0" />
        {filters.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition ${
              filter === f.value ? 'bg-brand-gradient text-white' : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {f.label} <span className="opacity-70">({f.count})</span>
          </button>
        ))}
      </div>

      {/* list */}
      <div className="mt-4 space-y-2.5">
        {loading ? (
          [0, 1, 2].map((i) => <Skeleton key={i} className="h-20 rounded-2xl" />)
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl border-dashed">
            <CardContent className="py-12 text-center text-muted-foreground">
              <Inbox className="size-10 mx-auto mb-2 opacity-40" />
              <p className="font-medium">No transactions</p>
              <p className="text-xs mt-0.5">{filter === 'all' ? 'Your payment history will appear here.' : `No ${filter} transactions.`}</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map((t) => {
            const isFee = t.type === 'processing_fee'
            const StatusIcon = t.status === 'approved' ? CheckCircle2 : t.status === 'submitted' ? Clock : XCircle
            const statusCls =
              t.status === 'approved' ? 'text-success bg-success/10' :
              t.status === 'submitted' ? 'text-amber-700 bg-amber-100' :
              'text-destructive bg-destructive/10'
            return (
              <Card key={t.id} className="rounded-2xl hover-lift">
                <CardContent className="flex items-center gap-3 p-3.5">
                  <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${statusCls}`}>
                    <StatusIcon className="size-5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm">
                        {isFee ? 'Processing Fee' : `Installment #${t.installmentNumber}`}
                      </p>
                      <Badge variant="outline" className="text-[10px] h-5 capitalize">{t.status}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {t.planName ? `${t.planName} plan • ` : ''}{fmtDateTime(t.createdAt)}
                      {t.txnRef && ` • Ref: ${t.txnRef}`}
                    </p>
                    {t.status === 'rejected' && t.rejectReason && (
                      <p className="text-xs text-destructive mt-0.5 line-clamp-1">Reason: {t.rejectReason}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <div className="text-right">
                      <p className="font-bold text-sm">{fmtPKR(t.amount)}</p>
                    </div>
                    {t.status === 'approved' && (
                      <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-primary" onClick={() => setReceiptId(t.id)} title="View receipt">
                        <Download className="size-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />
    </div>
  )
}
