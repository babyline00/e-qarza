'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader,DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fmtPKR, fmtDate, loanTotals } from '@/lib/format'
import type { AppData } from '@/lib/store'
import { Calculator, TrendingDown, CheckCircle2, Info } from 'lucide-react'

interface Props {
  application: AppData | null
  onClose: () => void
}

export function SettlementCalculator({ application, onClose }: Props) {
  const [confirmed, setConfirmed] = useState(false)

  if (!application) return null

  const installments = application.installments || []
  const paidInstallments = installments.filter((i) => i.status === 'paid')
  const remainingInstallments = installments.filter((i) => i.status !== 'paid')
  const totalPaid = paidInstallments.reduce((s, i) => s + i.amount, 0)
  const remainingPrincipal = remainingInstallments.reduce((s, i) => s + i.amount, 0)

  // Early settlement rebate: 50% of the interest portion on remaining installments
  // (industry-standard goodwill rebate for early payoff)
  const t = loanTotals(application.amount, application.interestRate, application.tenureMonths)
  const interestPerInstallment = t.monthlyInstallment > 0 ? t.totalInterest / application.tenureMonths : 0
  const remainingInterest = interestPerInstallment * remainingInstallments.length
  const rebate = Math.round(remainingInterest * 0.5)
  const settlementAmount = Math.max(0, remainingPrincipal - rebate)
  const savings = rebate

  function handlePrint() {
    document.body.classList.add('printing-settlement')
    window.print()
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-settlement')
    }, { once: true })
  }

  return (
    <Dialog open={!!application} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md print-settlement-area">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="size-5 text-primary" /> Early Settlement Calculator
          </DialogTitle>
          <DialogDescription>
            Pay off your remaining balance early and save on interest.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 settlement-body">
          {/* loan summary */}
          <div className="rounded-xl bg-muted/50 p-3.5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-muted-foreground">{application.planName} Plan</span>
              <Badge className="bg-success/15 text-success border-0">Active</Badge>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div><p className="text-muted-foreground">Total loan</p><p className="font-bold">{fmtPKR(application.amount)}</p></div>
              <div><p className="text-muted-foreground">Tenure</p><p className="font-bold">{application.tenureMonths} months</p></div>
              <div><p className="text-muted-foreground">Paid installments</p><p className="font-bold">{paidInstallments.length}/{installments.length}</p></div>
              <div><p className="text-muted-foreground">Already paid</p><p className="font-bold">{fmtPKR(totalPaid)}</p></div>
            </div>
          </div>

          {/* settlement breakdown */}
          <div className="rounded-xl border p-3.5 space-y-2.5">
            <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Settlement Breakdown</h4>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Remaining balance</span>
              <span className="font-medium">{fmtPKR(remainingPrincipal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground flex items-center gap-1">
                <TrendingDown className="size-3.5 text-success" /> Early-settlement rebate (50% interest)
              </span>
              <span className="font-medium text-success">−{fmtPKR(rebate)}</span>
            </div>
            <div className="border-t pt-2.5 flex justify-between items-center">
              <span className="text-sm font-bold">Amount to settle</span>
              <span className="text-2xl font-extrabold text-brand">{fmtPKR(settlementAmount)}</span>
            </div>
          </div>

          {/* savings callout */}
          {savings > 0 && (
            <div className="rounded-xl bg-success/10 border border-success/20 p-3.5 flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-full bg-success/20 text-success shrink-0">
                <CheckCircle2 className="size-5" />
              </span>
              <div>
                <p className="text-sm font-bold text-success">You save {fmtPKR(savings)}!</p>
                <p className="text-xs text-muted-foreground">By settling early instead of paying {fmtPKR(remainingPrincipal)} over {remainingInstallments.length} months.</p>
              </div>
            </div>
          )}

          {/* next steps */}
          <div className="flex items-start gap-2 rounded-lg bg-primary/5 p-3 text-xs text-muted-foreground">
            <Info className="size-4 shrink-0 mt-0.5 text-primary" />
            <p>To settle early, transfer <strong className="text-foreground">{fmtPKR(settlementAmount)}</strong> to the bank account on your payment screen, upload the receipt, and our team will close your loan.</p>
          </div>

          {confirmed && (
            <div className="rounded-lg bg-success/10 border border-success/30 p-3 text-center text-sm text-success font-medium">
              ✓ Settlement request noted. Please proceed with the payment.
            </div>
          )}
        </div>

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={onClose}>Close</Button>
          <Button variant="outline" onClick={handlePrint}>
            Print Quote
          </Button>
          <Button
            className="bg-brand-gradient text-white hover:opacity-90"
            onClick={() => setConfirmed(true)}
            disabled={confirmed}
          >
            {confirmed ? <><CheckCircle2 className="size-4" /> Noted</> : 'I want to settle'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
