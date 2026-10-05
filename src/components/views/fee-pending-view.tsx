'use client'

import { useAppStore, type AppData } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fmtPKR, fmtDateTime } from '@/lib/format'
import { Hourglass, RefreshCw, Receipt } from 'lucide-react'
import {
  VerticalStepper,
  type TimelineStep,
} from '@/components/shared/vertical-stepper'
import { InfoBox } from '@/components/shared/info-box'

interface Props {
  onRefresh: () => void
}

interface FeePaymentInfo {
  txnRef: string
  status: string
  createdAt: string
}

type AppWithFee = AppData & { feePayment?: FeePaymentInfo | null }

const STEPS: TimelineStep[] = [
  {
    title: 'Payment Submitted',
    description: 'Your proof was uploaded successfully.',
    status: 'completed',
  },
  {
    title: 'Verifying Transaction',
    description: 'Our team is reviewing your payment.',
    status: 'active',
  },
  {
    title: 'Updating Loan Account',
    description: 'Activating your loan and creating installments.',
    status: 'pending',
  },
  {
    title: 'Final Confirmation',
    description: 'You will be notified once verification is complete.',
    status: 'pending',
  },
]

export function FeePendingView({ onRefresh }: Props) {
  const { applications } = useAppStore()
  const app = applications[0] as AppWithFee | undefined

  return (
    <div className="mx-auto max-w-md px-4 py-8 space-y-5">
      {/* Hero icon + title */}
      <div className="flex flex-col items-center text-center pt-2">
        <span className="grid size-20 place-items-center rounded-full bg-primary/10 text-primary border-2 border-primary mb-4">
          <Hourglass className="size-9" />
        </span>
        <h1 className="text-xl font-bold">Payment Under Verification</h1>
        <p className="text-sm text-muted-foreground mt-1.5 max-w-xs">
          Your payment has been submitted successfully. We are verifying your payment.
          This may take a few minutes.
        </p>
      </div>

      {/* Vertical timeline */}
      <Card className="rounded-2xl">
        <CardContent className="p-5">
          <VerticalStepper steps={STEPS} />
        </CardContent>
      </Card>

      <InfoBox>We will notify you once your verification is complete.</InfoBox>

      {/* Submitted payment details */}
      {app && (
        <Card className="rounded-2xl">
          <CardContent className="p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium flex items-center gap-2">
                <Receipt className="size-4 text-primary" /> {app.planName} plan
              </span>
              <Badge variant="secondary">Processing fee</Badge>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Amount</span>
              <span className="font-semibold">{fmtPKR(app.processingFee)}</span>
            </div>
            {app.feePayment && (
              <>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Reference</span>
                  <span className="font-mono text-xs">{app.feePayment.txnRef}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Submitted</span>
                  <span className="text-xs">{fmtDateTime(app.feePayment.createdAt)}</span>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="w-full rounded-lg" onClick={onRefresh}>
        <RefreshCw className="size-4" /> Check Status
      </Button>
    </div>
  )
}
