import { ShieldCheck, Zap, Lock } from 'lucide-react'
import { Logo } from '@/components/shared/logo'

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-5">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Logo variant="mark" />
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5 text-primary" /> Bank-grade encryption</span>
            <span className="flex items-center gap-1.5"><Lock className="size-3.5 text-primary" /> Secure data</span>
            <span className="flex items-center gap-1.5"><Zap className="size-3.5 text-primary" /> Instant approval</span>
          </div>
        </div>
        <div className="mt-4 border-t pt-3 text-center text-xs text-muted-foreground">
          © 2026 E-Qarza. For demonstration only. Not a real financial product.
        </div>
      </div>
    </footer>
  )
}
