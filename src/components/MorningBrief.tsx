'use client'

import { useEffect, useState } from 'react'
import RichText from './RichText'

export default function MorningBrief() {
  const [content,    setContent]    = useState<string | null>(null)
  const [loading,    setLoading]    = useState(true)
  const [generating, setGenerating] = useState(false)
  const [noArticles, setNoArticles] = useState(false)

  useEffect(() => {
    fetch('/api/morning-brief')
      .then(r => r.json())
      .then(d => { setContent(d.content ?? null) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  async function generate() {
    setGenerating(true); setNoArticles(false)
    const res  = await fetch('/api/morning-brief', { method: 'POST' })
    const data = await res.json()
    if (data.reason === 'no_articles') setNoArticles(true)
    else setContent(data.content)
    setGenerating(false)
  }

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="bg-white rounded-2xl shadow-patriot overflow-hidden border border-white/80">
      <div className="h-1.5 bg-gradient-to-r from-navy via-red-500 to-gold-400" />
      <div className="p-6">
        <div className="flex items-start justify-between mb-5 gap-4">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gold-100 flex items-center justify-center shrink-0">
                <span className="text-gold-500 font-black text-sm">★</span>
              </div>
              <h2 className="font-display text-xl font-bold text-navy">Here's Your Morning Brief</h2>
            </div>
            <p className="text-[11px] text-gray-400 uppercase tracking-widest pl-10">{today}</p>
          </div>
          {!loading && content && (
            <button onClick={generate} disabled={generating}
              className="shrink-0 text-xs font-bold text-gray-400 hover:text-navy transition-colors disabled:opacity-40 border border-gray-200 hover:border-navy px-3 py-1.5 rounded-lg">
              ↺ Regenerate
            </button>
          )}
        </div>

        {loading && (
          <div className="flex items-center gap-2.5 text-sm text-gray-400 py-4">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-navy border-t-transparent rounded-full" />
            Checking for today's brief…
          </div>
        )}

        {!loading && !content && !generating && (
          <div className="py-2">
            {noArticles && <p className="text-sm text-gray-500 mb-3">No articles found. Run a news scan first, then generate your brief.</p>}
            {!noArticles && <p className="text-sm text-gray-500 mb-3">Click to generate your morning brief from all scanned articles.</p>}
            <button onClick={generate} disabled={generating}
              className="bg-navy hover:bg-navy-700 text-white font-bold px-6 py-2.5 rounded-xl text-sm transition-colors shadow-sm disabled:opacity-50">
              ★ Generate Morning Brief
            </button>
          </div>
        )}

        {generating && (
          <div className="flex items-center gap-2.5 text-sm text-gray-400 py-4">
            <span className="animate-spin inline-block w-4 h-4 border-2 border-navy border-t-transparent rounded-full" />
            Claude is writing your brief…
          </div>
        )}

        {content && !generating && (
          <div className="border-t border-gray-100 pt-5">
            <RichText text={content} />
          </div>
        )}
      </div>
    </div>
  )
}
