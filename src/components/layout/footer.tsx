import { Wallet, ShieldCheck, Zap } from 'lucide-react'

export function Footer() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <Wallet className="size-4" />
            </span>
            <div>
              <p className="font-semibold text-sm">LoanFast</p>
              <p className="text-xs text-muted-foreground">Fast, secure digital loans.</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><ShieldCheck className="size-3.5" /> Bank-grade encryption</span>
            <span className="flex items-center gap-1.5"><Zap className="size-3.5" /> Instant approval</span>
          </div>
        </div>
        <div className="mt-6 border-t pt-4 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} LoanFast. For demonstration purposes only. Not a real financial product.
        </div>
      </div>
    </footer>
  )
}
