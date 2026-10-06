'use client'

import { useEffect, useRef } from 'react'
import { api } from '@/lib/api-client'
import { playNotificationSound } from '@/lib/sound'

interface NotificationItem {
  id: string
  title: string
  read: boolean
  createdAt: string
}

// Polls for new notifications and plays a sound when new ones arrive.
// Used in the admin panel to alert admins of new KYC submissions, payments, etc.
export function useNotificationSound(enabled: boolean, intervalMs = 10000) {
  const knownIds = useRef<Set<string>>(new Set())
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (!enabled) return

    async function check() {
      try {
        // Admin uses the admin notifications endpoint (checks for new KYCs + payments)
        const [kycRes, payRes] = await Promise.all([
          fetch('/api/admin/kyc', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({ profiles: [] })),
          fetch('/api/admin/payment', { credentials: 'same-origin' }).then(r => r.json()).catch(() => ({ payments: [] })),
        ])

        const newItems: { id: string }[] = [
          ...(kycRes.profiles || []).map((p: { id: string }) => ({ id: `kyc-${p.id}` })),
          ...(payRes.payments || []).map((p: { id: string }) => ({ id: `pay-${p.id}` })),
        ]

        if (isFirstLoad.current) {
          // On first load, just record existing IDs without playing sound
          for (const item of newItems) knownIds.current.add(item.id)
          isFirstLoad.current = false
          return
        }

        // Check for new items
        let hasNew = false
        for (const item of newItems) {
          if (!knownIds.current.has(item.id)) {
            knownIds.current.add(item.id)
            hasNew = true
          }
        }

        if (hasNew) {
          playNotificationSound()
        }
      } catch {
        // ignore
      }
    }

    check()
    const t = setInterval(check, intervalMs)
    return () => clearInterval(t)
  }, [enabled, intervalMs])
}
