'use client'

import { useEffect } from 'react'

// Injects the admin-authored snippets from Admin → Settings → Custom Code.
//
// Why not dangerouslySetInnerHTML: React never executes <script> tags inserted
// that way, so every real chat widget (Tawk.to, Crisp, Intercom) would be
// silently dropped. We build real DOM nodes instead and re-create each <script>
// so the browser runs it.
//
//   header -> document.head
//   chat   -> end of document.body
//   footer -> end of document.body
//
// Injection is idempotent (guarded by a data attribute) so HMR remounts and
// re-renders cannot stack duplicate widgets.

function inject(target: HTMLElement, html: string, id: string) {
  if (!html.trim() || target.querySelector(`[data-custom-code="${id}"]`)) return

  const tpl = document.createElement('template')
  tpl.innerHTML = html

  // Re-create <script> nodes so they actually execute.
  tpl.content.querySelectorAll('script').forEach((old) => {
    const s = document.createElement('script')
    for (const attr of Array.from(old.attributes)) s.setAttribute(attr.name, attr.value)
    s.textContent = old.textContent
    old.replaceWith(s)
  })

  // Append the nodes straight into the target. Wrapping them in a hidden
  // container would suppress rendering — a `display:none` ancestor also hides
  // `position: fixed` children — so the idempotency guard attribute goes on
  // the first injected element instead.
  const nodes = Array.from(tpl.content.childNodes)
  const firstElement = nodes.find((n) => n.nodeType === Node.ELEMENT_NODE)

  for (const node of nodes) target.appendChild(node)

  if (firstElement) {
    ;(firstElement as Element).setAttribute('data-custom-code', id)
  } else {
    // Comment/text-only snippet still needs a marker for the guard. `contents`
    // keeps the marker out of the layout while remaining queryable.
    const marker = document.createElement('span')
    marker.setAttribute('data-custom-code', id)
    marker.style.display = 'contents'
    target.appendChild(marker)
  }
}

export function CustomCodeInjector() {
  useEffect(() => {
    let cancelled = false

    fetch('/api/custom-code', { credentials: 'same-origin' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { header?: string; chat?: string; footer?: string } | null) => {
        if (cancelled || !data) return
        inject(document.head, data.header || '', 'header')
        inject(document.body, data.chat || '', 'chat')
        inject(document.body, data.footer || '', 'footer')
      })
      .catch(() => {
        /* never break the app over a missing snippet */
      })

    return () => {
      cancelled = true
    }
  }, [])

  return null
}