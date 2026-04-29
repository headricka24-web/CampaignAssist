'use client'

import { useState } from 'react'
import RichText from './RichText'

type FundType = 'email' | 'directmail' | 'callscript' | 'textscript' | 'majordonor' | 'thankyou'

const TONES = ['Punchy', 'Sophisticated', 'Intellectual', 'Policy-Oriented'] as const
type Tone = typeof TONES[number]

const CARDS: {
  id: FundType; icon: string; title: string; subtitle: string
  bar: string; border: string; tagColor: string; activeBg: string
}[] = [
  { id: 'email',       icon: '📧', title: 'Email Appeal',      subtitle: 'Fundraising email with subject + body',        bar: 'from-blue-500 to-blue-700',     border: 'border-blue-100',   tagColor: 'text-blue-600',   activeBg: 'bg-blue-50'   },
  { id: 'directmail',  icon: '📬', title: 'Direct Mail',       subtitle: 'Physical mail copy, headline to P.S.',         bar: 'from-red-500 to-red-700',       border: 'border-red-100',    tagColor: 'text-red-600',    activeBg: 'bg-red-50'    },
  { id: 'callscript',  icon: '📞', title: 'Call Script',       subtitle: 'Phone banking with objection handling',        bar: 'from-green-500 to-green-700',   border: 'border-green-100',  tagColor: 'text-green-700',  activeBg: 'bg-green-50'  },
  { id: 'textscript',  icon: '💬', title: 'Text Script',       subtitle: '4-message SMS fundraising sequence',           bar: 'from-purple-500 to-purple-700', border: 'border-purple-100', tagColor: 'text-purple-600', activeBg: 'bg-purple-50' },
  { id: 'majordonor',  icon: '🤝', title: 'Major Donor Pitch', subtitle: 'Sophisticated $1,000+ ask letter',             bar: 'from-yellow-400 to-gold-500',   border: 'border-gold-100',   tagColor: 'text-yellow-700', activeBg: 'bg-gold-50'   },
  { id: 'thankyou',    icon: '💌', title: 'Thank You Notes',   subtitle: '3 templates by donor level',                  bar: 'from-pink-400 to-rose-500',     border: 'border-pink-100',   tagColor: 'text-pink-600',   activeBg: 'bg-pink-50'   },
]

const DEMOGRAPHICS = [
  'General (No Targeting)',
  'Rural & Small-Town Voters',
  'Suburban Families',
  'Urban Professionals',
  'Seniors (65+)',
  'Young Voters (18–34)',
  'Veterans & Military Families',
  'Small Business Owners',
  'Working-Class Voters',
]

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-navy text-white hover:bg-navy-700 transition-colors">
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  )
}

function Modal({ card, content, targeting, onClose, onRegen }: {
  card: typeof CARDS[0]; content: string; targeting: string; onClose: () => void; onRegen: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className={`h-1.5 bg-gradient-to-r ${card.bar}`} />
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">{card.icon}</span>
            <div>
              <h2 className={`font-display font-black text-sm uppercase tracking-wide ${card.tagColor}`}>{card.title}</h2>
              {targeting && <p className="text-[11px] text-gray-400 mt-0.5">{targeting}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <CopyButton text={content} />
            <button onClick={onRegen} className="text-xs font-bold text-gray-400 hover:text-navy transition-colors border border-gray-200 hover:border-navy px-2.5 py-1.5 rounded-lg">↺ Redo</button>
            <button onClick={onClose} className="ml-1 text-xl text-gray-300 hover:text-navy transition-colors leading-none">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto p-6">
          <RichText text={content} />
        </div>
      </div>
    </div>
  )
}

function FundCard(card: typeof CARDS[0] & { tone: Tone }) {
  const [content,     setContent]     = useState('')
  const [loading,     setLoading]     = useState(false)
  const [error,       setError]       = useState('')
  const [open,        setOpen]        = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [demographic, setDemographic] = useState('General (No Targeting)')
  const [issue,       setIssue]       = useState('')

  const isTargeted = demographic !== 'General (No Targeting)' || issue.trim() !== ''
  const targetingLabel = [
    demographic !== 'General (No Targeting)' ? demographic : '',
    issue.trim() ? `"${issue.trim()}"` : '',
  ].filter(Boolean).join(' · ')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/lets-fund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: card.id,
          demographic: demographic === 'General (No Targeting)' ? 'General' : demographic,
          issue: issue.trim() || 'General',
          tone: card.tone,
        }),
      })
      const data = await res.json()
      if (data.error) setError('Generation failed. Try again.')
      else { setContent(data.content); setOpen(true) }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={`bg-white rounded-2xl border-2 ${card.border} shadow-sm overflow-hidden flex flex-col hover:shadow-patriot transition-shadow`}>
        <div className={`h-1.5 bg-gradient-to-r ${card.bar}`} />
        <div className="p-5 flex-1 flex flex-col">

          {/* Header */}
          <div className="flex items-center gap-2.5 mb-0.5">
            <span className="text-2xl">{card.icon}</span>
            <h2 className={`font-display font-black text-sm uppercase tracking-wide ${card.tagColor}`}>{card.title}</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">{card.subtitle}</p>

          {/* Targeting toggle */}
          <button
            onClick={() => setShowOptions(o => !o)}
            className={`flex items-center justify-between w-full text-xs font-bold px-3 py-2 rounded-xl border transition-all mb-3 ${
              showOptions || isTargeted
                ? `${card.activeBg} ${card.border} ${card.tagColor}`
                : 'bg-gray-50 border-gray-200 text-gray-400 hover:border-gray-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <span>{isTargeted ? '🎯' : '⚙️'}</span>
              {isTargeted ? `Targeted: ${targetingLabel}` : 'Customize targeting (optional)'}
            </span>
            <span className="opacity-60">{showOptions ? '▲' : '▼'}</span>
          </button>

          {/* Options panel */}
          {showOptions && (
            <div className={`${card.activeBg} rounded-xl border ${card.border} p-4 mb-4 space-y-3`}>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                  Target Demographic
                </label>
                <select
                  value={demographic}
                  onChange={e => setDemographic(e.target.value)}
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-navy focus:outline-none focus:ring-2 focus:ring-gold-400"
                >
                  {DEMOGRAPHICS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">
                  Focus Issue <span className="normal-case font-normal text-gray-400">(optional)</span>
                </label>
                <input
                  type="text"
                  value={issue}
                  onChange={e => setIssue(e.target.value)}
                  placeholder="e.g. healthcare, border security, taxes…"
                  className="w-full text-xs border border-gray-200 rounded-lg px-3 py-2 bg-white text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
                />
              </div>
            </div>
          )}

          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

          {/* Action buttons */}
          <div className="mt-auto flex gap-2">
            {content && (
              <button onClick={() => setOpen(true)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-white bg-gradient-to-r ${card.bar} transition-all hover:opacity-90`}>
                View ↗
              </button>
            )}
            <button onClick={generate} disabled={loading}
              className={`py-2.5 rounded-xl border-2 border-dashed text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50
                ${content ? 'px-3 border-gray-200 text-gray-400 hover:border-navy hover:text-navy' : 'w-full border-gray-200 text-gray-400 hover:bg-navy hover:text-white hover:border-navy'}`}>
              {loading
                ? <span className="flex items-center justify-center gap-1.5">
                    <span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full inline-block" />
                    Writing…
                  </span>
                : content ? '↺' : isTargeted ? '★ Generate Targeted →' : 'Generate →'}
            </button>
          </div>
        </div>
      </div>

      {open && content && (
        <Modal
          card={card}
          content={content}
          targeting={targetingLabel}
          onClose={() => setOpen(false)}
          onRegen={() => { setOpen(false); generate() }}
        />
      )}
    </>
  )
}

export default function LetsFund() {
  const [tone, setTone] = useState<Tone>('Punchy')

  return (
    <div className="space-y-8">
      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none select-none">
          <span className="text-white opacity-[0.04] text-[180px] font-black leading-none">$</span>
        </div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-gold-400 text-navy text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            ✦ Fundraising Studio
          </div>
          <h1 className="font-display text-5xl font-black text-white leading-tight mb-2">
            Let's <span className="text-gold-400">Fund It.</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-5">
            AI-generated fundraising content for every channel. Target by demographic and issue, or generate a general version — your choice every time.
          </p>
          <div className="flex flex-wrap gap-2 mb-5">
            <span className="text-xs font-bold text-blue-300 border border-navy-400 px-3 py-1 rounded-full">🎯 Demographic Targeting</span>
            <span className="text-xs font-bold text-blue-300 border border-navy-400 px-3 py-1 rounded-full">🔥 Issue-Based Messaging</span>
            <span className="text-xs font-bold text-blue-300 border border-navy-400 px-3 py-1 rounded-full">✓ Email · Mail · Phone · Text</span>
            <span className="text-xs font-bold text-blue-300 border border-navy-400 px-3 py-1 rounded-full">✓ Major Donors · Thank Yous</span>
          </div>

          {/* Tone selector */}
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-gold-400 mb-2">Content Tone</p>
            <div className="flex flex-wrap gap-2">
              {TONES.map(t => (
                <button key={t} onClick={() => setTone(t)}
                  className={`text-xs font-bold px-4 py-2 rounded-full border-2 transition-all ${
                    tone === t
                      ? 'bg-gold-400 border-gold-400 text-navy'
                      : 'border-navy-400 text-blue-300 hover:border-gold-400 hover:text-gold-400'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* How it works hint */}
      <div className="bg-white rounded-2xl border border-gold-200 px-5 py-4 flex items-start gap-3">
        <span className="text-gold-400 text-lg shrink-0 mt-0.5">💡</span>
        <p className="text-sm text-gray-600 leading-relaxed">
          <strong className="text-navy">Each card generates independently.</strong> Click <span className="font-mono bg-gray-100 px-1 rounded text-xs">⚙️ Customize targeting</span> on any card to target a specific voter group or issue — or just hit <span className="font-mono bg-gray-100 px-1 rounded text-xs">Generate →</span> for a general version. Results open in a popup so your layout stays clean.
        </p>
      </div>

      {/* Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CARDS.map(card => <FundCard key={card.id} {...card} tone={tone} />)}
      </div>
    </div>
  )
}
