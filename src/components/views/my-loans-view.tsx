'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/page-header'
import { InstallmentPaymentDialog } from '@/components/shared/installment-payment-dialog'
import { fmtPKR, fmtDate, loanTotals, fmtDateTime } from '@/lib/format'
import { CreditCard, CheckCircle2, Clock, CalendarClock, Receipt } from 'lucide-react'

interface Props {
  onRefresh?: () => void
}

export function MyLoansView({ onRefresh }: Props) {
  const { applications } = useAppStore()
  const [payInstallment, setPayInstallment] = useState<{ id: string; number: number; dueDate: string; amount: number; status: string } | null>(null)

  if (applications.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PageHeader title="My Loans" description="Your loan applications and repayment history." icon={CreditCard} />
        <Card className="mt-6 border-dashed">
          <CardContent className="py-12 text-center">
            <CreditCard className="size-10 text-muted-foreground mx-auto mb-3" />
            <p className="font-medium">No loans yet</p>
            <p className="text-sm text-muted-foreground mt-1">Your loan applications will appear here.</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <PageHeader title="My Loans" description="Track all your applications and repayments." icon={CreditCard} />
      <div className="mt-6 space-y-4">
        {applications.map((app) => {
          const t = loanTotals(app.amount, app.interestRate, app.tenureMonths)
          const installments = app.installments || []
          const paidCount = installments.filter((i) => i.status === 'paid').length
          const progress = installments.length ? Math.round((paidCount / installments.length) * 100) : 0
          const totalPaid = installments.filter((i) => i.status === 'paid').reduce((s, i) => s + i.amount, 0)
          return (
            <Card key={app.id}>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <CardTitle className="text-lg flex items-center gap-2">{app.planName} Plan</CardTitle>
                    <CardDescription>Applied {fmtDate(app.appliedAt)}</CardDescription>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* summary grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                  <div><p className="text-xs text-muted-foreground">Loan</p><p className="font-semibold">{fmtPKR(app.amount)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Monthly</p><p className="font-semibold">{fmtPKR(t.monthlyInstallment)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Total payable</p><p className="font-semibold">{fmtPKR(t.totalPayable)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Processing fee</p><p className="font-semibold">{fmtPKR(app.processingFee)}</p></div>
                </div>

                {app.status === 'rejected' && app.rejectReason && (
                  <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                    <strong>Rejected:</strong> {app.rejectReason}
                  </div>
                )}

                {/* fee payment status */}
                {app.feePayment && (
                  <div className="rounded-md border p-3 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium flex items-center gap-2"><Receipt className="size-4" /> Processing Fee</span>
                      <Badge variant={app.feePayment.status === 'approved' ? 'default' : app.feePayment.status === 'rejected' ? 'destructive' : 'outline'}>
                        {app.feePayment.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Ref: {app.feePayment.txnRef} • {fmtDateTime(app.feePayment.createdAt)}</div>
                  </div>
                )}

                {/* progress + schedule for active loans */}
                {(app.status === 'active' || app.status === 'completed') && installments.length > 0 && (
                  <>
                    <div>
                      <div className="flex justify-between text-sm mb-1.5">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{paidCount}/{installments.length} paid • {fmtPKR(totalPaid)}</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                    <Separator />
                    <div className="space-y-2">
                      <p className="text-sm font-medium flex items-center gap-2"><CalendarClock className="size-4" /> Installments</p>
                      <div className="space-y-1.5">
                        {installments.map((i) => (
                          <div key={i.id} className="flex items-center justify-between rounded-md border p-2.5 gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className={`grid size-8 place-items-center rounded-full text-xs font-semibold shrink-0 ${
                                i.status === 'paid' ? 'bg-primary/10 text-primary' :
                                i.status === 'verifying' ? 'bg-amber-100 text-amber-700' :
                                i.status === 'overdue' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                              }`}>
                                {i.status === 'paid' ? <CheckCircle2 className="size-4" /> : i.status === 'verifying' ? <Clock className="size-4" /> : i.number}
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-medium">Installment #{i.number}</p>
                                <p className="text-xs text-muted-foreground">Due {fmtDate(i.dueDate)}{i.paidAt && ` • Paid ${fmtDate(i.paidAt)}`}</p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              <span className="text-sm font-semibold">{fmtPKR(i.amount)}</span>
                              {(i.status === 'pending' || i.status === 'overdue') && (
                                <Button size="sm" variant="outline" onClick={() => setPayInstallment(i)}>Pay</Button>
                              )}
                              {i.status === 'verifying' && <Badge variant="outline" className="gap-1"><Clock className="size-3" /> Verifying</Badge>}
                              {i.status === 'paid' && <Badge variant="secondary" className="gap-1"><CheckCircle2 className="size-3" /> Paid</Badge>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      <InstallmentPaymentDialog
        installment={payInstallment}
        onClose={() => setPayInstallment(null)}
        onPaid={() => onRefresh?.()}
      />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    fee_pending: { label: 'Fee Due', variant: 'outline' },
    fee_submitted: { label: 'Fee Verifying', variant: 'outline' },
    fee_approved: { label: 'Fee Approved', variant: 'secondary' },
    fee_rejected: { label: 'Fee Rejected', variant: 'destructive' },
    active: { label: 'Active', variant: 'default' },
    completed: { label: 'Completed', variant: 'secondary' },
    rejected: { label: 'Rejected', variant: 'destructive' },
  }
  const m = map[status] || { label: status, variant: 'secondary' as const }
  return <Badge variant={m.variant}>{m.label}</Badge>
}
