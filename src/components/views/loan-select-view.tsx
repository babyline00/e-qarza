'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent } from '@/components/ui/card'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { fmtPKR, loanTotals } from '@/lib/format'
import { Wallet, Loader2, Check, ChevronRight, Coins } from 'lucide-react'
import { InfoBox } from '@/components/shared/info-box'
import { EligibilityBadge } from '@/components/shared/eligibility-badge'

interface Props {
  onApplied: () => void
}

const HERO_BULLETS = ['0% Markup', 'Quick Approval', 'Flexible Installments']

export function LoanSelectView({ onApplied }: Props) {
  const { plans } = useAppStore()
  const [applying, setApplying] = useState<string | null>(null)

  async function apply(planId: string) {
    setApplying(planId)
    try {
      await api('/api/plans/apply', { method: 'POST', body: JSON.stringify({ planId }) })
      toast.success('Application created! Proceed to pay the processing fee.')
      onApplied()
    } catch (err) {
      toast.error((err as Error).message)
    } finally {
      setApplying(null)
    }
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-5">
      {/* Orange gradient hero */}
      <div className="relative overflow-hidden rounded-2xl bg-brand-gradient p-5 text-white shadow-lg">
        <Coins
          className="pointer-events-none absolute right-2 top-2 size-28 text-white/20"
          strokeWidth={1.5}
        />
        <Coins
          className="pointer-events-none absolute bottom-1 right-12 size-14 text-white/10"
          strokeWidth={1.5}
        />
        <div className="relative">
          <h1 className="text-xl font-bold leading-snug pr-4">Get Instant Loan For Your Needs</h1>
          <ul className="mt-4 space-y-2.5">
            {HERO_BULLETS.map((b) => (
              <li key={b} className="flex items-center gap-3">
                <span className="grid size-6 place-items-center rounded-full bg-white shadow-sm">
                  <Check className="size-3.5 text-primary" strokeWidth={3} />
                </span>
                <span className="text-sm font-medium">{b}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Section title */}
      <div className="px-1">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          Select a Loan Plan
        </h2>
      </div>

      {/* Plan list (mobile-first vertical) */}
      <div className="space-y-3">
        {plans.length === 0 && (
          <Card className="rounded-2xl">
            <CardContent className="py-10 text-center text-muted-foreground">
              No loan plans available right now. Please check back later.
            </CardContent>
          </Card>
        )}

        {plans.map((plan) => {
          const t = loanTotals(plan.amount, plan.interestRate, plan.tenureMonths)
          const isLoading = applying === plan.id
          const disabled = applying !== null
          return (
            <Card
              key={plan.id}
              role="button"
              tabIndex={0}
              aria-disabled={disabled}
              onClick={() => !disabled && apply(plan.id)}
              onKeyDown={(e) => {
                if (disabled) return
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault()
                  apply(plan.id)
                }
              }}
              className={`rounded-2xl transition-all ${
                disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:border-primary/30 hover-lift'
              } ${isLoading ? 'ring-2 ring-primary' : ''}`}
            >
              <CardContent className="flex items-center gap-3 p-4">
                <span className="grid size-12 place-items-center rounded-xl bg-brand-gradient text-white shrink-0">
                  {isLoading ? (
                    <Loader2 className="size-5 animate-spin" />
                  ) : (
                    <Wallet className="size-5" />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-lg font-bold leading-tight">{fmtPKR(plan.amount)}</p>
                    <EligibilityBadge planId={plan.id} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan.tenureMonths} Months &middot; {plan.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Monthly &asymp; {fmtPKR(t.monthlyInstallment)}
                  </p>
                </div>
                <ChevronRight className="size-5 text-muted-foreground shrink-0" />
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* How it works */}
      <InfoBox>
        <span className="font-medium">How it works &mdash; </span>
        After selecting a plan, you pay a small one-time processing fee to verify your bank
        account. Once verified, your loan is activated and your first installment becomes due.
      </InfoBox>
    </div>
  )
}
