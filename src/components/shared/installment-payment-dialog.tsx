'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { FileUpload } from '@/components/shared/file-upload'
import { fmtPKR, fmtDate } from '@/lib/format'
import { Loader2, CreditCard } from 'lucide-react'
import { toast } from 'sonner'

interface Installment {
  id: string
  number: number
  dueDate: string
  amount: number
  status: string
}

interface Props {
  installment: Installment | null
  bankHint?: string
  onClose: () => void
  onPaid: () => void
}

export function InstallmentPaymentDialog({ installment, onClose, onPaid }: Props) {
  const [txnRef, setTxnRef] = useState('')
  const [proof, setProof] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  async function submit() {
    if (!installment) return
    if (!txnRef.trim()) return toast.error('Enter the transaction reference')
    if (!proof) return toast.error('Upload the payment proof')
    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('installmentId', installment.id)
      fd.append('txnRef', txnRef.trim())
      fd.append('proofImage', proof)
      const res = await fetch('/api/payments/installment', { method: 'POST', body: fd, credentials: 'same-origin' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'Failed to submit')
      toast.success(`Installment #${installment.number} proof submitted`)
      setTxnRef('')
      setProof(null)
      onPaid()
      onClose()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={!!installment} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><CreditCard className="size-5" /> Pay Installment #{installment?.number}</DialogTitle>
          <DialogDescription>
            Due {installment && fmtDate(installment.dueDate)} • Amount{' '}
            <span className="font-semibold text-foreground">{installment && fmtPKR(installment.amount)}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="rounded-md bg-muted/50 p-3 text-xs text-muted-foreground">
            Transfer the exact amount to the bank account shown on your processing-fee screen, then upload the receipt below.
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ins-txn">Transaction Reference / TID</Label>
            <Input id="ins-txn" value={txnRef} onChange={(e) => setTxnRef(e.target.value)} placeholder="e.g. FT2501011234567" />
          </div>
          <FileUpload label="Payment Proof" hint="Screenshot or receipt" onChange={setProof} value={proof} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : 'Submit Proof'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
