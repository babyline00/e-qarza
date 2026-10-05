'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Bell, Mail, MessageSquare, Smartphone, Loader2, Save } from 'lucide-react'

interface Prefs {
  in_app: boolean
  email: boolean
  sms: boolean
}

export function NotificationPreferences() {
  const [prefs, setPrefs] = useState<Prefs>({ in_app: true, email: true, sms: true })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    let cancelled = false
    api<{ preferences: Prefs }>('/api/notifications/preferences')
      .then((r) => { if (!cancelled) setPrefs(r.preferences) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [])

  async function save() {
    setSaving(true)
    try {
      await api('/api/notifications/preferences', { method: 'POST', body: JSON.stringify(prefs) })
      toast.success('Notification preferences updated')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const channels = [
    { key: 'in_app' as const, label: 'In-App', desc: 'Notifications within the app', icon: Bell },
    { key: 'email' as const, label: 'Email', desc: 'Updates via email', icon: Mail },
    { key: 'sms' as const, label: 'SMS', desc: 'Payment reminders via SMS', icon: MessageSquare },
  ]

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <div className="flex items-center gap-2 border-b bg-muted/30 px-5 py-3">
        <span className="grid size-8 place-items-center rounded-lg bg-brand-gradient text-white">
          <Smartphone className="size-4" />
        </span>
        <h3 className="text-sm font-bold">Notification Preferences</h3>
      </div>
      <CardContent className="pt-5">
        {loading ? (
          <div className="flex items-center justify-center py-6">
            <Loader2 className="size-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {channels.map((c) => (
                <div key={c.key} className="flex items-center gap-3 rounded-xl border p-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <c.icon className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={`pref-${c.key}`} className="text-sm font-medium cursor-pointer">{c.label}</Label>
                    <p className="text-xs text-muted-foreground">{c.desc}</p>
                  </div>
                  <Switch
                    id={`pref-${c.key}`}
                    checked={prefs[c.key]}
                    onCheckedChange={(v) => setPrefs({ ...prefs, [c.key]: v })}
                  />
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="outline" className="text-[10px]">
                {Object.values(prefs).filter(Boolean).length} channel{Object.values(prefs).filter(Boolean).length !== 1 ? 's' : ''} enabled
              </Badge>
            </div>
            <Button className="w-full mt-4 bg-brand-gradient text-white hover:opacity-90" onClick={save} disabled={saving}>
              {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save Preferences
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  )
}
