import { ShieldCheck, Zap } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/20">
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between">
          <Logo variant="mark" />
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1"><ShieldCheck className="size-3 text-primary" /> Bank-grade encryption</span>
            <span className="flex items-center gap-1"><Zap className="size-3 text-primary" /> Instant approval</span>
          </div>
        </div>
        <p className="mt-3 text-center text-[10px] text-muted-foreground/70">
          © 2026 E-Qarza. For demonstration only. Not a real financial product.
        </p>
      </div>
    </footer>
  )
}
