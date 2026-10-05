'use client'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/page-header'
import { Clock, RefreshCw, ShieldCheck, CheckCircle2 } from 'lucide-react'

interface Props {
  onRefresh: () => void
}

export function KycPendingView({ onRefresh }: Props) {
  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <PageHeader title="KYC Under Review" description="Your application is being verified." icon={ShieldCheck} />
      <Card className="mt-6 overflow-hidden">
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-8 text-center">
          <div className="relative mx-auto mb-4 size-20">
            <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-60" />
            <div className="relative grid size-20 place-items-center rounded-full bg-primary text-primary-foreground">
              <Clock className="size-9" />
            </div>
          </div>
          <h2 className="text-xl font-bold">Verification in progress</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
            Our team is reviewing your CNIC and details. This usually takes a few minutes. You will be notified once approved.
          </p>
        </div>
        <CardContent className="pt-6 space-y-3">
          <div className="rounded-lg border p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="size-4 text-primary" />
              <span className="font-medium">Application submitted</span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              Your KYC details and documents were received successfully.
            </p>
          </div>
          <div className="rounded-lg border border-dashed p-4 space-y-2">
            <div className="flex items-center gap-2 text-sm">
              <Clock className="size-4 text-muted-foreground" />
              <span className="font-medium">Awaiting admin approval</span>
            </div>
            <p className="text-xs text-muted-foreground pl-6">
              An administrator will verify your documents. This page updates automatically.
            </p>
          </div>
          <Button variant="outline" className="w-full" onClick={onRefresh}>
            <RefreshCw className="size-4" /> Check again
          </Button>
          <p className="text-xs text-center text-muted-foreground pt-1">
            Tip: log in as <code className="font-mono">admin@loan.pk</code> in another tab to approve your KYC.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
