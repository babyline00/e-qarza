'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  Settings as SettingsIcon, Code, MessageSquare, Save, Loader2, UserCog,
  Plus, Trash2, Pencil, X, Shield, Check, ShieldCheck, Image as ImageIcon, Upload,
} from 'lucide-react'

interface Settings {
  customChatCode: string
  customChatEnabled: boolean
  customHeaderCode: string
  customHeaderEnabled: boolean
  customFooterCode: string
  customFooterEnabled: boolean
  autoApproveKyc: boolean
}

interface StaffMember {
  id: string
  email: string
  name: string
  phone: string | null
  banned: boolean
  access: string[]
  createdAt: string
}

const ALL_TABS = ['analytics', 'kyc', 'payments', 'applications', 'withdrawals', 'manage', 'users', 'settings']
const TAB_LABELS: Record<string, string> = {
  analytics: 'Analytics',
  kyc: 'KYC Review',
  payments: 'Payments',
  applications: 'Applications',
  withdrawals: 'Withdrawals',
  manage: 'Manage Plans/Banks',
  users: 'Users',
  settings: 'Settings',
}

export function AdminSettingsTab() {
  const [settings, setSettings] = useState<Settings | null>(null)
  const [saving, setSaving] = useState(false)
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [loadingStaff, setLoadingStaff] = useState(true)
  const [editingStaff, setEditingStaff] = useState<Partial<StaffMember> & { password?: string } | null>(null)
  const [logoPath, setLogoPath] = useState<string | null>(null)
  const [uploadingLogo, setUploadingLogo] = useState(false)

  const loadSettings = useCallback(async () => {
    try {
      const r = await api<{ settings: Settings }>('/api/admin/settings')
      setSettings(r.settings)
    } catch (e) {
      toast.error((e as Error).message)
    }
  }, [])

  const loadStaff = useCallback(async () => {
    setLoadingStaff(true)
    try {
      const r = await api<{ staff: StaffMember[] }>('/api/admin/staff')
      setStaff(r.staff)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoadingStaff(false)
    }
  }, [])

  useEffect(() => {
    loadSettings()
    loadStaff()
    // Load logo
    api<{ logoPath: string | null }>('/api/admin/logo').then(r => setLogoPath(r.logoPath)).catch(() => {})
  }, [loadSettings, loadStaff])

  async function uploadLogo(file: File | null) {
    if (!file) return
    if (file.size > 1024 * 1024) { toast.error('Logo too large (max 1MB)'); return }
    setUploadingLogo(true)
    try {
      const fd = new FormData()
      fd.append('logo', file)
      const res = await fetch('/api/admin/logo', { method: 'POST', body: fd, credentials: 'same-origin' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Upload failed')
      setLogoPath(data.logoPath)
      toast.success('Logo updated')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setUploadingLogo(false)
    }
  }

  async function deleteLogo() {
    try {
      await api('/api/admin/logo', { method: 'DELETE' })
      setLogoPath(null)
      toast.success('Logo removed')
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  async function saveSettings() {
    if (!settings) return
    setSaving(true)
    try {
      await api('/api/admin/settings', { method: 'POST', body: JSON.stringify(settings) })
      toast.success('Settings saved')
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function saveStaff() {
    if (!editingStaff) return
    const body: Record<string, unknown> = {
      name: editingStaff.name || '',
      email: editingStaff.email || '',
      access: editingStaff.access || [],
    }
    if (editingStaff.id) body.id = editingStaff.id
    if (editingStaff.password) body.password = editingStaff.password

    setSaving(true)
    try {
      await api('/api/admin/staff', { method: 'POST', body: JSON.stringify(body) })
      toast.success(editingStaff.id ? 'Staff updated' : 'Staff created')
      setEditingStaff(null)
      loadStaff()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteStaff(id: string) {
    if (!confirm('Delete this staff account?')) return
    try {
      await api(`/api/admin/staff?id=${id}`, { method: 'DELETE' })
      toast.success('Staff deleted')
      loadStaff()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  function toggleStaffAccess(tab: string) {
    if (!editingStaff) return
    const current = editingStaff.access || []
    const next = current.includes(tab) ? current.filter((t) => t !== tab) : [...current, tab]
    setEditingStaff({ ...editingStaff, access: next })
  }

  return (
    <div className="space-y-6">
      {/* Site Logo Upload */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><ImageIcon className="size-4 text-primary" /> Site Logo</CardTitle>
          <CardDescription>Upload a custom logo for your app (shown in header + footer)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <div className="grid size-20 place-items-center rounded-xl border-2 border-dashed border-border bg-muted/30 shrink-0 overflow-hidden">
              {logoPath ? (
                <img src={logoPath} alt="Site logo" className="size-full object-contain p-1" />
              ) : (
                <ImageIcon className="size-8 text-muted-foreground/50" />
              )}
            </div>
            <div className="flex-1 space-y-2">
              <label className="inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-white cursor-pointer hover:opacity-90 transition">
                {uploadingLogo ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
                {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  className="hidden"
                  onChange={(e) => uploadLogo(e.target.files?.[0] || null)}
                  disabled={uploadingLogo}
                />
              </label>
              {logoPath && (
                <Button size="sm" variant="outline" className="gap-1 text-destructive" onClick={deleteLogo}>
                  <Trash2 className="size-3.5" /> Remove Logo
                </Button>
              )}
              <p className="text-[11px] text-muted-foreground">JPG, PNG, WEBP, SVG — max 1MB</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Custom Code Settings */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base"><Code className="size-4 text-primary" /> Custom Code Injection</CardTitle>
          <CardDescription>Add custom scripts or code to your app (chat widgets, analytics, etc.)</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {settings ? (
            <>
              {/* Chat code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <MessageSquare className="size-4 text-primary" /> Custom Chat Code
                  </Label>
                  <Switch
                    checked={settings.customChatEnabled}
                    onCheckedChange={(v) => setSettings({ ...settings, customChatEnabled: v })}
                  />
                </div>
                <Textarea
                  value={settings.customChatCode}
                  onChange={(e) => setSettings({ ...settings, customChatCode: e.target.value })}
                  rows={4}
                  placeholder="<!-- Paste chat widget embed code here (e.g. Tawk.to, Crisp, Intercom) -->"
                  className="font-mono text-xs"
                  disabled={!settings.customChatEnabled}
                />
                <p className="text-[11px] text-muted-foreground">Injected into the page body. Supports HTML/script tags.</p>
              </div>

              <Separator />

              {/* Header code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Code className="size-4 text-primary" /> Custom Header Code
                  </Label>
                  <Switch
                    checked={settings.customHeaderEnabled}
                    onCheckedChange={(v) => setSettings({ ...settings, customHeaderEnabled: v })}
                  />
                </div>
                <Textarea
                  value={settings.customHeaderCode}
                  onChange={(e) => setSettings({ ...settings, customHeaderCode: e.target.value })}
                  rows={3}
                  placeholder="<!-- Analytics, meta tags, etc. (injected into <head>) -->"
                  className="font-mono text-xs"
                  disabled={!settings.customHeaderEnabled}
                />
              </div>

              <Separator />

              {/* Footer code */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2 text-sm font-medium">
                    <Code className="size-4 text-primary" /> Custom Footer Code
                  </Label>
                  <Switch
                    checked={settings.customFooterEnabled}
                    onCheckedChange={(v) => setSettings({ ...settings, customFooterEnabled: v })}
                  />
                </div>
                <Textarea
                  value={settings.customFooterCode}
                  onChange={(e) => setSettings({ ...settings, customFooterCode: e.target.value })}
                  rows={3}
                  placeholder="<!-- Tracking pixels, additional scripts -->"
                  className="font-mono text-xs"
                  disabled={!settings.customFooterEnabled}
                />
              </div>

              <Separator />

              {/* Auto-approve KYC toggle */}
              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="size-5 text-primary" />
                  <div>
                    <Label className="text-sm font-medium">Auto-Approve KYC</Label>
                    <p className="text-[11px] text-muted-foreground">Automatically approve all KYC submissions without admin review</p>
                  </div>
                </div>
                <Switch
                  checked={settings.autoApproveKyc}
                  onCheckedChange={(v) => setSettings({ ...settings, autoApproveKyc: v })}
                />
              </div>

              <Button className="w-full bg-brand-gradient text-white hover:opacity-90" onClick={saveSettings} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save Settings
              </Button>
            </>
          ) : (
            <div className="space-y-3">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Staff Management */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-base"><UserCog className="size-4 text-primary" /> Staff Roles & Access</CardTitle>
              <CardDescription>Create staff accounts with limited admin access</CardDescription>
            </div>
            <Button size="sm" className="bg-brand-gradient text-white hover:opacity-90 gap-1" onClick={() => setEditingStaff({ name: '', email: '', password: '', access: [] })}>
              <Plus className="size-4" /> Add Staff
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingStaff ? (
            <div className="space-y-2">
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-16 w-full rounded-xl" />
            </div>
          ) : staff.length === 0 && !editingStaff ? (
            <div className="py-8 text-center text-muted-foreground">
              <UserCog className="size-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm font-medium">No staff members</p>
              <p className="text-xs mt-0.5">Create staff accounts with limited admin access</p>
            </div>
          ) : (
            <div className="space-y-2">
              {staff.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-xl border p-3">
                  <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <Shield className="size-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{s.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.email}</p>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {s.access.length === 0 ? (
                        <Badge variant="outline" className="text-[10px]">No access</Badge>
                      ) : (
                        s.access.map((t) => (
                          <Badge key={t} variant="outline" className="text-[10px] bg-primary/5">{TAB_LABELS[t] || t}</Badge>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={() => setEditingStaff({ ...s, password: '' })}>
                      <Pencil className="size-3.5" />
                    </Button>
                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 text-destructive" onClick={() => deleteStaff(s.id)}>
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Staff editor */}
          {editingStaff && (
            <div className="mt-4 rounded-xl border-2 border-primary/40 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-bold">{editingStaff.id ? 'Edit Staff' : 'New Staff Member'}</p>
                <Button size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => setEditingStaff(null)}>
                  <X className="size-4" />
                </Button>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs">Name</Label>
                  <Input value={editingStaff.name || ''} onChange={(e) => setEditingStaff({ ...editingStaff, name: e.target.value })} placeholder="Staff name" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">Email</Label>
                  <Input type="email" value={editingStaff.email || ''} onChange={(e) => setEditingStaff({ ...editingStaff, email: e.target.value })} placeholder="staff@e-qarza.pk" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">{editingStaff.id ? 'New Password (leave blank to keep)' : 'Password'}</Label>
                <Input type="password" value={editingStaff.password || ''} onChange={(e) => setEditingStaff({ ...editingStaff, password: e.target.value })} placeholder="Min. 6 characters" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium">Admin Tab Access</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                  {ALL_TABS.map((tab) => {
                    const active = (editingStaff.access || []).includes(tab)
                    return (
                      <button
                        key={tab}
                        type="button"
                        onClick={() => toggleStaffAccess(tab)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs transition ${
                          active ? 'border-primary bg-primary/10 text-primary' : 'border-muted text-muted-foreground hover:border-primary/30'
                        }`}
                      >
                        {active && <Check className="size-3" />}
                        {TAB_LABELS[tab] || tab}
                      </button>
                    )
                  })}
                </div>
              </div>
              <Button className="w-full bg-brand-gradient text-white hover:opacity-90" onClick={saveStaff} disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                {editingStaff.id ? 'Update Staff' : 'Create Staff'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
