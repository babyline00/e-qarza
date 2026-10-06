'use client'

import { useAppStore, type AppData } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { fmtPKR, fmtDateTime } from '@/lib/format'
import { Hourglass, RefreshCw, Receipt, ScanLine, CheckCircle2, ImageOff } from 'lucide-react'
import {
  VerticalStepper,
  type TimelineStep,
} from '@/components/shared/vertical-stepper'
import { InfoBox } from '@/components/shared/info-box'

interface Props {
  onRefresh: (force?: boolean) => void
}

interface FeePaymentInfo {
  txnRef: string
  status: string
  createdAt: string
  proofPath?: string | null
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
    status: 'completed',
  },
  {
    title: 'Updating Loan Account',
    description: 'Activating your loan and creating installments.',
    status: 'completed',
  },
  {
    title: 'Final Confirmation',
    description: 'You will be notified once verification is complete.',
    status: 'active',
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

      {/* Payment Proof Scanner */}
      {app?.feePayment?.proofPath ? (
        <Card className="overflow-hidden rounded-2xl">
          <CardContent className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold flex items-center gap-2">
                <ScanLine className="size-4 text-primary" /> Payment Proof
              </p>
              <span className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                <Hourglass className="size-3" /> VERIFYING
              </span>
            </div>

            {/* Scanner view */}
            <div className="relative overflow-hidden rounded-xl border-2 border-primary/30 bg-muted/30">
              {/* Scanner overlay */}
              <div className="pointer-events-none absolute inset-0 z-10">
                {/* Corner brackets */}
                <div className="absolute left-2 top-2 size-6 border-l-2 border-t-2 border-primary rounded-tl-lg" />
                <div className="absolute right-2 top-2 size-6 border-r-2 border-t-2 border-primary rounded-tr-lg" />
                <div className="absolute left-2 bottom-2 size-6 border-l-2 border-b-2 border-primary rounded-bl-lg" />
                <div className="absolute right-2 bottom-2 size-6 border-r-2 border-b-2 border-primary rounded-br-lg" />
                {/* Scan line animation */}
                <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/60 animate-[proofscan_2.2s_ease-in-out_infinite] shadow-[0_0_8px_rgba(249,115,22,0.6)]" />
              </div>
              {/* Proof image */}
              <img
                src={app.feePayment.proofPath}
                alt="Payment proof"
                className="aspect-[1.6/1] w-full object-contain bg-muted/40"
              />
              {/* Bottom info bar */}
              <div className="flex items-center justify-between bg-primary/10 px-3 py-2">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Receipt className="size-3.5 text-primary" />
                  <span>Receipt — Under review</span>
                </div>
                {app.feePayment.txnRef && (
                  <span className="font-mono text-[11px] text-muted-foreground truncate max-w-[50%]">
                    Ref: {app.feePayment.txnRef}
                  </span>
                )}
              </div>
            </div>

            <p className="mt-2 text-[11px] text-muted-foreground text-center">
              Our team is cross-checking this receipt with the bank record.
            </p>
          </CardContent>
        </Card>
      ) : app?.feePayment && (
        <Card className="rounded-2xl border-dashed">
          <CardContent className="p-4 flex items-center gap-3">
            <ImageOff className="size-5 text-muted-foreground shrink-0" />
            <p className="text-xs text-muted-foreground">
              No proof image was uploaded for this payment. Verification will proceed manually.
            </p>
          </CardContent>
        </Card>
      )}

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

      <Button variant="outline" className="w-full rounded-lg" onClick={() => onRefresh(true)}>
        <RefreshCw className="size-4" /> Check Status
      </Button>

      {/* Scan line animation */}
      <style>{`
        @keyframes proofscan {
          0%, 100% { top: 0; opacity: 0.85; }
          50% { top: calc(100% - 2px); opacity: 0.45; }
        }
      `}</style>
    </div>
  )
}
