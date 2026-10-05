'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { useAppStore } from '@/lib/store'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { fmtRupees } from '@/lib/format'
import { Pencil, Save, X, Loader2, Lock } from 'lucide-react'

const PAKISTANI_CITIES = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad', 'Multan',
  'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot', 'Gujranwala', 'Bahawalpur',
  'Sargodha', 'Sukkur', 'Abbottabad', 'Mardan', 'Other',
]

export function ProfileEditCard() {
  const { kyc, user } = useAppStore()
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(false)
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [city, setCity] = useState('')
  const [occupation, setOccupation] = useState('')
  const [income, setIncome] = useState('')

  // initialize editable fields from store
  useEffect(() => {
    if (kyc) {
      setPhone(kyc.phoneNumber || '')
      setAddress(kyc.address || '')
      setCity(kyc.city || '')
      setOccupation(kyc.occupation || '')
      setIncome(kyc.monthlyIncome != null ? String(kyc.monthlyIncome / 100) : '')
    }
  }, [kyc])

  async function save() {
    setLoading(true)
    try {
      await api('/api/kyc/update', {
        method: 'POST',
        body: JSON.stringify({
          phone,
          address,
          city,
          occupation,
          monthlyIncome: Number(income),
        }),
      })
      toast.success('Profile updated')
      setEditing(false)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="overflow-hidden rounded-2xl shadow-sm">
      <div className="flex items-center justify-between border-b bg-muted/30 px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 place-items-center rounded-lg bg-brand-gradient text-white">
            <Pencil className="size-4" />
          </span>
          <h3 className="text-sm font-bold">Editable Details</h3>
        </div>
        {kyc?.status === 'approved' && (
          <Badge className="gap-1 bg-success/15 text-success border-0">
            <Lock className="size-3" /> Identity locked
          </Badge>
        )}
      </div>
      <CardContent className="pt-5">
        {!editing ? (
          <div className="space-y-2.5 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Phone</span><span className="font-medium">{phone || '—'}</span></div>
            <div className="flex justify-between gap-3"><span className="text-muted-foreground shrink-0">Address</span><span className="font-medium text-right">{address || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">City</span><span className="font-medium">{city || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Occupation</span><span className="font-medium">{occupation || '—'}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Monthly Income</span><span className="font-medium">{income ? `Rs ${fmtRupees(Number(income))}` : '—'}</span></div>
            <Button variant="outline" className="w-full mt-2" onClick={() => setEditing(true)}>
              <Pencil className="size-4" /> Edit Details
            </Button>
            <p className="text-[11px] text-muted-foreground text-center pt-1">
              Identity fields (name, father name, DOB, CNIC) are locked after KYC approval.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="ed-phone">Phone Number</Label>
              <Input id="ed-phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="03001234567" inputMode="numeric" maxLength={11} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-address">Residential Address</Label>
              <Textarea id="ed-address" value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="House #, Street, Area" />
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Select value={city} onValueChange={setCity}>
                <SelectTrigger><SelectValue placeholder="Select city" /></SelectTrigger>
                <SelectContent className="max-h-72">
                  {PAKISTANI_CITIES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-occ">Occupation</Label>
              <Input id="ed-occ" value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="e.g. Teacher" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ed-inc">Monthly Income (Rs)</Label>
              <Input id="ed-inc" type="number" min={0} value={income} onChange={(e) => setIncome(e.target.value)} placeholder="45000" inputMode="numeric" />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setEditing(false)} disabled={loading}>
                <X className="size-4" /> Cancel
              </Button>
              <Button className="flex-1 bg-brand-gradient text-white hover:opacity-90" onClick={save} disabled={loading}>
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />} Save
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
