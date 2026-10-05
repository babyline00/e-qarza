'use client'

import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { fmtPKR, fmtDateTime } from '@/lib/format'
import { Clock, RefreshCw, Banknote, Receipt, CheckCircle2 } from 'lucide-react'

interface Props {
  onRefresh: () => void
}

export function FeePendingView({ onRefresh }: Props) {
  const { applications } = useAppStore()
  const app = applications[0]

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="Payment Under Verification" description="We received your proof — hang tight." icon={Banknote} />
      <Card className="mt-6 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
          <div className="relative mx-auto mb-4 size-20">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-60" />
            <div className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground">
              <Clock className="size-9" />
            </div>
          </div>
          <h2 className="text-xl font-bold">Verifying your payment</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            An admin is confirming your processing fee payment. Your loan will activate automatically once approved.
          </p>
        </div>
        <CardContent className="pt-6 space-y-3">
          {app && (
            <div className="rounded-lg border p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium flex items-center gap-2"><Receipt className="size-4" /> {app.planName} plan</span>
                <Badge variant="secondary">Processing fee</Badge>
              </div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Amount</span><span className="font-semibold">{fmtPKR(app.processingFee)}</span></div>
              {app.feePayment && (
                <>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Reference</span><span className="font-mono text-xs">{app.feePayment.txnRef}</span></div>
                  <div className="flex justify-between text-sm"><span className="text-muted-foreground">Submitted</span><span className="text-xs">{fmtDateTime(app.feePayment.createdAt)}</span></div>
                </>
              )}
            </div>
          )}
          <div className="rounded-lg border border-dashed p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-primary" />
              <span className="font-medium">Proof submitted</span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">Awaiting admin verification.</p>
          </div>
          <Button variant="outline" className="w-full" onClick={onRefresh}>
            <RefreshCw className="size-4" /> Check status
          </Button>
          <p className="text-xs text-center text-muted-foreground pt-1">
            Tip: log in as <code className="font-mono">admin@loan.pk</code> to approve the payment.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
