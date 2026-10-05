'use client'

import { useState } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/page-header'
import { api } from '@/lib/api-client'
import { toast } from 'sonner'
import { fmtPKR, loanTotals } from '@/lib/format'
import { Wallet, Loader2, CheckCircle2, TrendingUp, CalendarDays, Percent, Sparkles } from 'lucide-react'

interface Props {
  onApplied: () => void
}

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
    <div className="mx-auto max-w-6xl px-4 py-8">
      <PageHeader
        title="Choose a Loan Plan"
        description="Pick the plan that fits your needs. You can apply for one active loan at a time."
        icon={Wallet}
      />

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {plans.length === 0 && (
          <Card className="sm:col-span-2 lg:col-span-4">
            <CardContent className="py-12 text-center text-muted-foreground">
              No loan plans available right now. Please check back later.
            </CardContent>
          </Card>
        )}
        {plans.map((plan, idx) => {
          const t = loanTotals(plan.amount, plan.interestRate, plan.tenureMonths)
          const featured = idx === 1
          return (
            <Card key={plan.id} className={`relative flex flex-col ${featured ? 'border-primary shadow-lg ring-1 ring-primary/20' : ''}`}>
              {featured && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="gap-1"><Sparkles className="size-3" /> Most Popular</Badge>
                </div>
              )}
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center justify-between">
                  {plan.name}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">Loan amount</p>
                  <p className="text-2xl font-bold">{fmtPKR(plan.amount)}</p>
                </div>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><Percent className="size-3" /> Rate</p>
                    <p className="font-semibold">{plan.interestRate}%</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2">
                    <p className="text-xs text-muted-foreground flex items-center gap-1"><CalendarDays className="size-3" /> Term</p>
                    <p className="font-semibold">{plan.tenureMonths} mo</p>
                  </div>
                </div>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Monthly installment</span><span className="font-semibold">{fmtPKR(t.monthlyInstallment)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total interest</span><span className="font-semibold">{fmtPKR(t.totalInterest)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Total payable</span><span className="font-semibold">{fmtPKR(t.totalPayable)}</span></div>
                  <div className="flex justify-between border-t pt-1 mt-1"><span className="text-muted-foreground">Processing fee</span><span className="font-semibold text-primary">{fmtPKR(plan.processingFee)}</span></div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  variant={featured ? 'default' : 'outline'}
                  onClick={() => apply(plan.id)}
                  disabled={applying !== null}
                >
                  {applying === plan.id ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <>Apply Now</>
                  )}
                </Button>
              </CardFooter>
            </Card>
          )
        })}
      </div>

      <div className="mt-6 rounded-lg border bg-muted/30 p-4 flex items-start gap-3">
        <TrendingUp className="size-5 text-primary shrink-0 mt-0.5" />
        <div className="text-sm text-muted-foreground">
          <p className="font-medium text-foreground mb-0.5">How it works</p>
          After selecting a plan, you will pay a small one-time processing fee to verify your bank account.
          Once verified, your loan is activated and your first installment becomes due.
        </div>
      </div>
    </div>
  )
}
