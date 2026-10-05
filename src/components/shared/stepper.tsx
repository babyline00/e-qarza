'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface StepperProps {
  steps: string[]
  current: number // 0-indexed
}

export function Stepper({ steps, current }: StepperProps) {
  return (
    <div className="w-full">
      <div className="flex items-center">
        {steps.map((label, i) => {
          const done = i < current
          const active = i === current
          return (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    'grid size-9 place-items-center rounded-full border-2 text-sm font-semibold transition-colors',
                    done && 'bg-primary border-primary text-primary-foreground',
                    active && 'border-primary text-primary bg-primary/10',
                    !done && !active && 'border-muted-foreground/30 text-muted-foreground bg-background'
                  )}
                >
                  {done ? <Check className="size-4" /> : i + 1}
                </div>
                <span
                  className={cn(
                    'text-xs font-medium text-center hidden sm:block',
                    (done || active) ? 'text-foreground' : 'text-muted-foreground'
                  )}
                >
                  {label}
                </span>
              </div>
              {i < steps.length - 1 && (
                <div className={cn('h-0.5 flex-1 mx-2 rounded transition-colors', i < current ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
