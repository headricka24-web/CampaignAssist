'use client'

import { useState } from 'react'
import OutletResults from './OutletResults'
import { usePersistedContent } from '@/lib/usePersistedContent'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-navy text-white hover:bg-navy-700 transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

export default function MediaOutletFinder() {
  const [content, saveContent, { loading: loadingCached }] = usePersistedContent('ad-outlets', '')
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [geoLabel, setGeoLabel] = useState('')
  const [customGeo, setCustomGeo] = useState('')

  async function find(force = false) {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/advertising/outlets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(customGeo.trim() ? { geo: customGeo.trim() } : {}),
      })
      const data = await res.json()
      if (data.error === 'no_candidate') { setError('Add a candidate first.'); return }
      if (data.error) { setError('Something went wrong.'); return }
      await saveContent(data.content)
      if (data.geo) setGeoLabel(data.geo)
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  const busy = loading || loadingCached

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-xl shadow-lg select-none">📡</div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-orange-500 font-black mb-0.5">Advertising</p>
            <h1 className="font-display font-black text-navy text-3xl">Media Outlet Finder</h1>
          </div>
        </div>
        <p className="text-gray-400 text-sm ml-[52px]">Discover local TV stations, radio, digital outlets, and newspapers for your race's market.</p>
      </div>

      <div className="max-w-3xl space-y-6">

        {/* Optional geo override */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-1">Geography</p>
          <p className="text-[12px] text-gray-400 mb-3">Auto-detected from your candidate profile. Override below if needed.</p>
          <input
            type="text"
            value={customGeo}
            onChange={e => setCustomGeo(e.target.value)}
            placeholder="e.g. Baton Rouge, LA  ·  Ohio CD-15  ·  Harris County, TX"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
          />
        </div>

        {/* Action */}
        <button
          onClick={() => find()}
          disabled={busy}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all bg-navy text-white hover:bg-navy-700 disabled:opacity-40 shadow-sm"
        >
          {busy ? 'Finding outlets…' : content ? '↺ Refresh Outlets' : 'Find Media Outlets'}
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Results */}
        {content && (
          <div>
            {/* Toolbar */}
            <div className="flex items-center justify-between mb-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">Media Buying Guide</p>
              <div className="flex items-center gap-2">
                <CopyButton text={content} />
                <button onClick={() => find(true)} className="text-xs text-gray-400 hover:text-navy font-bold transition-colors">↺ Redo</button>
              </div>
            </div>
            <OutletResults content={content} geo={geoLabel || undefined} />
          </div>
        )}

        <p className="text-[11px] text-gray-300">
          Results are AI-generated based on known media markets. Verify current contact details and rate cards directly with each outlet.
        </p>
      </div>
    </section>
  )
}
