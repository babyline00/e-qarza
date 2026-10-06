'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { VerticalStepper, type TimelineStep } from '@/components/shared/vertical-stepper'
import { InfoBox } from '@/components/shared/info-box'
import { api } from '@/lib/api-client'
import { Clock, RefreshCw, ScanLine, IdCard, CheckCircle2, ShieldCheck } from 'lucide-react'

interface Props {
  onRefresh: (force?: boolean) => void
}

interface KycData {
  cnicName?: string | null
  cnicNumber?: string | null
  cnicFrontPath?: string | null
  cnicBackPath?: string | null
  selfiePath?: string | null
  status?: string
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
    status: 'completed',
  },
  {
    title: 'Identity Check',
    description: 'Cross-checking your details against provided records.',
    status: 'completed',
  },
  {
    title: 'Final Approval',
    description: 'You will be notified once your account is approved.',
    status: 'active',
  },
]

export function KycPendingView({ onRefresh }: Props) {
  const [kyc, setKyc] = useState<KycData | null>(null)

  useEffect(() => {
    // Fetch KYC data from /api/me to show CNIC front image with scanner
    api<{ kyc: KycData | null }>('/api/me')
      .then((r) => setKyc(r.kyc))
      .catch(() => {})
  }, [])

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

          {/* CNIC Card Scanner View */}
          {kyc?.cnicFrontPath && (
            <div className="mt-6">
              <div className="relative overflow-hidden rounded-2xl border-2 border-primary/30 bg-muted/30">
                {/* Scanner overlay */}
                <div className="pointer-events-none absolute inset-0 z-10">
                  {/* Corner brackets */}
                  <div className="absolute left-2 top-2 size-6 border-l-2 border-t-2 border-primary rounded-tl-lg" />
                  <div className="absolute right-2 top-2 size-6 border-r-2 border-t-2 border-primary rounded-tr-lg" />
                  <div className="absolute left-2 bottom-2 size-6 border-l-2 border-b-2 border-primary rounded-bl-lg" />
                  <div className="absolute right-2 bottom-2 size-6 border-r-2 border-b-2 border-primary rounded-br-lg" />
                  {/* Scan line animation */}
                  <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/60 animate-[scanline_2s_ease-in-out_infinite]" />
                  {/* Verified badge */}
                  <div className="absolute right-3 top-3 flex items-center gap-1 rounded-full bg-success/90 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                    <CheckCircle2 className="size-3" /> SCANNED
                  </div>
                </div>
                {/* CNIC image */}
                <img
                  src={kyc.cnicFrontPath}
                  alt="CNIC Front"
                  className="aspect-[1.6/1] w-full object-cover"
                />
                {/* Bottom info bar */}
                <div className="flex items-center justify-between bg-primary/10 px-3 py-2">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <ScanLine className="size-3.5 text-primary" />
                    <span>CNIC Front — Scanned</span>
                  </div>
                  {kyc.cnicNumber && (
                    <span className="font-mono text-[11px] text-muted-foreground">
                      {kyc.cnicNumber.replace(/(\d{5})(\d{7})(\d{1})/, '$1-$2-$3')}
                    </span>
                  )}
                </div>
              </div>

              {/* CNIC details summary */}
              <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                {kyc.cnicName && (
                  <div className="rounded-lg border bg-card p-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><IdCard className="size-2.5" /> Name</p>
                    <p className="font-medium truncate">{kyc.cnicName}</p>
                  </div>
                )}
                {kyc.selfiePath && (
                  <div className="rounded-lg border bg-card p-2">
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1"><ShieldCheck className="size-2.5" /> Selfie</p>
                    <div className="mt-1 flex items-center gap-1.5">
                      <img src={kyc.selfiePath} alt="Selfie" className="size-8 rounded-full object-cover border" />
                      <span className="text-[10px] text-success font-medium">Captured</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

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
            onClick={() => onRefresh(true)}
          >
            <RefreshCw className="size-4" /> Check Status
          </Button>
        </CardContent>
      </Card>

      {/* Scan line animation */}
      <style>{`
        @keyframes scanline {
          0%, 100% { top: 0; opacity: 0.8; }
          50% { top: calc(100% - 2px); opacity: 0.4; }
        }
      `}</style>
    </div>
  )
}
