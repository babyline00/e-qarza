'use client'

import { getCached, setCached, invalidateCache } from '@/lib/cache'

export async function api<T = unknown>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
  // For GET requests without explicit cache bypass, use caching
  const isGet = !opts.method || opts.method === 'GET'
  const cacheKey = `api:${path}`

  if (isGet && !opts.body) {
    // Check cache (15s TTL for GET requests)
    const cached = getCached<T>(cacheKey)
    if (cached !== null) return cached
  }

  // For POST/PUT/DELETE — invalidate related caches
  if (opts.method && opts.method !== 'GET') {
    // Invalidate all API cache on mutations
    invalidateCache('api:')
  }

  const res = await fetch(path, {
    ...opts,
    headers: {
      ...(opts.body ? { 'Content-Type': 'application/json' } : {}),
      ...(opts.headers || {}),
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
  if (isGet && !opts.body) {
    setCached(cacheKey, data, 15000) // 15s TTL
  }

  return data as T
}
