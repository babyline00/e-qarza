'use client'

import { useEffect, useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Keyboard } from 'lucide-react'

const SHORTCUTS = [
  { key: 'D', label: 'Dashboard' },
  { key: 'L', label: 'My Loans' },
  { key: 'N', label: 'Notifications' },
  { key: 'P', label: 'Profile' },
  { key: 'T', label: 'Transactions' },
  { key: 'H', label: 'Help & Support' },
  { key: '?', label: 'Show this help' },
]

export function KeyboardShortcutsHelp() {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.ctrlKey || e.metaKey || e.altKey) return
      const target = e.target as HTMLElement
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return
      if (e.key === '?') {
        e.preventDefault()
        setOpen((o) => !o)
      }
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="size-5 text-primary" /> Keyboard Shortcuts
          </DialogTitle>
          <DialogDescription>Press a key to navigate quickly.</DialogDescription>
        </DialogHeader>
        <div className="space-y-2 py-2">
          {SHORTCUTS.map((s) => (
            <div key={s.key} className="flex items-center justify-between rounded-lg border px-3 py-2">
              <span className="text-sm">{s.label}</span>
              <kbd className="min-w-8 rounded-md border bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground text-center">
                {s.key}
              </kbd>
            </div>
          ))}
          <p className="text-xs text-muted-foreground text-center pt-1">
            Shortcuts are disabled while typing in input fields.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  )
}
