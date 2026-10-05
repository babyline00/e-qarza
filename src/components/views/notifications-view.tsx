'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { api } from '@/lib/api-client'
import { timeAgo } from '@/lib/format'
import { Bell, CheckCircle2, AlertCircle, Info, CheckCheck, Inbox, Clock } from 'lucide-react'

export function NotificationsView() {
  const { notifications, setNotifications } = useAppStore()

  // mark all as read on view
  useEffect(() => {
    const unread = notifications.filter((n) => !n.read)
    if (unread.length === 0) return
    api('/api/notifications', { method: 'PATCH', body: JSON.stringify({ all: true }) })
      .then(() => {
        setNotifications(notifications.map((n) => ({ ...n, read: true })))
      })
      .catch(() => {})
  }, [])

  if (notifications.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <PageHeader title="Notifications" description="Stay updated on your application and payments." icon={Bell} />
        <Card className="mt-6 rounded-2xl border-dashed">
          <CardContent className="py-12 text-center">
            <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <Inbox className="size-7" />
            </span>
            <p className="font-semibold">No notifications</p>
            <p className="mt-1 text-sm text-muted-foreground">You're all caught up!</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="Notifications" description="Stay updated on your application and payments." icon={Bell}>
        <Button
          size="sm"
          variant="outline"
          onClick={async () => {
            await api('/api/notifications', { method: 'PATCH', body: JSON.stringify({ all: true }) })
            setNotifications(notifications.map((n) => ({ ...n, read: true })))
          }}
          className="gap-2"
        >
          <CheckCheck className="size-4" /> Mark all read
        </Button>
      </PageHeader>

      <div className="mt-6 space-y-3">
        {notifications.map((n) => {
          const circleClass =
            n.type === 'success' ? 'bg-success/10 text-success' :
            n.type === 'error' ? 'bg-destructive/10 text-destructive' :
            n.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-primary/10 text-primary'
          const Icon =
            n.type === 'success' ? CheckCircle2 :
            n.type === 'error' ? AlertCircle :
            n.type === 'warning' ? Clock : Info
          return (
            <Card
              key={n.id}
              className={`rounded-2xl shadow-sm transition ${!n.read ? 'border-primary/40 bg-primary/5' : ''}`}
            >
              <CardContent className="flex gap-3 p-4">
                <span className={`mt-0.5 grid size-10 shrink-0 place-items-center rounded-full ${circleClass}`}>
                  <Icon className="size-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold leading-tight">{n.title}</p>
                    {!n.read && (
                      <Badge className="h-5 border-0 bg-primary text-primary-foreground text-[10px]">New</Badge>
                    )}
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">{n.message}</p>
                  <p className="mt-1 text-xs text-muted-foreground/70">{timeAgo(n.createdAt)}</p>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
