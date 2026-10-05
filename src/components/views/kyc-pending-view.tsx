'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VerticalStepper, type TimelineStep } from '@/components/shared/vertical-stepper'
import { InfoBox } from '@/components/shared/info-box'
import { Clock, RefreshCw } from 'lucide-react'

interface Props {
  onRefresh: () => void
}

const TIMELINE: TimelineStep[] = [
  {
    title: 'Information Submitted',
    description: 'Your KYC details and documents were received successfully.',
    status: 'completed',
  },
  {
    title: 'Document Verification',
    description: 'Our team is reviewing your CNIC and selfie for clarity and authenticity.',
    status: 'active',
  },
  {
    title: 'Identity Check',
    description: 'Cross-checking your details against provided records.',
    status: 'pending',
  },
  {
    title: 'Final Approval',
    description: 'You will be notified once your account is approved.',
    status: 'pending',
  },
]

export function KycPendingView({ onRefresh }: Props) {
  return (
    <div className="mx-auto max-w-md px-4 py-8">
      <Card className="overflow-hidden rounded-2xl border-none shadow-lg shadow-primary/5">
        <CardContent className="p-6 sm:p-8">
          {/* Icon */}
          <div className="flex flex-col items-center text-center">
            <div className="grid size-20 place-items-center rounded-full bg-primary/10 text-primary border-2 border-primary">
              <Clock className="size-9" />
            </div>
            <h2 className="mt-4 text-xl font-bold tracking-tight text-foreground">KYC Under Review</h2>
            <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
              Your information has been submitted successfully. We are verifying your details. This usually takes a few minutes to a few hours.
            </p>
          </div>

          {/* Timeline */}
          <div className="mt-6 rounded-xl border bg-card p-4">
            <VerticalStepper steps={TIMELINE} />
          </div>

          {/* Info box */}
          <div className="mt-4">
            <InfoBox>We will notify you once your verification is complete.</InfoBox>
          </div>

          {/* Action */}
          <Button
            variant="outline"
            className="mt-5 w-full rounded-lg"
            onClick={onRefresh}
          >
            <RefreshCw className="size-4" /> Check Status
          </Button>

          <p className="mt-4 text-center text-xs text-muted-foreground">
            Tip: log in as <code className="font-mono">admin@loan.pk</code> in another tab to approve your KYC.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
