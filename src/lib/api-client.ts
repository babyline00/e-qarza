'use client'

export async function api<T = unknown>(
  path: string,
  opts: RequestInit = {}
): Promise<T> {
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
  return data as T
}
