'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api-client'
import { useAdminRefresh } from '@/lib/use-admin-refresh'
import { fmtPKR } from '@/lib/format'
import { toast } from 'sonner'
import {
  Wallet, Building2, Plus, Pencil, Trash2, Save, X, Loader2, Check, Landmark, Coins,
} from 'lucide-react'

interface Plan {
  id: string
  name: string
  amount: number
  interestRate: number
  tenureMonths: number
  processingFee: number
  description: string | null
  active: boolean
}

interface Bank {
  id: string
  bankName: string
  accountTitle: string
  accountNumber: string
  iban: string
  active: boolean
}

export function AdminManageTab() {
  const [plans, setPlans] = useState<Plan[]>([])
  const [banks, setBanks] = useState<Bank[]>([])
  const [loading, setLoading] = useState(true)
  const [editingPlan, setEditingPlan] = useState<Partial<Plan> | null>(null)
  const [editingBank, setEditingBank] = useState<Partial<Bank> | null>(null)
  const [saving, setSaving] = useState(false)

  const load = useCallback(async (force = false) => {
    setLoading(true)
    try {
      const [p, b] = await Promise.all([
        api<{ plans: Plan[] }>('/api/admin/plans', { force }),
        api<{ banks: Bank[] }>('/api/admin/banks', { force }),
      ])
      setPlans(p.plans)
      setBanks(b.banks)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  useAdminRefresh(useCallback(() => load(true), [load]))

  async function savePlan() {
    if (!editingPlan) return
    const { name, amount, interestRate, tenureMonths, processingFee, description, active } = editingPlan
    if (!name || amount == null || interestRate == null || !tenureMonths || processingFee == null) {
      toast.error('Fill all required fields')
      return
    }
    setSaving(true)
    try {
      await api('/api/admin/plans', {
        method: 'POST',
        body: JSON.stringify({
          id: editingPlan.id || undefined,
          name, amount: Number(amount), interestRate: Number(interestRate),
          tenureMonths: Number(tenureMonths), processingFee: Number(processingFee),
          description: description || '', active: active ?? true,
        }),
      })
      toast.success(editingPlan.id ? 'Plan updated' : 'Plan created')
      setEditingPlan(null)
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function deletePlan(id: string) {
    if (!confirm('Delete this plan?')) return
    try {
      await api(`/api/admin/plans?id=${id}`, { method: 'DELETE' })
      toast.success('Plan deleted')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  async function saveBank() {
    if (!editingBank) return
    const { bankName, accountTitle, accountNumber, iban, active } = editingBank
    if (!bankName || !accountTitle || !accountNumber || !iban) {
      toast.error('Fill all required fields')
      return
    }
    setSaving(true)
    try {
      await api('/api/admin/banks', {
        method: 'POST',
        body: JSON.stringify({
          id: editingBank.id || undefined,
          bankName, accountTitle, accountNumber, iban, active: active ?? true,
        }),
      })
      toast.success(editingBank.id ? 'Bank updated' : 'Bank added')
      setEditingBank(null)
      load()
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  async function deleteBank(id: string) {
    if (!confirm('Delete this bank detail?')) return
    try {
      await api(`/api/admin/banks?id=${id}`, { method: 'DELETE' })
      toast.success('Bank deleted')
      load()
    } catch (e) {
      toast.error((e as Error).message)
    }
  }

  if (loading) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm">Loading…</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Plans */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold"><Coins className="size-4 text-primary" /> Loan Plans</h3>
          <Button size="sm" className="bg-brand-gradient text-white hover:opacity-90" onClick={() => setEditingPlan({ name: '', amount: 0, interestRate: 12, tenureMonths: 3, processingFee: 500, active: true })}>
            <Plus className="size-4" /> Add Plan
          </Button>
        </div>

        {editingPlan && (
          <Card className="mb-3 rounded-2xl border-primary/40 bg-primary/5">
            <CardContent className="pt-5 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Plan Name</Label>
                  <Input value={editingPlan.name || ''} onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })} placeholder="e.g. Starter" />
                </div>
                <div className="space-y-1.5">
                  <Label>Loan Amount (Rs)</Label>
                  <Input type="number" value={editingPlan.amount ?? 0} onChange={(e) => setEditingPlan({ ...editingPlan, amount: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Interest Rate (%)</Label>
                  <Input type="number" step="0.1" value={editingPlan.interestRate ?? 0} onChange={(e) => setEditingPlan({ ...editingPlan, interestRate: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Tenure (months)</Label>
                  <Input type="number" value={editingPlan.tenureMonths ?? 0} onChange={(e) => setEditingPlan({ ...editingPlan, tenureMonths: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Processing Fee (Rs)</Label>
                  <Input type="number" value={editingPlan.processingFee ?? 0} onChange={(e) => setEditingPlan({ ...editingPlan, processingFee: Number(e.target.value) })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Active</Label>
                  <div className="flex items-center gap-2 h-9">
                    <Switch checked={editingPlan.active ?? true} onCheckedChange={(c) => setEditingPlan({ ...editingPlan, active: c })} />
                    <span className="text-xs text-muted-foreground">{editingPlan.active ? 'Visible to users' : 'Hidden'}</span>
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label>Description</Label>
                <Textarea value={editingPlan.description || ''} onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })} rows={2} placeholder="Short description" />
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={savePlan} disabled={saving} className="bg-brand-gradient text-white hover:opacity-90">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingPlan(null)}><X className="size-4" /> Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {plans.map((p) => (
            <Card key={p.id} className="rounded-2xl">
              <CardContent className="flex items-center gap-3 p-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white"><Wallet className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{p.name}</p>
                    {!p.active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {fmtPKR(p.amount)} • {p.interestRate}% • {p.tenureMonths} mo • fee {fmtPKR(p.processingFee)}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditingPlan({ ...p })}><Pencil className="size-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deletePlan(p.id)}><Trash2 className="size-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <Separator />

      {/* Banks */}
      <div>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-bold"><Landmark className="size-4 text-primary" /> Bank Details</h3>
          <Button size="sm" className="bg-brand-gradient text-white hover:opacity-90" onClick={() => setEditingBank({ bankName: '', accountTitle: '', accountNumber: '', iban: '', active: true })}>
            <Plus className="size-4" /> Add Bank
          </Button>
        </div>

        {editingBank && (
          <Card className="mb-3 rounded-2xl border-primary/40 bg-primary/5">
            <CardContent className="pt-5 space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label>Bank Name</Label>
                  <Input value={editingBank.bankName || ''} onChange={(e) => setEditingBank({ ...editingBank, bankName: e.target.value })} placeholder="e.g. HBL" />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Title</Label>
                  <Input value={editingBank.accountTitle || ''} onChange={(e) => setEditingBank({ ...editingBank, accountTitle: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>Account Number</Label>
                  <Input value={editingBank.accountNumber || ''} onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })} />
                </div>
                <div className="space-y-1.5">
                  <Label>IBAN</Label>
                  <Input value={editingBank.iban || ''} onChange={(e) => setEditingBank({ ...editingBank, iban: e.target.value })} />
                </div>
                <div className="space-y-1.5 sm:col-span-2">
                  <Label>Active</Label>
                  <div className="flex items-center gap-2 h-9">
                    <Switch checked={editingBank.active ?? true} onCheckedChange={(c) => setEditingBank({ ...editingBank, active: c })} />
                    <span className="text-xs text-muted-foreground">{editingBank.active ? 'Shown to users' : 'Hidden'}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={saveBank} disabled={saving} className="bg-brand-gradient text-white hover:opacity-90">
                  {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
                </Button>
                <Button size="sm" variant="outline" onClick={() => setEditingBank(null)}><X className="size-4" /> Cancel</Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-2">
          {banks.map((b) => (
            <Card key={b.id} className="rounded-2xl">
              <CardContent className="flex items-center gap-3 p-3.5">
                <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand-gradient text-white"><Building2 className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-bold truncate">{b.bankName}</p>
                    {!b.active && <Badge variant="outline" className="text-xs">Inactive</Badge>}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">
                    {b.accountTitle} • {b.accountNumber} • {b.iban}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => setEditingBank({ ...b })}><Pencil className="size-4" /></Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBank(b.id)}><Trash2 className="size-4" /></Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}
