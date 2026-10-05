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
import { Megaphone, Loader2, Send } from 'lucide-react'

export function BroadcastCard() {
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [type, setType] = useState('info')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState<number | null>(null)

  async function send() {
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required')
      return
    }
    setSending(true)
    setSent(null)
    try {
      const r = await api<{ sent: number }>('/api/admin/broadcast', {
        method: 'POST',
        body: JSON.stringify({ title, message, type }),
      })
      toast.success(`Broadcast sent to ${r.sent} users`)
      setSent(r.sent)
      setTitle('')
      setMessage('')
      setType('info')
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
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="bc-msg">Message</Label>
          <Textarea id="bc-msg" value={message} onChange={(e) => setMessage(e.target.value)} rows={3} placeholder="Type your announcement…" maxLength={1000} />
          <p className="text-xs text-muted-foreground text-right">{message.length}/1000</p>
        </div>
        <Button className="w-full bg-brand-gradient text-white hover:opacity-90" onClick={send} disabled={sending}>
          {sending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
          {sending ? 'Sending…' : 'Broadcast to All Users'}
        </Button>
        {sent !== null && (
          <div className="flex items-center justify-center gap-2 rounded-lg bg-success/10 p-2 text-sm text-success">
            <Megaphone className="size-4" /> Successfully delivered to {sent} user{sent !== 1 ? 's' : ''}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
