'use client'

import { cn } from '@/lib/utils'
import { Info } from 'lucide-react'

export function InfoBox({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex gap-2.5 rounded-lg bg-primary/10 p-3 text-sm', className)}>
      <Info className="size-4 text-primary shrink-0 mt-0.5" />
      <div className="text-foreground/80">{children}</div>
    </div>
  )
}
