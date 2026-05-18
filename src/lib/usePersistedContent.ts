'use client'

import { useState, useEffect } from 'react'

/**
 * Like useLocalStorage but backed by the server DB.
 * - Loads saved content from DB on mount (persists across devices/logins)
 * - `save(next)`  → updates local state AND writes to DB
 * - `clear()`     → resets to initial AND deletes from DB
 * - `setLocal(v)` → updates local state only (no DB write, for clearing UI before regenerating)
 */
export function usePersistedContent<T>(type: string, initial: T) {
  const [value,       setValue]       = useState<T>(initial)
  const [loading,     setLoading]     = useState(true)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/generated-content?type=${encodeURIComponent(type)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (data?.content != null) {
          try { setValue(JSON.parse(data.content) as T) }
          catch { setValue(data.content as unknown as T) }
        }
        if (data?.updatedAt) setGeneratedAt(data.updatedAt as string)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [type])

  async function save(next: T) {
    setValue(next)
    try {
      const res  = await fetch('/api/generated-content', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ type, content: JSON.stringify(next) }),
      })
      const data = await res.json()
      if (data?.updatedAt) setGeneratedAt(data.updatedAt as string)
    } catch { /* non-blocking — UI already updated */ }
  }

  async function clear() {
    setValue(initial)
    setGeneratedAt(null)
    try {
      await fetch(`/api/generated-content?type=${encodeURIComponent(type)}`, { method: 'DELETE' })
    } catch { /* non-blocking */ }
  }

  return [value, save, { clear, setLocal: setValue, loading, generatedAt }] as const
}

export function fmtGeneratedAt(iso: string | null): string | null {
  if (!iso) return null
  const d    = new Date(iso)
  const diff = Date.now() - d.getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1)   return 'Generated just now'
  if (mins < 60)  return `Generated ${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs  < 24)  return `Generated ${hrs}h ago`
  return `Generated ${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
}
