'use client'

import { useEffect, useState, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
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
        <Button size="sm" variant="outline" onClick={load} disabled={loading} className="gap-2">
          <RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </PageHeader>

      <Tabs defaultValue="kyc" className="mt-6">
        <TabsList className="rounded-xl bg-muted p-1">
          <TabsTrigger
            value="kyc"
            className="gap-2 rounded-lg data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <ShieldCheck className="size-4" /> KYC
            {kycs.length > 0 && (
              <Badge className="ml-1 h-5 border-0 bg-primary text-primary-foreground text-[10px]">{kycs.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="gap-2 rounded-lg data-[state=active]:bg-brand-gradient data-[state=active]:text-white data-[state=active]:shadow-sm"
          >
            <Banknote className="size-4" /> Payments
            {payments.length > 0 && (
              <Badge className="ml-1 h-5 border-0 bg-primary text-primary-foreground text-[10px]">{payments.length}</Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* KYC review */}
        <TabsContent value="kyc" className="space-y-4 mt-4">
          {kycs.length === 0 ? (
            <Card className="rounded-2xl border-dashed">
              <CardContent className="py-12 text-center">
                <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Inbox className="size-7" />
                </span>
                <p className="font-semibold">No pending KYCs</p>
                <p className="mt-1 text-sm text-muted-foreground">Submitted KYC applications will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            kycs.map((k) => (
              <Card key={k.id} className="overflow-hidden rounded-2xl shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b bg-muted/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-white">
                      <UserIcon className="size-5" />
                    </span>
                    <div>
                      <p className="text-base font-bold">{k.cnicName || '—'}</p>
                      <p className="text-xs text-muted-foreground">{k.user.email} • Submitted {k.submittedAt ? fmtDateTime(k.submittedAt) : '—'}</p>
                    </div>
                  </div>
                  <Badge variant="outline" className="rounded-full border-amber-400/40 text-amber-700 bg-amber-50">Pending Review</Badge>
                </div>
                <CardContent className="space-y-4 p-5">
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {[
                      { l: 'Father / Husband', v: k.fatherName },
                      { l: 'DOB', v: k.dob },
                      { l: 'Phone', v: k.phoneNumber },
                      { l: 'City', v: k.city },
                      { l: 'Occupation', v: k.occupation },
                    ].map((r) => (
                      <div key={r.l} className="rounded-xl bg-muted/40 p-3">
                        <p className="text-xs text-muted-foreground">{r.l}</p>
                        <p className="mt-0.5 text-sm font-medium">{r.v || '—'}</p>
                      </div>
                    ))}
                  </div>
                  <div>
                    <p className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <FileImage className="size-3.5 text-primary" /> Documents
                    </p>
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
                          className="block overflow-hidden rounded-xl border transition hover:ring-2 hover:ring-primary/40"
                        >
                          {d.path ? (
                            <img src={d.path} alt={d.label} className="aspect-video w-full object-cover" />
                          ) : (
                            <div className="grid aspect-video place-items-center text-xs text-muted-foreground">Missing</div>
                          )}
                          <p className="border-t bg-muted/30 py-1 text-center text-xs">{d.label}</p>
                        </a>
                      ))}
                    </div>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => actKyc(k.id, 'approve')}
                      disabled={acting === k.id}
                      className="gap-1.5 rounded-lg bg-success text-success-foreground hover:bg-success/90"
                    >
                      {acting === k.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => actKyc(k.id, 'reject')}
                      disabled={acting === k.id}
                      className="gap-1.5 rounded-lg"
                    >
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
            <Card className="rounded-2xl border-dashed">
              <CardContent className="py-12 text-center">
                <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
                  <Inbox className="size-7" />
                </span>
                <p className="font-semibold">No pending payments</p>
                <p className="mt-1 text-sm text-muted-foreground">Submitted payment proofs will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            payments.map((p) => (
              <Card key={p.id} className="overflow-hidden rounded-2xl shadow-sm">
                <div className="flex flex-wrap items-start justify-between gap-2 border-b bg-muted/30 px-5 py-3">
                  <div className="flex items-center gap-3">
                    <span className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-white">
                      <Banknote className="size-5" />
                    </span>
                    <div>
                      <p className="text-base font-bold">
                        {p.type === 'processing_fee' ? 'Processing Fee' : `Installment #${p.installmentNumber}`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {p.userName || p.userEmail} • {p.planName ? `${p.planName} plan • ` : ''}{fmtDateTime(p.createdAt)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{fmtPKR(p.amount)}</p>
                    <Badge variant="outline" className="rounded-full border-amber-400/40 text-amber-700 bg-amber-50">Pending</Badge>
                  </div>
                </div>
                <CardContent className="space-y-3 p-5">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Transaction Ref</p>
                      <p className="mt-0.5 font-mono text-xs">{p.txnRef || '—'}</p>
                    </div>
                    <div className="rounded-xl bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="mt-0.5 text-sm font-medium capitalize">{p.type.replace('_', ' ')}</p>
                    </div>
                  </div>
                  {p.proofPath && (
                    <a
                      href={p.proofPath}
                      target="_blank"
                      rel="noreferrer"
                      className="block overflow-hidden rounded-xl border transition hover:ring-2 hover:ring-primary/40"
                    >
                      <img src={p.proofPath} alt="Payment proof" className="max-h-64 w-full object-contain bg-muted/30" />
                      <p className="border-t bg-muted/30 py-1.5 text-center text-xs">Click to view full size</p>
                    </a>
                  )}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      onClick={() => actPayment(p.id, 'approve')}
                      disabled={acting === p.id}
                      className="gap-1.5 rounded-lg bg-success text-success-foreground hover:bg-success/90"
                    >
                      {acting === p.id ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />}
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => actPayment(p.id, 'reject')}
                      disabled={acting === p.id}
                      className="gap-1.5 rounded-lg"
                    >
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
