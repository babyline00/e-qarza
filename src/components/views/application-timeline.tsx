'use client'

import { cn } from '@/lib/utils'
import { fmtDate, fmtDateTime } from '@/lib/format'
import type { AppData } from '@/lib/store'
import {
  FileText, Banknote, ShieldCheck, CreditCard, CheckCircle2, Clock, XCircle,
} from 'lucide-react'

interface Props {
  app: AppData
}

interface Stage {
  title: string
  description: string
  date: string | null
  status: 'completed' | 'active' | 'pending' | 'rejected'
  icon: React.ElementType
}

export function ApplicationTimeline({ app }: Props) {
  const stages: Stage[] = [
    {
      title: 'Application Submitted',
      description: `Applied for ${app.planName} plan • ${fmtPKRAmount(app.amount)}`,
      date: app.appliedAt,
      status: 'completed',
      icon: FileText,
    },
    {
      title: 'Processing Fee Submitted',
      description: app.feePayment
        ? `Ref: ${app.feePayment.txnRef || '—'}`
        : 'Awaiting fee payment',
      date: app.feePayment?.createdAt || null,
      status: app.feePayment ? (app.feePayment.status === 'rejected' ? 'rejected' : 'completed') : (app.status === 'fee_pending' ? 'active' : 'pending'),
      icon: Banknote,
    },
    {
      title: 'Processing Fee Verified',
      description: app.feePayment?.status === 'approved'
        ? 'Payment approved by admin'
        : app.feePayment?.status === 'rejected'
        ? `Rejected: ${app.feePayment.status}`
        : 'Awaiting admin verification',
      date: app.feePayment?.status === 'approved' ? app.activatedAt : null,
      status: app.feePayment?.status === 'approved' ? 'completed' : app.feePayment?.status === 'rejected' ? 'rejected' : app.status === 'fee_submitted' ? 'active' : 'pending',
      icon: ShieldCheck,
    },
    {
      title: 'Loan Activated',
      description: app.activatedAt
        ? `${app.tenureMonths} installments generated`
        : 'Loan will activate after fee verification',
      date: app.activatedAt,
      status: app.activatedAt ? 'completed' : 'pending',
      icon: CreditCard,
    },
    {
      title: 'Installments Repaid',
      description: (() => {
        const paid = app.installments.filter((i) => i.status === 'paid').length
        const total = app.installments.length
        return total > 0 ? `${paid} of ${total} installments paid` : 'No installments yet'
      })(),
      date: null,
      status: app.status === 'completed' ? 'completed' : app.status === 'active' ? 'active' : 'pending',
      icon: CheckCircle2,
    },
  ]

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-bold mb-4">
        <FileText className="size-4 text-primary" /> Application Timeline
      </h3>
      <div>
        {stages.map((s, i) => (
          <div key={i} className="flex gap-3.5">
            {/* node + connector */}
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'grid size-9 place-items-center rounded-full border-2 shrink-0 transition-colors',
                  s.status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                  s.status === 'active' && 'border-primary text-primary bg-primary/10 animate-soft-pulse',
                  s.status === 'rejected' && 'bg-destructive border-destructive text-white',
                  s.status === 'pending' && 'border-muted-foreground/25 text-muted-foreground bg-background'
                )}
              >
                {s.status === 'completed' ? (
                  <CheckCircle2 className="size-4" strokeWidth={2.5} />
                ) : s.status === 'rejected' ? (
                  <XCircle className="size-4" strokeWidth={2.5} />
                ) : s.status === 'active' ? (
                  <Clock className="size-4" />
                ) : (
                  <s.icon className="size-4" />
                )}
              </div>
              {i < stages.length - 1 && (
                <div className={cn(
                  'w-0.5 grow min-h-8 mt-1 rounded-full',
                  s.status === 'completed' ? 'bg-primary' : s.status === 'rejected' ? 'bg-destructive/30' : 'bg-muted'
                )} />
              )}
            </div>
            {/* content */}
            <div className={cn('pb-5', i === stages.length - 1 && 'pb-0')}>
              <div className="flex items-center gap-2 flex-wrap">
                <p className={cn('text-sm font-semibold leading-tight', s.status === 'pending' && 'text-muted-foreground')}>
                  {s.title}
                </p>
                {s.date && (
                  <span className="text-[11px] text-muted-foreground bg-muted/60 rounded-full px-2 py-0.5">
                    {fmtDate(s.date)}
                  </span>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">{s.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function fmtPKRAmount(minor: number): string {
  return 'Rs ' + (minor / 100).toLocaleString('en-PK', { maximumFractionDigits: 0 })
}
