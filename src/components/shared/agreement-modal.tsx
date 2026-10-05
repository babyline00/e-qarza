'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { api } from '@/lib/api-client'
import { fmtPKR, fmtDate } from '@/lib/format'
import { Logo } from '@/components/shared/logo'
import { FileText, Printer, X, Loader2 } from 'lucide-react'

interface AgreementData {
  agreementNo: string
  activatedAt: string
  lender: { name: string; address: string; email: string }
  borrower: {
    name: string; fatherName: string; cnicDob: string; phone: string; address: string; city: string; email: string
  }
  loan: {
    planName: string; principal: number; interestRate: number; tenureMonths: number
    processingFee: number; totalInterest: number; totalPayable: number; monthlyInstallment: number; status: string
  }
  schedule: { number: number; dueDate: string; amount: number; status: string }[]
}

interface Props {
  applicationId: string | null
  onClose: () => void
}

function AgreementBody({ data }: { data: AgreementData }) {
  return (
    <div className="agreement-body rounded-xl border bg-white text-sm">
      {/* Letterhead */}
      <div className="flex items-center justify-between border-b pb-3">
        <Logo variant="full" />
        <div className="text-right text-[10px] text-muted-foreground">
          <p className="font-semibold text-foreground">{data.lender.name}</p>
          <p>{data.lender.address}</p>
          <p>{data.lender.email}</p>
        </div>
      </div>

      {/* Title */}
      <div className="py-3 text-center">
        <h2 className="text-base font-bold uppercase tracking-wide">Loan Agreement</h2>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          Agreement No: <span className="font-mono font-medium">{data.agreementNo}</span> • Date: {fmtDate(data.activatedAt)}
        </p>
      </div>

      {/* Parties */}
      <div className="space-y-2 text-xs">
        <p>
          This Loan Agreement (“Agreement”) is made on <strong>{fmtDate(data.activatedAt)}</strong> between{' '}
          <strong>{data.lender.name}</strong> (the “Lender”) and the Borrower described below.
        </p>
        <div className="grid gap-2 sm:grid-cols-2 rounded-lg bg-muted/40 p-2.5">
          <div>
            <p className="font-semibold text-[10px] uppercase text-muted-foreground mb-1">Borrower</p>
            <p>Name: <strong>{data.borrower.name}</strong></p>
            <p>Father/Husband: {data.borrower.fatherName}</p>
            <p>DOB: {data.borrower.cnicDob}</p>
            <p>Phone: {data.borrower.phone}</p>
            <p>Address: {data.borrower.address}, {data.borrower.city}</p>
            <p>Email: {data.borrower.email}</p>
          </div>
          <div>
            <p className="font-semibold text-[10px] uppercase text-muted-foreground mb-1">Loan Terms</p>
            <p>Plan: <strong>{data.loan.planName}</strong></p>
            <p>Principal: <strong>{fmtPKR(data.loan.principal)}</strong></p>
            <p>Interest rate: {data.loan.interestRate}% p.a.</p>
            <p>Tenure: {data.loan.tenureMonths} months</p>
            <p>Processing fee: {fmtPKR(data.loan.processingFee)}</p>
          </div>
        </div>
      </div>

      <Separator className="my-3" />

      {/* Terms */}
      <div className="space-y-1.5 text-[11px] leading-relaxed">
        <p><strong>1. Loan Amount.</strong> The Lender agrees to lend the Borrower the principal sum of <strong>{fmtPKR(data.loan.principal)}</strong>, payable after deduction of the processing fee of {fmtPKR(data.loan.processingFee)}.</p>
        <p><strong>2. Repayment.</strong> The Borrower shall repay the loan in {data.loan.tenureMonths} equal monthly installments of <strong>{fmtPKR(data.loan.monthlyInstallment)}</strong> each, commencing one month from the activation date. Total payable (principal + interest) is <strong>{fmtPKR(data.loan.totalPayable)}</strong> including interest of {fmtPKR(data.loan.totalInterest)}.</p>
        <p><strong>3. Interest.</strong> Interest is charged at {data.loan.interestRate}% per annum on a flat basis, calculated over the full tenure.</p>
        <p><strong>4. Late Payment.</strong> Installments not paid by their due date shall be marked as overdue and may affect the Borrower’s credit standing.</p>
        <p><strong>5. Early Settlement.</strong> The Borrower may settle the outstanding balance early and receive a 50% rebate on the remaining interest portion.</p>
        <p><strong>6. Default.</strong> In case of default, the Lender reserves the right to suspend the account and pursue recovery as permitted by law.</p>
        <p><strong>7. Governing Law.</strong> This Agreement is governed by the laws of the Islamic Republic of Pakistan.</p>
      </div>

      <Separator className="my-3" />

      {/* Schedule */}
      <div>
        <p className="font-semibold text-[10px] uppercase text-muted-foreground mb-1.5">Repayment Schedule</p>
        <table className="w-full text-[10px]">
          <thead>
            <tr className="border-b text-left text-muted-foreground">
              <th className="py-1 font-medium">#</th>
              <th className="py-1 font-medium">Due Date</th>
              <th className="py-1 font-medium text-right">Amount</th>
              <th className="py-1 font-medium text-right">Status</th>
            </tr>
          </thead>
          <tbody>
            {data.schedule.map((s) => (
              <tr key={s.number} className="border-b last:border-0">
                <td className="py-1">{s.number}</td>
                <td className="py-1">{fmtDate(s.dueDate)}</td>
                <td className="py-1 text-right font-medium">{fmtPKR(s.amount)}</td>
                <td className="py-1 text-right capitalize">{s.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Signatures */}
      <div className="mt-5 grid grid-cols-2 gap-6 text-[10px]">
        <div>
          <div className="border-t border-dashed pt-1">Borrower Signature</div>
          <p className="mt-0.5 text-muted-foreground">{data.borrower.name}</p>
        </div>
        <div>
          <div className="border-t border-dashed pt-1">For {data.lender.name}</div>
          <p className="mt-0.5 text-muted-foreground">Authorised Signatory</p>
        </div>
      </div>

      <p className="mt-3 text-center text-[8px] text-muted-foreground">
        This is a computer-generated agreement. For support, contact {data.lender.email}
      </p>
    </div>
  )
}

function AgreementContent({ applicationId }: { applicationId: string }) {
  const [state, setState] = useState<{ data: AgreementData | null; error: string | null; loading: boolean }>(() => ({
    data: null, error: null, loading: true,
  }))

  useEffect(() => {
    let cancelled = false
    api<{ agreement: AgreementData }>(`/api/agreement?applicationId=${applicationId}`)
      .then((r) => { if (!cancelled) setState({ data: r.agreement, error: null, loading: false }) })
      .catch((e) => { if (!cancelled) setState({ data: null, error: (e as Error).message, loading: false }) })
    return () => { cancelled = true }
  }, [applicationId])

  if (state.loading) {
    return (
      <div className="py-12 flex flex-col items-center gap-2 text-muted-foreground">
        <Loader2 className="size-6 animate-spin text-primary" />
        <span className="text-sm">Loading agreement…</span>
      </div>
    )
  }
  if (state.error || !state.data) {
    return <div className="py-8 text-center text-sm text-destructive">{state.error || 'Not found'}</div>
  }
  return <AgreementBody data={state.data} />
}

export function AgreementModal({ applicationId, onClose }: Props) {
  function handlePrint() {
    document.body.classList.add('printing-agreement')
    window.print()
    window.addEventListener('afterprint', () => {
      document.body.classList.remove('printing-agreement')
    }, { once: true })
  }

  return (
    <Dialog open={!!applicationId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl print-agreement-area">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-5 text-primary" /> Loan Agreement
          </DialogTitle>
          <DialogDescription>View, print, or save your loan contract as PDF.</DialogDescription>
        </DialogHeader>

        {applicationId && <AgreementContent key={applicationId} applicationId={applicationId} />}

        <DialogFooter className="print:hidden">
          <Button variant="outline" onClick={onClose}><X className="size-4" /> Close</Button>
          <Button onClick={handlePrint} className="bg-brand-gradient text-white hover:opacity-90">
            <Printer className="size-4" /> Print / Save PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
