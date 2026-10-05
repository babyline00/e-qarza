'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/shared/page-header'
import { api } from '@/lib/api-client'
import { fmtPKR, fmtDateTime } from '@/lib/format'
import { toast } from 'sonner'
import {
  ShieldCheck, Banknote, Check, X, Loader2, Inbox, User as UserIcon, FileImage,
  RefreshCw,
} from 'lucide-react'

interface KycItem {
  id: string
  cnicName: string | null
  fatherName: string | null
  dob: string | null
  phoneNumber: string | null
  city: string | null
  occupation: string | null
  cnicFrontPath: string | null
  cnicBackPath: string | null
  selfiePath: string | null
  submittedAt: string | null
  user: { id: string; email: string; name: string | null }
}

interface PaymentItem {
  id: string
  userId: string
  userEmail: string
  userName: string | null
  applicationId: string | null
  type: string
  amount: number
  status: string
  txnRef: string | null
  proofPath: string | null
  createdAt: string
  planName: string | null
  installmentNumber: number | null
}

export function AdminView() {
  const [kycs, setKycs] = useState<KycItem[]>([])
  const [payments, setPayments] = useState<PaymentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [acting, setActing] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [k, p] = await Promise.all([
        api<{ profiles: KycItem[] }>('/api/admin/kyc'),
        api<{ payments: PaymentItem[] }>('/api/admin/payment'),
      ])
      setKycs(k.profiles)
      setPayments(p.payments)
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const t = setInterval(load, 8000)
    return () => clearInterval(t)
  }, [load])

  async function actKyc(kycId: string, action: 'approve' | 'reject') {
    setActing(kycId)
    try {
      await api('/api/admin/kyc', { method: 'POST', body: JSON.stringify({ kycId, action }) })
      toast.success(action === 'approve' ? 'KYC approved' : 'KYC rejected')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setActing(null)
    }
  }

  async function actPayment(paymentId: string, action: 'approve' | 'reject') {
    setActing(paymentId)
    try {
      await api('/api/admin/payment', { method: 'POST', body: JSON.stringify({ paymentId, action }) })
      toast.success(action === 'approve' ? 'Payment approved' : 'Payment rejected')
      load()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setActing(null)
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <PageHeader
        title="Admin Dashboard"
        description="Review and approve KYC applications and payment proofs."
        icon={ShieldCheck}
      >
        <Button size="sm" variant="outline" onClick={load} disabled={loading}>
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </PageHeader>

      <Tabs defaultValue="kyc" className="mt-6">
        <TabsList>
          <TabsTrigger value="kyc" className="gap-2">
            <ShieldCheck className="size-4" /> KYC
            {kycs.length > 0 && <Badge variant="secondary" className="ml-1">{kycs.length}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="payments" className="gap-2">
            <Banknote className="size-4" /> Payments
            {payments.length > 0 && <Badge variant="secondary" className="ml-1">{payments.length}</Badge>}
          </TabsTrigger>
        </TabsList>

        {/* KYC review */}
        <TabsContent value="kyc" className="space-y-4 mt-4">
          {kycs.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Inbox className="size-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No pending KYCs</p>
                <p className="text-sm text-muted-foreground mt-1">Submitted KYC applications will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            kycs.map((k) => (
              <Card key={k.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <UserIcon className="size-4" /> {k.cnicName || '—'}
                      </CardTitle>
                      <CardDescription>{k.user.email} • Submitted {k.submittedAt ? fmtDateTime(k.submittedAt) : '—'}</CardDescription>
                    </div>
                    <Badge variant="outline">Pending Review</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                    <div><p className="text-xs text-muted-foreground">Father/Husband</p><p className="font-medium">{k.fatherName || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">DOB</p><p className="font-medium">{k.dob || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{k.phoneNumber || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">City</p><p className="font-medium">{k.city || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Occupation</p><p className="font-medium">{k.occupation || '—'}</p></div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5 flex items-center gap-1"><FileImage className="size-3" /> Documents</p>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { label: 'CNIC Front', path: k.cnicFrontPath },
                        { label: 'CNIC Back', path: k.cnicBackPath },
                        { label: 'Selfie', path: k.selfiePath },
                      ].map((d) => (
                        <a
                          key={d.label}
                          href={d.path || '#'}
                          target="_blank"
                          rel="noreferrer"
                          className="block rounded-md border overflow-hidden hover:ring-2 ring-primary/40 transition"
                        >
                          {d.path ? (
                            <img src={d.path} alt={d.label} className="aspect-video w-full object-cover" />
                          ) : (
                            <div className="aspect-video grid place-items-center text-xs text-muted-foreground">Missing</div>
                          )}
                          <p className="text-xs text-center py-1 border-t bg-muted/30">{d.label}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => actKyc(k.id, 'approve')} disabled={acting === k.id}>
                      {acting === k.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => actKyc(k.id, 'reject')} disabled={acting === k.id}>
                      <X className="size-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        {/* Payment review */}
        <TabsContent value="payments" className="space-y-4 mt-4">
          {payments.length === 0 ? (
            <Card className="border-dashed">
              <CardContent className="py-12 text-center">
                <Inbox className="size-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">No pending payments</p>
                <p className="text-sm text-muted-foreground mt-1">Submitted payment proofs will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            payments.map((p) => (
              <Card key={p.id}>
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Banknote className="size-4" />
                        {p.type === 'processing_fee' ? 'Processing Fee' : `Installment #${p.installmentNumber}`}
                      </CardTitle>
                      <CardDescription>
                        {p.userName || p.userEmail} • {p.planName ? `${p.planName} plan • ` : ''}{fmtDateTime(p.createdAt)}
                      </CardDescription>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold">{fmtPKR(p.amount)}</p>
                      <Badge variant="outline">Pending</Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><p className="text-xs text-muted-foreground">Transaction Ref</p><p className="font-mono text-xs">{p.txnRef || '—'}</p></div>
                    <div><p className="text-xs text-muted-foreground">Type</p><p className="font-medium capitalize">{p.type.replace('_', ' ')}</p></div>
                  </div>
                  {p.proofPath && (
                    <a href={p.proofPath} target="_blank" rel="noreferrer" className="block rounded-md border overflow-hidden hover:ring-2 ring-primary/40 transition">
                      <img src={p.proofPath} alt="Payment proof" className="max-h-64 w-full object-contain bg-muted/30" />
                      <p className="text-xs text-center py-1.5 border-t bg-muted/30">Click to view full size</p>
                    </a>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button size="sm" onClick={() => actPayment(p.id, 'approve')} disabled={acting === p.id}>
                      {acting === p.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      Approve
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => actPayment(p.id, 'reject')} disabled={acting === p.id}>
                      <X className="size-4" /> Reject
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
