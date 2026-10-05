'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { FileUpload } from '@/components/shared/file-upload'
import { fmtPKR, loanTotals } from '@/lib/format'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import {
  Copy,
  Loader2,
  Building2,
  ShieldCheck,
  Percent,
  Wallet,
} from 'lucide-react'

interface Props {
  onSubmitted: () => void
}

export function FeePaymentView({ onSubmitted }: Props) {
  const { applications, bankDetails } = useAppStore()
  const app = applications[0]
  const [txnRef, setTxnRef] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  if (!app) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Card className="rounded-2xl">
          <CardContent className="py-12 text-center text-muted-foreground">
            No active application.
          </CardContent>
        </Card>
      </div>
    )
  }

  function copy(text: string, label: string) {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied`)
  }

  async function submit() {
    if (!txnRef.trim()) return toast.error('Enter the transaction reference')
    if (!proof) return toast.error('Upload the payment proof screenshot')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('applicationId', app!.id)
      fd.append('txnRef', txnRef.trim())
      fd.append('proofImage', proof)
      const res = await fetch('/api/payments/proof', {
        method: 'POST',
        body: fd,
        credentials: 'same-origin',
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to submit')
      toast.success('Payment proof submitted for verification')
      onSubmitted()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  const totals = loanTotals(app.amount, app.interestRate, app.tenureMonths)
  const remaining = Math.max(0, totals.totalPayable - app.processingFee)

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      {/* Header */}
      <h1 className="text-xl font-bold tracking-tight">Initial Payment</h1>

      {/* Selected plan card */}
      <Card className="rounded-2xl">
        <CardContent className="flex items-center gap-3 p-4">
          <span className="grid size-12 place-items-center rounded-xl bg-brand-gradient text-white shrink-0">
            <Wallet className="size-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-lg font-bold leading-tight">{fmtPKR(app.amount)}</p>
            <p className="text-xs text-muted-foreground">{app.planName} Loan Plan</p>
          </div>
          <Badge className="bg-brand-gradient text-white border-transparent">Selected</Badge>
        </CardContent>
      </Card>

      {/* Payment breakdown */}
      <Card className="rounded-2xl overflow-hidden">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">First Payment (Paydown)</CardTitle>
          <CardDescription>Review your payment breakdown</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="divide-y">
            <Row label="Total Loan Amount" value={fmtPKR(app.amount)} />
            <Row
              label="First Payment (Processing Fee)"
              value={fmtPKR(app.processingFee)}
              highlight
            />
            <Row label="Remaining Amount" value={fmtPKR(remaining)} />
            <Row label="Tenure" value={`${app.tenureMonths} Months`} />
            <Row label="Monthly Installment" value={fmtPKR(totals.monthlyInstallment)} />
          </div>
        </CardContent>
      </Card>

      {/* 0% Markup promo */}
      <div className="flex items-center gap-3 rounded-2xl bg-primary/10 p-4">
        <span className="grid size-10 place-items-center rounded-full bg-primary/15 text-primary shrink-0">
          <Percent className="size-5" />
        </span>
        <div className="text-sm">
          <p className="font-bold text-foreground">0% Markup</p>
          <p className="text-xs text-muted-foreground">Only fixed installments. No hidden charges.</p>
        </div>
      </div>

      {/* Bank details */}
      <div className="space-y-2">
        <p className="px-1 text-sm font-semibold">Transfer the First Payment to:</p>
        {bankDetails.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="py-6 text-center text-sm text-muted-foreground">
              No bank details configured yet. Please contact support.
            </CardContent>
          </Card>
        )}
        {bankDetails.map((b) => (
          <Card key={b.id} className="rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="size-4 text-primary" /> {b.bankName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2.5">
              <DetailRow
                label="Account Title"
                value={b.accountTitle}
                onCopy={() => copy(b.accountTitle, 'Account title')}
              />
              <DetailRow
                label="Account Number"
                value={b.accountNumber}
                mono
                onCopy={() => copy(b.accountNumber, 'Account number')}
              />
              <DetailRow
                label="IBAN"
                value={b.iban}
                mono
                onCopy={() => copy(b.iban, 'IBAN')}
              />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Upload proof */}
      <Card className="rounded-2xl">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Upload Payment Proof</CardTitle>
          <CardDescription>
            After transferring, upload the receipt/screenshot and enter the reference.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="txnRef">Transaction Reference / TID</Label>
            <Input
              id="txnRef"
              value={txnRef}
              onChange={(e) => setTxnRef(e.target.value)}
              placeholder="e.g. FT2501011234567"
            />
          </div>

          <FileUpload
            label="Payment Proof"
            hint="Screenshot or receipt photo"
            onChange={setProof}
            value={proof}
            compact
          />

          <Button
            className="w-full rounded-lg bg-brand-gradient text-white shadow-md hover:opacity-95"
            onClick={submit}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <>
                <ShieldCheck className="size-4" /> Submit for Verification
              </>
            )}
          </Button>
          <p className="text-xs text-center text-muted-foreground">
            Your loan will be activated once an admin verifies the payment.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

function Row({
  label,
  value,
  highlight,
}: {
  label: string
  value: string
  highlight?: boolean
}) {
  return (
    <div
      className={`flex items-center justify-between px-6 py-3.5 ${
        highlight ? 'bg-primary/5' : ''
      }`}
    >
      <span
        className={`text-sm ${highlight ? 'font-medium text-foreground' : 'text-muted-foreground'}`}
      >
        {label}
      </span>
      <span
        className={
          highlight
            ? 'text-base font-bold text-primary'
            : 'text-sm font-semibold'
        }
      >
        {value}
      </span>
    </div>
  )
}

function DetailRow({
  label,
  value,
  mono,
  onCopy,
}: {
  label: string
  value: string
  mono?: boolean
  onCopy: () => void
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className={`font-medium text-sm ${mono ? 'font-mono' : ''} truncate`}>{value}</p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        className="size-8 shrink-0 p-0"
        onClick={onCopy}
        aria-label={`Copy ${label}`}
      >
        <Copy className="size-3.5" />
      </Button>
    </div>
  )
}
