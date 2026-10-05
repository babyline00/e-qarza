'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { PageHeader } from '@/components/shared/page-header'
import { FileUpload } from '@/components/shared/file-upload'
import { fmtPKR } from '@/lib/format'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { Banknote, Copy, Loader2, Info, Building2, Receipt, ShieldCheck } from 'lucide-react'

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
        <Card><CardContent className="py-12 text-center text-muted-foreground">No active application.</CardContent></Card>
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
      const res = await fetch('/api/payments/proof', { method: 'POST', body: fd, credentials: 'same-origin' })
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

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <PageHeader
        title="Pay Processing Fee"
        description="Transfer the processing fee to our bank and upload the receipt to activate your loan."
        icon={Banknote}
      />

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        {/* Bank details + fee summary */}
        <div className="space-y-4">
          <Card className="border-primary/30">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg"><Receipt className="size-5 text-primary" /> Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Plan</span><span className="font-medium">{app.planName}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Loan amount</span><span className="font-medium">{fmtPKR(app.amount)}</span></div>
              <div className="flex justify-between text-sm border-t pt-2 mt-1"><span className="font-medium">Processing fee due</span><span className="font-bold text-primary text-lg">{fmtPKR(app.processingFee)}</span></div>
            </CardContent>
          </Card>

          {bankDetails.map((b) => (
            <Card key={b.id}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg"><Building2 className="size-5 text-primary" /> {b.bankName}</CardTitle>
                <CardDescription>Transfer the exact fee amount to this account.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Title</p>
                    <p className="font-medium text-sm">{b.accountTitle}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copy(b.accountTitle, 'Account title')}><Copy className="size-3.5" /></Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">Account Number</p>
                    <p className="font-medium text-sm font-mono">{b.accountNumber}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copy(b.accountNumber, 'Account number')}><Copy className="size-3.5" /></Button>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-xs text-muted-foreground">IBAN</p>
                    <p className="font-medium text-sm font-mono truncate">{b.iban}</p>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => copy(b.iban, 'IBAN')}><Copy className="size-3.5" /></Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Upload proof */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Upload Payment Proof</CardTitle>
            <CardDescription>After transferring, upload the receipt/screenshot and enter the reference.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Info className="size-4" />
              <AlertTitle>Important</AlertTitle>
              <AlertDescription>
                Make sure the screenshot clearly shows the transaction amount, date, and reference number.
              </AlertDescription>
            </Alert>

            <div className="space-y-1.5">
              <Label htmlFor="txnRef">Transaction Reference / TID</Label>
              <Input id="txnRef" value={txnRef} onChange={(e) => setTxnRef(e.target.value)} placeholder="e.g. FT2501011234567" />
            </div>

            <FileUpload label="Payment Proof" hint="Screenshot or receipt photo" onChange={setProof} value={proof} />

            <Button className="w-full" onClick={submit} disabled={loading}>
              {loading ? <Loader2 className="size-4 animate-spin" /> : <><ShieldCheck className="size-4" /> Submit for Verification</>}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Your loan will be activated once an admin verifies the payment.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
