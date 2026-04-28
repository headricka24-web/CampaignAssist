'use client'

import { useState } from 'react'
import RichText from './RichText'

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

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 py-6 text-sm text-gray-400">
      <span className="animate-spin w-4 h-4 border-2 border-navy border-t-transparent rounded-full inline-block" />
      {label}
    </div>
  )
}

// Parses the demographics text into sections per voter group
function parseSections(text: string): { title: string; body: string }[] {
  return text.split(/\n---+\n?/).map(chunk => {
    const lines = chunk.trim().split('\n')
    const title = lines[0].replace(/^#+\s*/, '').replace(/\*\*/g, '').trim()
    const body  = lines.slice(1).join('\n').trim()
    return { title, body }
  }).filter(s => s.title && s.body)
}

function DemographicCard({ title, body }: { title: string; body: string }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-gold-500 font-bold">★</span>
          <span className="font-display font-black text-navy text-sm uppercase tracking-wide">{title}</span>
        </div>
        <span className="text-gray-400 text-lg">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <div className="pt-4">
            <RichText text={body} />
          </div>
          <div className="mt-4">
            <CopyButton text={`${title}\n\n${body}`} />
          </div>
        </div>
      )}
    </div>
  )
}

export default function HotButtons() {
  const [briefing,      setBriefing]      = useState('')
  const [issues,        setIssues]        = useState<string[]>([])
  const [demographics,  setDemographics]  = useState('')
  const [loadingBrief,  setLoadingBrief]  = useState(false)
  const [loadingDemog,  setLoadingDemog]  = useState(false)
  const [briefError,    setBriefError]    = useState('')
  const [demogError,    setDemogError]    = useState('')

  async function fetchBriefing() {
    setLoadingBrief(true)
    setBriefError('')
    setBriefing('')
    setIssues([])
    setDemographics('')
    const res  = await fetch('/api/hot-buttons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'briefing' }),
    })
    const data = await res.json()
    if (data.error === 'no_news') setBriefError('Could not find news for your state. Make sure a candidate is set up in Settings.')
    else if (data.error) setBriefError('Something went wrong. Try again.')
    else { setBriefing(data.briefing); setIssues(data.issues ?? []) }
    setLoadingBrief(false)
  }

  async function fetchDemographics() {
    setLoadingDemog(true)
    setDemogError('')
    setDemographics('')
    const res  = await fetch('/api/hot-buttons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'demographics', issues }),
    })
    const data = await res.json()
    if (data.error) setDemogError('Something went wrong generating demographics. Try again.')
    else setDemographics(data.demographics)
    setLoadingDemog(false)
  }

  const demogSections = demographics ? parseSections(demographics) : []

  return (
    <div className="space-y-8">

      {/* ── Hero ─────────────────────────────────────────────── */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute bottom-0 right-8 text-white opacity-5 text-[140px] font-black leading-none select-none">🔥</div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-red-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Live Intelligence
          </div>
          <h1 className="font-display text-5xl font-black text-white leading-tight mb-2">
            Hot <span className="text-gold-400">Buttons</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-6">
            Scan what's dominating the political conversation in your state right now — then get a tactical playbook for reaching every type of voter.
          </p>
          <button
            onClick={fetchBriefing}
            disabled={loadingBrief}
            className="inline-flex items-center gap-2 bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black px-8 py-3 rounded-xl text-sm uppercase tracking-widest shadow-glow-red transition-all hover:scale-105 active:scale-100"
          >
            {loadingBrief
              ? <><span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full inline-block" /> Scanning the news…</>
              : briefing ? '↺ Refresh Briefing' : '🔥 What\'s on the Table Right Now?'}
          </button>
          {briefError && <p className="mt-3 text-red-300 text-sm">{briefError}</p>}
        </div>
      </div>

      {/* ── Briefing ─────────────────────────────────────────── */}
      {loadingBrief && <Spinner label="Scanning Google News and generating your briefing…" />}

      {briefing && !loadingBrief && (
        <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
          <div className="h-1.5 bg-red-gradient" />
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display font-black text-navy uppercase tracking-wide text-sm">Hot Button Issues Briefing</h2>
                <p className="text-xs text-gray-400">Generated from live Google News · {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <CopyButton text={briefing} />
            </div>
            <div className="bg-gray-50 rounded-xl p-5 border border-gray-100">
              <RichText text={briefing} />
            </div>
          </div>
        </div>
      )}

      {/* ── Demographics CTA ─────────────────────────────────── */}
      {briefing && !loadingBrief && (
        <div className="rounded-2xl border-2 border-dashed border-gold-300 bg-gold-50 px-6 py-5 flex items-center justify-between gap-4">
          <div>
            <h3 className="font-display font-black text-navy text-sm uppercase tracking-wide mb-1">Voter Demographics & Rhetorical Strategy</h3>
            <p className="text-xs text-gray-500">Get a breakdown of key voter groups in your state with tactical messaging recommendations for each hot button issue.</p>
          </div>
          <button
            onClick={fetchDemographics}
            disabled={loadingDemog}
            className="shrink-0 inline-flex items-center gap-2 bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-black px-6 py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all"
          >
            {loadingDemog
              ? <><span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full inline-block" /> Generating…</>
              : demographics ? '↺ Regenerate' : '★ Generate Voter Strategy'}
          </button>
        </div>
      )}

      {loadingDemog && <Spinner label="Building your voter demographics and messaging strategy…" />}
      {demogError   && <p className="text-sm text-red-500">{demogError}</p>}

      {/* ── Demographics Accordion ───────────────────────────── */}
      {demogSections.length > 0 && !loadingDemog && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-navy-300 to-transparent" />
            <h2 className="text-xs font-bold uppercase tracking-[0.3em] text-navy-400">Voter Groups & Messaging Strategy</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-navy-300 to-transparent" />
          </div>
          <div className="space-y-3">
            {demogSections.map((s, i) => (
              <DemographicCard key={i} title={s.title} body={s.body} />
            ))}
          </div>
        </div>
      )}

    </div>
  )
}
