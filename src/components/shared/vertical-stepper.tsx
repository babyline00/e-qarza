'use client'

import { cn } from '@/lib/utils'
import { Check, Clock } from 'lucide-react'

export interface TimelineStep {
  title: string
  description?: string
  status: 'completed' | 'active' | 'pending'
}

interface VerticalStepperProps {
  steps: TimelineStep[]
  className?: string
}

export function VerticalStepper({ steps, className }: VerticalStepperProps) {
  return (
    <div className={cn('space-y-0', className)}>
      {steps.map((step, i) => (
        <div key={i} className="flex gap-3.5">
          {/* node + connector */}
          <div className="flex flex-col items-center">
            <div
              className={cn(
                'grid size-9 place-items-center rounded-full border-2 shrink-0 transition-colors',
                step.status === 'completed' && 'bg-primary border-primary text-primary-foreground',
                step.status === 'active' && 'border-primary text-primary bg-primary/10',
                step.status === 'pending' && 'border-muted-foreground/25 text-muted-foreground bg-background'
              )}
            >
              {step.status === 'completed' ? (
                <Check className="size-4" strokeWidth={3} />
              ) : step.status === 'active' ? (
                <Clock className="size-4" />
              ) : (
                <span className="text-xs font-semibold">{i + 1}</span>
              )}
            </div>
            {i < steps.length - 1 && (
              <div className={cn('w-0.5 grow min-h-8 mt-1 rounded-full', step.status === 'completed' ? 'bg-primary' : 'bg-muted')} />
            )}
          </div>
          {/* content */}
          <div className={cn('pb-6', i === steps.length - 1 && 'pb-0')}>
            <p className={cn('text-sm font-semibold leading-tight', step.status === 'pending' && 'text-muted-foreground')}>
              {step.title}
            </p>
            {step.description && (
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">{step.description}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
