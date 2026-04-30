'use client'

import { useState } from 'react'
import RichText from './RichText'
import { useLocalStorage } from '@/lib/useLocalStorage'

type Section = 'facebook' | 'instagram' | 'newsletter' | 'taglines' | 'strategy' | 'talking-points'

const TONES = ['Punchy', 'Sophisticated', 'Intellectual', 'Policy-Oriented'] as const
type Tone = typeof TONES[number]

const CARDS: { id: Section; icon: string; title: string; subtitle: string; color: string; border: string; bar: string }[] = [
  { id: 'strategy',        icon: '🎯', title: 'Strategic Playbook', subtitle: 'Tactical moves based on your news feed',  color: 'text-red-600',    border: 'border-red-100',    bar: 'from-red-500 to-red-700'         },
  { id: 'facebook',        icon: '📘', title: 'Facebook Posts',     subtitle: '3 ready-to-post drafts',                  color: 'text-blue-600',   border: 'border-blue-100',   bar: 'from-blue-500 to-blue-700'       },
  { id: 'instagram',       icon: '📸', title: 'Instagram Content',  subtitle: 'Captions + hashtags for 3 posts',         color: 'text-orange-500', border: 'border-orange-100', bar: 'from-yellow-400 to-pink-500'     },
  { id: 'newsletter',      icon: '📧', title: 'Newsletter Draft',   subtitle: 'Subject, preview text, and full body',    color: 'text-navy',       border: 'border-navy-100',   bar: 'from-navy to-blue-500'           },
  { id: 'taglines',        icon: '⚡', title: 'Taglines & Signage', subtitle: 'Punchy lines + yard sign ideas',          color: 'text-yellow-600', border: 'border-yellow-100', bar: 'from-yellow-400 to-gold-400'     },
  { id: 'talking-points',  icon: '💬', title: 'Talking Points',     subtitle: 'Enter an issue, get 3 GOP talking points', color: 'text-green-700',  border: 'border-green-100',  bar: 'from-green-500 to-green-700'     },
]

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

function Modal({ title, icon, content, onClose, onRegenerate }: {
  title: string; icon: string; content: string; onClose: () => void; onRegenerate: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">{icon}</span>
            <h2 className="font-display font-black text-navy uppercase tracking-wide text-sm">{title}</h2>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={content} />
            <button onClick={onRegenerate} className="text-xs text-gray-400 hover:text-navy transition-colors font-bold">↺ Redo</button>
            <button onClick={onClose} className="ml-2 text-gray-400 hover:text-navy transition-colors text-lg leading-none">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto p-6">
          <RichText text={content} />
        </div>
      </div>
    </div>
  )
}

function StudioCard({ id, icon, title, subtitle, color, border, bar, tone }: typeof CARDS[0] & { tone: Tone }) {
  const [content, setContent] = useLocalStorage(`media-studio-${id}`, '')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')
  const [open,    setOpen]    = useState(false)
  const [issue,   setIssue]   = useLocalStorage(`media-studio-${id}-issue`, '')

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/media-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ section: id, tone, issue: issue.trim() }),
      })
      const data = await res.json()
      if (data.error === 'no_articles') setError('No articles yet — run a news scan first.')
      else if (data.error === 'no_issue') setError('Enter a hot button issue first.')
      else if (data.error) setError('Something went wrong. Try again.')
      else { setContent(data.content); setOpen(true) }
    } catch {
      setError('Network error. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={`bg-white rounded-2xl border-2 ${border} shadow-sm overflow-hidden flex flex-col`}>
        <div className={`h-1 bg-gradient-to-r ${bar}`} />
        <div className="p-5 flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-0.5">
            <span className="text-lg">{icon}</span>
            <h2 className={`font-display font-black text-sm uppercase tracking-wide ${color}`}>{title}</h2>
          </div>
          <p className="text-xs text-gray-400 mb-4">{subtitle}</p>

          {id === 'talking-points' && (
            <input
              type="text"
              value={issue}
              onChange={e => setIssue(e.target.value)}
              placeholder="e.g. immigration, tax cuts, school choice…"
              className="w-full text-xs border border-gray-200 rounded-xl px-3 py-2.5 mb-3 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
            />
          )}

          {error && <p className="text-xs text-red-500 mb-2">{error}</p>}

          <div className="mt-auto flex gap-2">
            {content && (
              <button onClick={() => setOpen(true)}
                className={`flex-1 py-2 rounded-xl border-2 text-xs font-bold uppercase tracking-widest transition-all bg-gradient-to-r ${bar} text-white border-transparent`}>
                View Results ↗
              </button>
            )}
            <button onClick={generate} disabled={loading}
              className={`py-2 rounded-xl border-2 border-dashed text-xs font-bold uppercase tracking-widest transition-all disabled:opacity-50
                ${content ? 'px-3 border-gray-200 text-gray-400 hover:border-navy hover:text-navy' : 'w-full border-gray-200 text-gray-400 hover:bg-navy hover:text-white hover:border-navy'}`}>
              {loading
                ? <span className="flex items-center justify-center gap-1.5"><span className="animate-spin w-3 h-3 border-2 border-current border-t-transparent rounded-full inline-block" />Writing…</span>
                : content ? '↺' : 'Generate →'}
            </button>
          </div>
        </div>
      </div>

      {open && content && (
        <Modal title={title} icon={icon} content={content} onClose={() => setOpen(false)} onRegenerate={() => { setOpen(false); generate() }} />
      )}
    </>
  )
}

export default function MediaStudio() {
  const [tone, setTone] = useState<Tone>('Punchy')

  return (
    <div className="space-y-8">
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute top-0 right-0 text-white opacity-5 text-[160px] font-bold leading-none select-none pr-6">★</div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-gold-400 text-navy text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            ✦ AI-Powered
          </div>
          <h1 className="font-display text-5xl font-black text-white leading-tight mb-2">
            Media <span className="text-gold-400">Studio</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-6">
            Professional campaign content — on demand. Every post, newsletter, and tagline is built from your live news feed and tailored to your candidate.
          </p>

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

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CARDS.map(card => <StudioCard key={card.id} {...card} tone={tone} />)}
      </div>
    </div>
  )
}
