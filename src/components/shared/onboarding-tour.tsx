'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Sparkles, ChevronRight, X, Wallet, CreditCard, Bell, TrendingUp, CheckCircle2 } from 'lucide-react'

const STORAGE_KEY = 'e-qarza-onboarded'

const STEPS = [
  {
    icon: Wallet,
    title: 'Welcome to E-Qarza!',
    description: 'Your digital lending dashboard. Here you can manage your loans, track repayments, and monitor your credit score — all in one place.',
  },
  {
    icon: CreditCard,
    title: 'Track Your Loans',
    description: 'The Loan Overview card shows your active loan amount, repayment progress, and next installment due date. Click "Pay Now" to submit a payment.',
  },
  {
    icon: TrendingUp,
    title: 'Build Your Credit Score',
    description: 'Your credit score (300-900) improves as you pay installments on time. A higher score unlocks larger loans and better terms.',
  },
  {
    icon: Bell,
    title: 'Stay Notified',
    description: 'Get reminders before installments are due. You can customize notification channels (Email/SMS/In-App) in your Notifications page.',
  },
  {
    icon: Sparkles,
    title: 'Keyboard Shortcuts',
    description: 'Power users can navigate quickly: press D for Dashboard, L for Loans, N for Notifications, P for Profile, or ? for the full shortcuts list.',
  },
]

export function OnboardingTour() {
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(0)

  useEffect(() => {
    try {
      const done = localStorage.getItem(STORAGE_KEY)
      if (!done) {
        // small delay so it opens after dashboard renders
        const t = setTimeout(() => setOpen(true), 800)
        return () => clearTimeout(t)
      }
    } catch {
      /* ignore */
    }
  }, [])

  function close() {
    setOpen(false)
    try { localStorage.setItem(STORAGE_KEY, '1') } catch { /* ignore */ }
  }

  function next() {
    if (step < STEPS.length - 1) {
      setStep(step + 1)
    } else {
      close()
    }
  }

  function skip() {
    close()
  }

  const current = STEPS[step]
  const Icon = current.icon
  const isLast = step === STEPS.length - 1

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <span className="grid size-12 place-items-center rounded-2xl bg-brand-gradient text-white">
              <Icon className="size-6" />
            </span>
            <Button variant="ghost" size="icon" className="size-8" onClick={skip}>
              <X className="size-4" />
            </Button>
          </div>
          <DialogTitle className="text-lg mt-3">{current.title}</DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">{current.description}</DialogDescription>
        </DialogHeader>

        {/* progress dots */}
        <div className="flex items-center justify-center gap-1.5 py-2">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`h-1.5 rounded-full transition-all ${i === step ? 'w-6 bg-primary' : 'w-1.5 bg-muted-foreground/30'}`}
              aria-label={`Step ${i + 1}`}
            />
          ))}
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-2">
          <span className="text-xs text-muted-foreground">Step {step + 1} of {STEPS.length}</span>
          <div className="flex gap-2">
            {step > 0 && (
              <Button variant="outline" size="sm" onClick={() => setStep(step - 1)}>
                Back
              </Button>
            )}
            <Button size="sm" className="bg-brand-gradient text-white hover:opacity-90 gap-1" onClick={next}>
              {isLast ? <><CheckCircle2 className="size-4" /> Got it!</> : <>Next <ChevronRight className="size-4" /></>}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
