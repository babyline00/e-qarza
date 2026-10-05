'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Megaphone, Loader2, Send, Clock } from 'lucide-react'

export function BroadcastCard() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [channel, setChannel] = useState('in_app')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<number | null>(null)
  const [scheduled, setScheduled] = useState(false)
  const [scheduledFor, setScheduledFor] = useState('')

  async function send() {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required')
      return
    }
    if (scheduled && !scheduledFor) {
      toast.error('Please pick a date/time to schedule')
      return
    }
    setSending(true)
    setSent(null)
    try {
      const body: Record<string, string> = { title, message, type, channel }
      if (scheduled && scheduledFor) body.scheduledFor = new Date(scheduledFor).toISOString()
      const r = await api<{ sent?: number; scheduled?: boolean }>('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      if (r.scheduled) {
        toast.success('Broadcast scheduled successfully')
        setSent(-1) // sentinel for scheduled
      } else {
        toast.success(`Broadcast sent (${r.sent} deliveries)`)
        setSent(r.sent || 0)
      }
      setTitle('')
      setMessage('')
      setType('info')
      setChannel('in_app')
      setScheduled(false)
      setScheduledFor('')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSending(false)
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl">
      <div className="flex items-center gap-2 border-b bg-brand-gradient px-5 py-3 text-white">
        <span className="grid size-8 place-items-center rounded-lg bg-white/20">
          <Megaphone className="size-4" />
        </span>
        <div>
          <h3 className="text-sm font-bold">Broadcast Notification</h3>
          <p className="text-[11px] text-white/80">Send a message to all active users</p>
        </div>
      </div>
      <CardContent className="pt-5 space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="bc-title">Title</Label>
            <Input id="bc-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Scheduled maintenance" maxLength={120} />
          </div>
          <div className="grid gap-3 grid-cols-2">
            <div className="space-y-1.5">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Channel</Label>
              <Select value={channel} onValueChange={setChannel}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_app">In-App</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="all">All Channels</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bc-msg">Message</Label>
          <Textarea id="bc-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Type your announcement…" maxLength={1000} />
          <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
        </div>
        {/* Schedule toggle */}
        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={scheduled}
              onChange={(e) => setScheduled(e.target.checked)}
              className="size-4 rounded border-muted-foreground/30 text-primary focus:ring-primary"
            />
            <span className="text-xs font-medium">Schedule for later</span>
          </label>
          {scheduled && (
            <Input
              type="datetime-local"
              value={scheduledFor}
              onChange={(e) => setScheduledFor(e.target.value)}
              className="h-8 w-auto text-xs"
              min={new Date().toISOString().slice(0, 16)}
            />
          )}
        </div>
        <Button className="w-full bg-brand-gradient text-white hover:opacity-90" onClick={send} disabled={sending}>
          {sending ? <Loader2 className="size-4 animate-spin" /> : scheduled ? <Clock className="size-4" /> : <Send className="size-4" />}
          {sending ? 'Sending…' : scheduled ? 'Schedule Broadcast' : 'Broadcast to All Users'}
        </Button>
        {sent !== null && (
          <div className={`flex items-center justify-center gap-2 rounded-lg p-2 text-sm ${sent === -1 ? 'bg-primary/10 text-primary' : 'bg-success/10 text-success'}`}>
            <Megaphone className="size-4" />
            {sent === -1 ? 'Broadcast scheduled — will be sent at the configured time' : `Successfully delivered to ${sent} user${sent !== 1 ? 's' : ''}`}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
