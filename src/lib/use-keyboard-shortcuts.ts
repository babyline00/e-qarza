'use client'

import { useEffect } from 'react'
import type { View } from '@/lib/store'

interface ShortcutsConfig {
  onNavigate: (view: View) => void
  enabled: boolean
}

const SHORTCUTS: Record<string, View> = {
  d: 'dashboard',
  l: 'my_loans',
  n: 'notifications',
  p: 'profile',
  t: 'transactions',
  h: 'help',
}

// Global keyboard shortcuts for navigation.
// Single-key shortcuts (d/l/n/p/t/h) only fire when:
// - not typing in an input/textarea/select/contentEditable
// - no modifier keys (ctrl/meta/alt) are held
export function useKeyboardShortcuts({ onNavigate, enabled }: ShortcutsConfig) {
  useEffect(() => {
    if (!enabled) return
    function handler(e: KeyboardEvent) {
      // ignore if modifier keys held
      if (e.ctrlKey || e.metaKey || e.altKey) return
      // ignore if focus is in an input/textarea/select/contentEditable
      const target = e.target as HTMLElement
      if (target) {
        const tag = target.tagName
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable) return
      }
      const key = e.key.toLowerCase()
      const view = SHORTCUTS[key]
      if (view) {
        e.preventDefault()
        onNavigate(view)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onNavigate, enabled])
}
