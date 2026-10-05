'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { api } from '@/lib/api-client'
import { timeAgo } from '@/lib/format'
import { Bell, CheckCircle2, AlertCircle, Info, CheckCheck, Inbox } from 'lucide-react'

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
        <Card className="mt-6 border-dashed">
          <CardContent className="py-12 text-center">
            <Inbox className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No notifications</p>
            <p className="text-sm text-muted-foreground mt-1">You’re all caught up!</p>
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
        >
          <CheckCheck className="size-4" /> Mark all read
        </Button>
      </PageHeader>

      <div className="mt-6 space-y-2.5">
        {notifications.map((n) => (
          <Card key={n.id} className={!n.read ? 'border-primary/40 bg-primary/5' : ''}>
            <CardContent className="py-3.5 flex gap-3">
              <div className={`mt-0.5 grid size-9 place-items-center rounded-full shrink-0 ${
                n.type === 'success' ? 'bg-primary/10 text-primary' :
                n.type === 'error' ? 'bg-destructive/10 text-destructive' :
                n.type === 'warning' ? 'bg-amber-100 text-amber-700' : 'bg-muted text-muted-foreground'
              }`}>
                {n.type === 'success' ? <CheckCircle2 className="size-4" /> : n.type === 'error' ? <AlertCircle className="size-4" /> : <Info className="size-4" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium leading-tight">{n.title}</p>
                  {!n.read && <Badge variant="default" className="text-xs h-5">New</Badge>}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">{n.message}</p>
                <p className="text-xs text-muted-foreground/70 mt-1">{timeAgo(n.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
