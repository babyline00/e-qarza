'use client'

import { getCached, setCached, invalidateCache } from '@/lib/cache'

export async function api<T = unknown>(
  path: string,
  opts: RequestInit & { force?: boolean } = {}
): Promise<T> {
  // `force` skips the GET cache — used by explicit refresh buttons, which were
  // otherwise served stale data for up to the 15s TTL and looked broken.
  const { force, ...init } = opts

  // For GET requests without explicit cache bypass, use caching
  const isGet = !init.method || init.method === 'GET'
  const cacheKey = `api:${path}`

  if (isGet && !init.body && !force) {
    // Check cache (15s TTL for GET requests)
    const cached = getCached<T>(cacheKey)
    if (cached !== null) return cached
  }

  // For POST/PUT/DELETE — invalidate related caches
  if (init.method && init.method !== 'GET') {
    // Invalidate all API cache on mutations
    invalidateCache('api:')
  }

  const res = await fetch(path, {
    ...init,
    headers: {
      ...(init.body ? { 'Content-Type': 'application/json' } : {}),
      ...(init.headers || {}),
    },
    credentials: 'same-origin',
  })
  const text = await res.text()
  let data: unknown = null
  if (text) {
    try {
      data = JSON.parse(text)
    } catch {
      data = text
    }
  }
  if (!res.ok) {
    const msg =
      (data && typeof data === 'object' && 'error' in data
        ? String((data as Record<string, unknown>).error)
        : null) || `Request failed (${res.status})`
    throw new Error(msg)
  }

  // Cache successful GET responses
  if (isGet && !init.body) {
    setCached(cacheKey, data, 15000) // 15s TTL
  }

  return data as T
}
