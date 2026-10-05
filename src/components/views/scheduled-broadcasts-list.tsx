'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'
import { fmtDateTime } from '@/lib/format'
import { toast } from 'sonner'
import { Clock, Trash2, CheckCircle2, Loader2, CalendarClock } from 'lucide-react'

interface ScheduledItem {
  id: string
  title: string
  message: string
  type: string
  channel: string
  scheduledFor: string
  sent: boolean
  createdAt: string
}

export function ScheduledBroadcastsList() {
  const [items, setItems] = useState<ScheduledItem[]>([])
  const [loading, setLoading] = useState(true)
  const [canceling, setCanceling] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const r = await api<{ scheduled: ScheduledItem[] }>('/api/admin/broadcast')
      setItems(r.scheduled)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 15000)
    return () => clearInterval(t)
  }, [load])

  async function cancel(id: string) {
    if (!confirm('Cancel this scheduled broadcast?')) return
    setCanceling(id)
    try {
      await api(`/api/admin/broadcast?id=${id}`, { method: 'DELETE' })
      toast.success('Scheduled broadcast cancelled')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setCanceling(null)
    }
  }

  if (loading) {
    return <Skeleton className="h-20 rounded-2xl" />
  }
  if (items.length === 0) return null

  return (
    <Card className="overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-5 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-primary/10 text-primary">
          <CalendarClock className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold">Scheduled Broadcasts</h3>
          <p className="text-[11px] text-muted-foreground">{items.filter((i) => !i.sent).length} pending</p>
        </div>
      </div>
      <CardContent className="p-3 space-y-2">
        {items.map((item) => (
          <div
            key={item.id}
            className={`rounded-xl border p-3 transition ${item.sent ? 'opacity-60' : ''}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="text-sm font-semibold truncate">{item.title}</p>
                  {item.sent ? (
                    <Badge className="gap-1 bg-success/15 text-success border-0 text-[10px]">
                      <CheckCircle2 className="size-2.5" /> Sent
                    </Badge>
                  ) : (
                    <Badge className="gap-1 bg-amber-100 text-amber-700 border-0 text-[10px]">
                      <Clock className="size-2.5" /> Pending
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-[10px] capitalize border-0 bg-muted/50">
                    {item.channel.replace('_', '-')}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.message}</p>
                <p className="text-[11px] text-muted-foreground mt-1 flex items-center gap-1">
                  <CalendarClock className="size-3" />
                  {item.sent ? 'Sent at' : 'Scheduled for'} {fmtDateTime(item.scheduledFor)}
                </p>
              </div>
              {!item.sent && (
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 shrink-0"
                  onClick={() => cancel(item.id)}
                  disabled={canceling === item.id}
                  title="Cancel scheduled broadcast"
                >
                  {canceling === item.id ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" />}
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
