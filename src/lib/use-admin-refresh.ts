'use client'

import { useEffect, useRef } from 'react'
import { useAppStore } from './store'

// Re-runs `fn` whenever the admin refresh button is pressed.
//
// The admin panel's TopNav refresh used to only refetch /api/me, which returns
// the admin's own profile and none of the admin dashboard data — so the button
// looked broken. AppShell now bumps `adminRefreshKey`; each admin tab subscribes
// through this hook so a manual refresh re-fetches whichever tab is mounted.
//
// Only fires on an actual key change, so it never double-fetches when `fn`
// changes identity (e.g. the users tab re-filtering).
export function useAdminRefresh(fn: () => void) {
  const key = useAppStore((s) => s.adminRefreshKey)
  const lastKey = useRef(key)

  useEffect(() => {
    if (lastKey.current === key) return
    lastKey.current = key
    fn()
  }, [key, fn])
}