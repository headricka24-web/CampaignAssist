'use client'

import { useState } from 'react'
import RichText from '@/components/RichText'
import { usePersistedContent } from '@/lib/usePersistedContent'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="text-xs font-bold px-3 py-1.5 rounded-lg bg-navy text-white hover:bg-navy-700 transition-colors"
    >
      {copied ? '✓ Copied' : 'Copy All'}
    </button>
  )
}

export default function AdBrainstorm() {
  const [content, saveContent, { loading: loadingCached }] = usePersistedContent('ad-brainstorm', '')
  const [theme,   setTheme]   = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/advertising/brainstorm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ theme: theme.trim() }),
      })
      const data = await res.json()
      if (data.error === 'no_candidate') { setError('Add a candidate first.'); return }
      if (data.error) { setError('Something went wrong.'); return }
      await saveContent(data.content)
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
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-xl shadow-lg select-none">💡</div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-orange-500 font-black mb-0.5">Advertising</p>
            <h1 className="font-display font-black text-navy text-3xl">Ad Idea Brainstorm</h1>
          </div>
        </div>
        <p className="text-gray-400 text-sm ml-[52px]">Generate 5 creative ad concepts tailored to your race — including positive, contrast, and issue-based angles.</p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* Theme input */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
          <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-1">
            Theme or Focus <span className="text-gray-400 font-normal normal-case tracking-normal">(optional)</span>
          </label>
          <p className="text-[12px] text-gray-400 mb-3">
            Enter a theme to focus the concepts, or leave blank to let your war room data and hot button issues drive the ideas.
          </p>
          <input
            type="text"
            value={theme}
            onChange={e => setTheme(e.target.value)}
            placeholder="e.g. Crime & public safety, taxes, contrast with opponent…"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
          />

          {/* Pull-from hint */}
          <div className="mt-3 flex items-start gap-2 bg-orange-50 border border-orange-100 rounded-xl px-4 py-3">
            <span className="text-orange-400 text-sm mt-0.5 shrink-0">💡</span>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              CampaignAssist automatically pulls from your <strong>War Room</strong> threats and <strong>Hot Buttons</strong> issues to personalize the concepts — run those first for the best results.
            </p>
          </div>
        </div>

        {/* Generate */}
        <button
          onClick={generate}
          disabled={busy}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all bg-navy text-white hover:bg-navy-700 disabled:opacity-40 shadow-sm"
        >
          {busy ? 'Generating concepts…' : content ? '↺ New Concepts' : '✦ Generate Ad Concepts'}
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Results */}
        {content && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">💡</span>
                <p className="font-black text-sm text-navy uppercase tracking-wide">5 Ad Concepts</p>
              </div>
              <div className="flex items-center gap-2">
                <CopyButton text={content} />
                <button onClick={generate} className="text-xs text-gray-400 hover:text-navy font-bold transition-colors">↺ Redo</button>
              </div>
            </div>
            <div className="p-6">
              <RichText text={content} />
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
