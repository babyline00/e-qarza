// Client-side cache utility — uses memory + sessionStorage for fast page loads
// Reduces API calls by caching responses with TTL

interface CacheEntry<T> {
  data: T
  expiresAt: number
}

const memoryCache = new Map<string, CacheEntry<unknown>>()

// Get from cache (memory first, then sessionStorage)
export function getCached<T>(key: string): T | null {
  // Check memory cache
  const mem = memoryCache.get(key)
  if (mem && mem.expiresAt > Date.now()) {
    return mem.data as T
  }

  // Check sessionStorage
  if (typeof window !== 'undefined') {
    try {
      const raw = sessionStorage.getItem(`cache:${key}`)
      if (raw) {
        const entry = JSON.parse(raw) as CacheEntry<T>
        if (entry.expiresAt > Date.now()) {
          // Restore to memory cache
          memoryCache.set(key, entry)
          return entry.data
        }
        sessionStorage.removeItem(`cache:${key}`)
      }
    } catch {
      // ignore parse errors
    }
  }

  return null
}

// Set cache (both memory + sessionStorage)
export function setCached<T>(key: string, data: T, ttlMs = 30000): void {
  const entry: CacheEntry<T> = { data, expiresAt: Date.now() + ttlMs }
  memoryCache.set(key, entry)

  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(`cache:${key}`, JSON.stringify(entry))
    } catch {
      // sessionStorage might be full — ignore
    }
  }
}

// Invalidate cache by key prefix
export function invalidateCache(prefix: string): void {
  // Memory
  for (const key of memoryCache.keys()) {
    if (key.startsWith(prefix)) memoryCache.delete(key)
  }
  // SessionStorage
  if (typeof window !== 'undefined') {
    for (let i = sessionStorage.length - 1; i >= 0; i--) {
      const key = sessionStorage.key(i)
      if (key?.startsWith(`cache:${prefix}`)) sessionStorage.removeItem(key)
    }
  }
}

// Clear all cache
export function clearAllCache(): void {
  memoryCache.clear()
  if (typeof window !== 'undefined') {
    const keys = Object.keys(sessionStorage).filter(k => k.startsWith('cache:'))
    keys.forEach(k => sessionStorage.removeItem(k))
  }
}

// Cached fetch — checks cache first, falls back to API
export async function cachedFetch<T>(
  key: string,
  url: string,
  options?: { ttlMs?: number; force?: boolean }
): Promise<T> {
  const ttl = options?.ttlMs ?? 30000

  // Check cache unless forced
  if (!options?.force) {
    const cached = getCached<T>(key)
    if (cached !== null) return cached
  }

  // Fetch from API
  const res = await fetch(url, { credentials: 'same-origin' })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || `Request failed (${res.status})`)

  setCached(key, data, ttl)
  return data as T
}
