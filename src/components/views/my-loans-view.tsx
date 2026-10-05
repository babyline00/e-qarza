'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { PageHeader } from '@/components/shared/page-header'
import { InstallmentPaymentDialog } from '@/components/shared/installment-payment-dialog'
import { ReceiptModal } from '@/components/shared/receipt-modal'
import { fmtPKR, fmtDate, loanTotals, fmtDateTime } from '@/lib/format'
import { CreditCard, CheckCircle2, Clock, CalendarClock, Receipt, AlertCircle, Wallet, Download } from 'lucide-react'

interface Props {
  onRefresh?: () => void
}

export function MyLoansView({ onRefresh }: Props) {
  const { applications } = useAppStore()
  const [payInstallment, setPayInstallment] = useState<{ id: string; number: number; dueDate: string; amount: number; status: string } | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)

  if (applications.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8">
        <PageHeader title="My Loans" description="Your loan applications and repayment history." icon={CreditCard} />
        <Card className="mt-6 rounded-2xl border-dashed">
          <CardContent className="py-12 text-center">
            <span className="mx-auto mb-3 grid size-14 place-items-center rounded-2xl bg-primary/10 text-primary">
              <CreditCard className="size-7" />
            </span>
            <p className="font-semibold">No loans yet</p>
            <p className="mt-1 text-sm text-muted-foreground">Your loan applications will appear here.</p>
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
          const summary = [
            { label: 'Loan', value: fmtPKR(app.amount) },
            { label: 'Monthly', value: fmtPKR(t.monthlyInstallment) },
            { label: 'Total payable', value: fmtPKR(t.totalPayable) },
            { label: 'Processing fee', value: fmtPKR(app.processingFee) },
          ]
          return (
            <Card key={app.id} className="overflow-hidden rounded-2xl shadow-sm">
              {/* Header */}
              <div className="flex flex-wrap items-start justify-between gap-2 border-b px-5 py-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-brand-gradient text-white">
                    <Wallet className="size-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold">{app.planName} Plan</h3>
                    <p className="text-xs text-muted-foreground">Applied {fmtDate(app.appliedAt)}</p>
                  </div>
                </div>
                <StatusBadge status={app.status} />
              </div>

              <CardContent className="space-y-4 p-5">
                {/* summary grid */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {summary.map((s) => (
                    <div key={s.label} className="rounded-xl bg-muted/40 p-3">
                      <p className="text-xs text-muted-foreground">{s.label}</p>
                      <p className="mt-0.5 text-sm font-bold">{s.value}</p>
                    </div>
                  ))}
                </div>

                {app.status === 'rejected' && app.rejectReason && (
                  <div className="flex items-start gap-2 rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 size-4 shrink-0" />
                    <div>
                      <strong>Rejected:</strong> {app.rejectReason}
                    </div>
                  </div>
                )}

                {/* fee payment status */}
                {app.feePayment && (
                  <div className="rounded-xl border p-3">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="flex items-center gap-2 text-sm font-medium">
                        <Receipt className="size-4 text-primary" /> Processing Fee
                      </span>
                      <Badge variant={app.feePayment.status === 'approved' ? 'default' : app.feePayment.status === 'rejected' ? 'destructive' : 'outline'}>
                        {app.feePayment.status}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">Ref: {app.feePayment.txnRef} • {fmtDateTime(app.feePayment.createdAt)}</div>
                  </div>
                )}

                {/* progress + schedule for active/completed loans */}
                {(app.status === 'active' || app.status === 'completed') && installments.length > 0 && (
                  <>
                    <div>
                      <div className="mb-1.5 flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{paidCount}/{installments.length} paid • {fmtPKR(totalPaid)}</span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-success transition-all"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                    </div>
                    <Separator />
                    <div>
                      <p className="mb-2 flex items-center gap-2 text-sm font-medium">
                        <CalendarClock className="size-4 text-primary" /> Installments
                      </p>
                      <div className="space-y-2">
                        {installments.map((i) => {
                          const circleClass =
                            i.status === 'paid' ? 'bg-success/10 text-success' :
                            i.status === 'verifying' ? 'bg-amber-100 text-amber-700' :
                            i.status === 'overdue' ? 'bg-destructive/10 text-destructive' : 'bg-muted text-muted-foreground'
                          const Icon = i.status === 'paid' ? CheckCircle2 : i.status === 'verifying' ? Clock : null
                          return (
                            <div key={i.id} className="flex items-center justify-between rounded-xl border p-2.5 gap-2">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <span className={`grid size-9 shrink-0 place-items-center rounded-full text-xs font-semibold ${circleClass}`}>
                                  {Icon ? <Icon className="size-4" /> : i.number}
                                </span>
                                <div className="min-w-0 leading-tight">
                                  <p className="text-sm font-medium">Installment #{i.number}</p>
                                  <p className="text-xs text-muted-foreground">
                                    Due {fmtDate(i.dueDate)}{i.paidAt && ` • Paid ${fmtDate(i.paidAt)}`}
                                  </p>
                                </div>
                              </div>
                              <div className="flex shrink-0 items-center gap-2">
                                <span className="text-sm font-semibold">{fmtPKR(i.amount)}</span>
                                {(i.status === 'pending' || i.status === 'overdue') && (
                                  <Button size="sm" variant="outline" onClick={() => setPayInstallment(i)}>Pay</Button>
                                )}
                                {i.status === 'verifying' && (
                                  <Badge variant="outline" className="gap-1"><Clock className="size-3" /> Verifying</Badge>
                                )}
                                {i.status === 'paid' && (
                                  <>
                                    <Badge className="gap-1 bg-success text-success-foreground border-0 hover:bg-success"><CheckCircle2 className="size-3" /> Paid</Badge>
                                    {i.paymentId && (
                                      <Button size="sm" variant="ghost" className="h-7 gap-1 text-primary" onClick={() => setReceiptId(i.paymentId!)}>
                                        <Download className="size-3.5" /> Receipt
                                      </Button>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                          )
                        })}
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
      <ReceiptModal paymentId={receiptId} onClose={() => setReceiptId(null)} />
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    fee_pending: { label: 'Fee Due', cls: 'border-primary/30 text-primary bg-primary/5' },
    fee_submitted: { label: 'Fee Verifying', cls: 'border-amber-300/40 text-amber-700 bg-amber-50' },
    fee_approved: { label: 'Fee Approved', cls: 'bg-muted text-muted-foreground' },
    fee_rejected: { label: 'Fee Rejected', cls: 'bg-destructive text-destructive-foreground' },
    active: { label: 'Active', cls: 'bg-success text-success-foreground' },
    completed: { label: 'Completed', cls: 'bg-muted text-muted-foreground' },
    rejected: { label: 'Rejected', cls: 'bg-destructive text-destructive-foreground' },
  }
  const m = map[status] || { label: status, cls: 'bg-muted text-muted-foreground' }
  return <Badge className={`rounded-full border-0 ${m.cls}`}>{m.label}</Badge>
}
