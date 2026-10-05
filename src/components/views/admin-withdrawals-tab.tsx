'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'
import { fmtPKR, fmtDateTime } from '@/lib/format'
import { toast } from 'sonner'
import { ArrowUpFromLine, Loader2, Check, X, Inbox, Clock } from 'lucide-react'

interface WithdrawalItem {
  id: string
  userId: string
  userName: string
  userEmail: string
  userPhone: string | null
  amount: number
  status: string
  bankName: string | null
  accountNumber: string | null
  iban: string | null
  createdAt: string
}

export function AdminWithdrawalsTab() {
  const [withdrawals, setWithdrawals] = useState<WithdrawalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const r = await api<{ withdrawals: WithdrawalItem[] }>('/api/admin/withdrawals')
      setWithdrawals(r.withdrawals)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  async function act(id: string, action: 'approve' | 'reject') {
    setActing(id + action)
    try {
      await api('/api/admin/withdrawals', {
        method: 'POST',
        body: JSON.stringify({ withdrawalId: id, action }),
      })
      toast.success(action === 'approve' ? 'Withdrawal approved' : 'Withdrawal rejected')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setActing(null)
    }
  }

  if (loading && withdrawals.length === 0) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm">Loading withdrawals…</span>
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {withdrawals.length === 0 ? (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Inbox className="size-10 mx-auto mb-2 opacity-40" />
            <p className="font-medium">No pending withdrawals</p>
            <p className="text-xs mt-0.5">User withdrawal requests will appear here.</p>
          </CardContent>
        </Card>
      ) : (
        withdrawals.map((w) => (
          <Card key={w.id} className="rounded-2xl">
            <CardContent className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <span className="grid size-11 place-items-center rounded-xl bg-brand-gradient text-white shrink-0">
                    <ArrowUpFromLine className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sm">{fmtPKR(w.amount)}</p>
                      <Badge className="gap-1 bg-amber-100 text-amber-700 border-0 text-[10px]">
                        <Clock className="size-2.5" /> Pending
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {w.userName} • {w.userEmail}{w.userPhone && ` • ${w.userPhone}`}
                    </p>
                    <div className="mt-1.5 rounded-md bg-muted/40 p-2 text-[11px] space-y-0.5">
                      <p><span className="text-muted-foreground">Bank:</span> <strong>{w.bankName}</strong></p>
                      <p><span className="text-muted-foreground">Account:</span> <span className="font-mono">{w.accountNumber}</span></p>
                      <p><span className="text-muted-foreground">IBAN:</span> <span className="font-mono">{w.iban}</span></p>
                      <p><span className="text-muted-foreground">Requested:</span> {fmtDateTime(w.createdAt)}</p>
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Button
                    size="sm"
                    className="bg-success text-white hover:bg-success/90 gap-1"
                    onClick={() => act(w.id, 'approve')}
                    disabled={acting === w.id + 'approve'}
                  >
                    {acting === w.id + 'approve' ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    onClick={() => act(w.id, 'reject')}
                    disabled={acting === w.id + 'reject'}
                  >
                    {acting === w.id + 'reject' ? <Loader2 className="size-3.5 animate-spin" /> : <X className="size-3.5" />}
                    Reject
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  )
}
