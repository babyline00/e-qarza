'use client'

import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  variant?: 'full' | 'mark'
  light?: boolean // for dark/orange backgrounds
}

export function Logo({ className, variant = 'full', light = false }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <span className="grid size-9 place-items-center rounded-xl bg-brand-gradient text-white shadow-sm shrink-0">
        {/* house + coin mark */}
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
          <path d="M3 11.5L12 4l9 7.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 10.5V20h14v-9.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          <circle cx="12" cy="15" r="2.6" fill="currentColor" />
        </svg>
      </span>
      {variant === 'full' && (
        <div className="leading-none">
          <span className={cn('text-lg font-extrabold tracking-tight italic', light ? 'text-white' : 'text-foreground')}>
            E-{light ? <span className="text-white">Qarza</span> : <span className="text-brand">Qarza</span>}
          </span>
          {!light && <p className="text-[9px] tracking-[0.18em] text-muted-foreground font-semibold mt-0.5">DIGITAL LOANS</p>}
          {light && <p className="text-[9px] tracking-[0.18em] text-white/70 font-semibold mt-0.5">DIGITAL LOANS</p>}
        </div>
      )}
    </div>
  )
}
