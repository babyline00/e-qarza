'use client'

import { cn } from '@/lib/utils'
import { ArrowLeft } from 'lucide-react'

interface KycHeaderProps {
  step: number
  total: number
  title: string
  subtitle?: string
  onBack?: () => void
}

export function KycHeader({ step, total, title, subtitle, onBack }: KycHeaderProps) {
  return (
    <div className="bg-brand-gradient text-white">
      <div className="mx-auto max-w-3xl px-4 pt-4 pb-6">
        <div className="flex items-center gap-3">
          {onBack && (
            <button
              onClick={onBack}
              className="grid size-9 place-items-center rounded-full bg-white/15 hover:bg-white/25 transition shrink-0"
              aria-label="Go back"
            >
              <ArrowLeft className="size-5" />
            </button>
          )}
          <div className="min-w-0">
            <h1 className="text-lg font-bold leading-tight truncate">{title}</h1>
            {subtitle && <p className="text-xs text-white/80 mt-0.5">{subtitle}</p>}
          </div>
        </div>

        {/* progress nodes */}
        <div className="mt-5 flex items-center">
          {Array.from({ length: total }).map((_, i) => (
            <div key={i} className="flex items-center flex-1 last:flex-none">
              <div
                className={cn(
                  'grid size-7 place-items-center rounded-full text-xs font-bold border-2 shrink-0',
                  i < step && 'bg-white text-primary border-white',
                  i === step && 'bg-white/20 text-white border-white',
                  i > step && 'bg-transparent text-white/50 border-white/40'
                )}
              >
                {i < step ? '✓' : i + 1}
              </div>
              {i < total - 1 && (
                <div className={cn('h-0.5 flex-1 mx-1.5 rounded-full', i < step ? 'bg-white' : 'bg-white/30')} />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-white/80 mt-2">Step {step + 1} of {total}</p>
      </div>
    </div>
  )
}
