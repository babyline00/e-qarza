'use client'

import { cn } from '@/lib/utils'

interface PageHeaderProps {
  title: string
  description?: string
  icon?: React.ElementType
  className?: string
  children?: React.ReactNode
}

export function PageHeader({ title, description, icon: Icon, className, children }: PageHeaderProps) {
  return (
    <div className={cn('flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between', className)}>
      <div className="flex items-start gap-3">
        {Icon && (
          <span className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
            <Icon className="size-5" />
          </span>
        )}
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">{title}</h1>
          {description && <p className="text-sm text-muted-foreground mt-0.5">{description}</p>}
        </div>
      </div>
      {children}
    </div>
  )
}
