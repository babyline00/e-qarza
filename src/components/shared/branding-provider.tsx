'use client'

import { createContext, useContext, useEffect, useState } from 'react'

// Provides the admin-uploaded site logo to every <Logo /> on the page and keeps
// the browser icons in sync with it.
//
// Mounted once in the root layout, so the header, footer, auth screen, receipt
// and agreement modals all pick up an upload without refetching.

const BrandingContext = createContext<string | null>(null)

export function useSiteLogo() {
  return useContext(BrandingContext)
}

// Replace every <link rel="icon"> so the favicon (and the tab icon on mobile)
// reflects the current logo. Next.js emits one from the static metadata, so we
// update it in place when possible and add the standard variants when missing.
function syncIcons(href: string) {
  const head = document.head

  let icon = head.querySelector<HTMLLinkElement>('link[rel~="icon"]')
  if (!icon) {
    icon = document.createElement('link')
    icon.rel = 'icon'
    head.appendChild(icon)
  }
  icon.type = href.endsWith('.svg') ? 'image/svg+xml' : 'image/png'
  icon.href = href

  if (!head.querySelector('link[rel="apple-touch-icon"]')) {
    const apple = document.createElement('link')
    apple.rel = 'apple-touch-icon'
    apple.href = href
    head.appendChild(apple)
  }
}

export function BrandingProvider({ children }: { children: React.ReactNode }) {
  const [logoPath, setLogoPath] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    fetch('/api/branding', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { logoPath?: string | null } | null) => {
        if (cancelled || !data) return
        if (data.logoPath) {
          setLogoPath(data.logoPath)
          syncIcons(data.logoPath)
        }
      })
      .catch(() => {
        /* keep the built-in logo */
      })

    return () => {
      cancelled = true
    }
  }, [])

  return <BrandingContext.Provider value={logoPath}>{children}</BrandingContext.Provider>
}