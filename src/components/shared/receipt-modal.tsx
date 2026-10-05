'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { api } from '@/lib/api-client'
import { fmtPKR, fmtDate } from '@/lib/format'
import { Logo } from '@/components/shared/logo'
import { Printer, X, CheckCircle2, Loader2 } from 'lucide-react'

interface ReceiptData {
  id: string
  type: string
  amount: number
  status: string
  txnRef: string | null
  proofPath: string | null
  createdAt: string
  reviewedAt: string | null
  user: { name: string | null; email: string; phone: string | null }
  application: {
    planName: string
    amount: number
    interestRate: number
    tenureMonths: number
  } | null
  installmentNumber: number | null
}

interface Props {
  paymentId: string | null
  onClose: () => void
}

// Inner component — uses key={paymentId} from parent so it remounts per receipt,
// allowing lazy initial state (no setState-in-effect needed for the synchronous part).
function ReceiptContent({ paymentId }: { paymentId: string }) {
  const [state, setState] = useState<{ data: ReceiptData | null; error: string | null; loading: boolean }>(() => ({
    data: null,
    error: null,
    loading: true,
  }))

  useEffect(() => {
    let cancelled = false
    api<{ payment: ReceiptData }>(`/api/payments/receipt?id=${paymentId}`)
      .then((r) => {
        if (!cancelled) setState({ data: r.payment, error: null, loading: false })
      })
      .catch((e) => {
        if (!cancelled) setState({ data: null, error: (e as Error).message, loading: false })
      })
    return () => {
      cancelled = true
    }
  }, [paymentId])

  if (state.loading) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm">Loading receipt…</span>
      </div>
    )
  }
  if (state.error || !state.data) {
    return <div className="py-8 text-center text-sm text-destructive">{state.error || 'Not found'}</div>
  }
  const data = state.data
  return (
    <div className="receipt-body rounded-xl border bg-white">
      <div className="flex items-center justify-between border-b border-dashed pb-3">
        <Logo variant="full" />
        <div className="text-right text-[10px] text-muted-foreground">
          <p>E-Qarza Pvt Ltd</p>
          <p>Karachi, Pakistan</p>
        </div>
      </div>
      <div className="px-1 pt-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">
            {data.type === 'processing_fee' ? 'Processing Fee Receipt' : `Installment #${data.installmentNumber} Receipt`}
          </h3>
          <Badge className="bg-success text-success-foreground border-0 hover:bg-success">PAID</Badge>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-y-2 gap-x-3 text-xs">
          <div><span className="text-muted-foreground">Receipt #</span><br /><span className="font-mono font-medium">{data.id.slice(-8).toUpperCase()}</span></div>
          <div><span className="text-muted-foreground">Date</span><br /><span className="font-medium">{fmtDate(data.reviewedAt || data.createdAt)}</span></div>
          <div><span className="text-muted-foreground">Paid by</span><br /><span className="font-medium">{data.user.name || data.user.email}</span></div>
          <div><span className="text-muted-foreground">Txn Ref</span><br /><span className="font-mono font-medium">{data.txnRef || '—'}</span></div>
        </div>
        {data.application && (
          <div className="mt-3 rounded-lg bg-muted/50 p-2.5 text-xs">
            <div className="flex justify-between"><span className="text-muted-foreground">Loan plan</span><span className="font-medium">{data.application.planName}</span></div>
            <div className="flex justify-between mt-1"><span className="text-muted-foreground">Loan amount</span><span className="font-medium">{fmtPKR(data.application.amount)}</span></div>
            <div className="flex justify-between mt-1"><span className="text-muted-foreground">Tenure</span><span className="font-medium">{data.application.tenureMonths} months</span></div>
          </div>
        )}
        <div className="mt-3 flex items-center justify-between border-t pt-3">
          <span className="text-xs font-semibold uppercase text-muted-foreground">Amount Paid</span>
          <span className="text-xl font-extrabold text-brand">{fmtPKR(data.amount)}</span>
        </div>
      </div>
      <div className="mt-3 border-t border-dashed pt-2 text-center text-[9px] text-muted-foreground">
        This is a computer-generated receipt. For support, contact help@e-qarza.pk
      </div>
    </div>
  )
}

export function ReceiptModal({ paymentId, onClose }: Props) {
  function handlePrint() {
    document.body.classList.add('printing-receipt')
    window.print()
    window.addEventListener(
      'afterprint',
      () => {
        document.body.classList.remove('printing-receipt')
      },
      { once: true }
    )
  }

  return (
    <Dialog open={!!paymentId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md print-receipt-area">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle2 className="size-5 text-success" /> Payment Receipt
          </DialogTitle>
          <DialogDescription>Download or print this receipt for your records.</DialogDescription>
        </DialogHeader>

        {paymentId && <ReceiptContent key={paymentId} paymentId={paymentId} />}

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={onClose}>
            <X className="size-4" /> Close
          </Button>
          <Button onClick={handlePrint} className="bg-brand-gradient text-white hover:opacity-90">
            <Printer className="size-4" /> Print / Save PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

