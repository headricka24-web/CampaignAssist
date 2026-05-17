'use client'

import { useState } from 'react'
import RichText from '@/components/RichText'
import { usePersistedContent } from '@/lib/usePersistedContent'

const FORMATS = [
  { id: 'tv-30',          icon: '📺', label: 'TV Spot',       sub: ':30 second',     color: 'text-red-600',    border: 'border-red-100',    bar: 'from-red-500 to-red-700'         },
  { id: 'tv-60',          icon: '📺', label: 'TV Spot',       sub: ':60 second',     color: 'text-red-600',    border: 'border-red-100',    bar: 'from-red-700 to-red-900'         },
  { id: 'radio-30',       icon: '📻', label: 'Radio Spot',    sub: ':30 second',     color: 'text-blue-600',   border: 'border-blue-100',   bar: 'from-blue-500 to-blue-700'       },
  { id: 'radio-60',       icon: '📻', label: 'Radio Spot',    sub: ':60 second',     color: 'text-blue-700',   border: 'border-blue-100',   bar: 'from-blue-700 to-blue-900'       },
  { id: 'digital-display',icon: '🖥️', label: 'Digital Display', sub: 'Banner ads',  color: 'text-violet-600', border: 'border-violet-100', bar: 'from-violet-500 to-violet-700'   },
  { id: 'social-video',   icon: '📱', label: 'Social Video',  sub: ':15–:30 script', color: 'text-orange-500', border: 'border-orange-100', bar: 'from-orange-400 to-orange-600'   },
  { id: 'direct-mail',    icon: '✉️', label: 'Direct Mail',   sub: 'Mailer copy',    color: 'text-emerald-600',border: 'border-emerald-100',bar: 'from-emerald-500 to-emerald-700' },
  { id: 'digital-preroll',icon: '▶️', label: 'Pre-Roll',      sub: ':15 non-skip',   color: 'text-amber-600',  border: 'border-amber-100',  bar: 'from-amber-400 to-amber-600'     },
] as const

type FormatId = typeof FORMATS[number]['id']

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

function Modal({ fmt, content, onClose, onRegen }: {
  fmt: typeof FORMATS[number]; content: string; onClose: () => void; onRegen: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/60 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-xl">{fmt.icon}</span>
            <div>
              <h2 className="font-display font-black text-navy uppercase tracking-wide text-sm">{fmt.label}</h2>
              <p className="text-[11px] text-gray-400">{fmt.sub}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CopyButton text={content} />
            <button onClick={onRegen} className="text-xs text-gray-400 hover:text-navy transition-colors font-bold">↺ Redo</button>
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

function FormatCard({ fmt, issue }: { fmt: typeof FORMATS[number]; issue: string }) {
  const [content, saveContent] = usePersistedContent(`ad-copy-${fmt.id}`, '')
  const [loading, setLoading]  = useState(false)
  const [error,   setError]    = useState('')
  const [open,    setOpen]     = useState(false)

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/advertising/copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ format: fmt.id, issue }),
      })
      const data = await res.json()
      if (data.error === 'no_candidate') { setError('Add a candidate first.'); return }
      if (data.error) { setError('Something went wrong.'); return }
      await saveContent(data.content)
      setOpen(true)
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className={`bg-white rounded-2xl border ${fmt.border} shadow-sm overflow-hidden flex flex-col`}>
        {/* Color bar */}
        <div className={`h-1 bg-gradient-to-r ${fmt.bar}`} />

        <div className="p-5 flex-1 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl leading-none">{fmt.icon}</span>
              <div>
                <p className={`font-black text-sm ${fmt.color}`}>{fmt.label}</p>
                <p className="text-[11px] text-gray-400">{fmt.sub}</p>
              </div>
            </div>
            {content && (
              <button
                onClick={() => setOpen(true)}
                className="text-[11px] font-bold text-gray-400 hover:text-navy transition-colors shrink-0"
              >
                View →
              </button>
            )}
          </div>

          {error && <p className="text-xs text-red-500">{error}</p>}

          <div className="mt-auto pt-2 flex gap-2">
            <button
              onClick={generate}
              disabled={loading}
              className="flex-1 py-2 rounded-xl text-xs font-black uppercase tracking-wide bg-navy text-white hover:bg-navy-700 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Writing…' : content ? '↺ Rewrite' : 'Generate'}
            </button>
            {content && (
              <button
                onClick={() => setOpen(true)}
                className="px-3 py-2 rounded-xl text-xs font-bold border border-gray-200 text-gray-500 hover:border-navy hover:text-navy transition-colors"
              >
                Open
              </button>
            )}
          </div>
        </div>
      </div>

      {open && content && (
        <Modal fmt={fmt} content={content} onClose={() => setOpen(false)} onRegen={() => { setOpen(false); generate() }} />
      )}
    </>
  )
}

export default function AdCopyStudio() {
  const [issue, setIssue] = useState('')

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-xl shadow-lg select-none">📺</div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-orange-500 font-black mb-0.5">Advertising</p>
            <h1 className="font-display font-black text-navy text-3xl">Ad Copy Studio</h1>
          </div>
        </div>
        <p className="text-gray-400 text-sm ml-[52px]">Generate professional scripts and copy for every ad format — TV, radio, digital, mail, and more.</p>
      </div>

      {/* Issue input */}
      <div className="max-w-2xl mb-8">
        <label className="block text-xs font-black uppercase tracking-widest text-gray-500 mb-2">
          Focus Issue / Theme <span className="text-gray-400 font-normal normal-case tracking-normal">(optional — leave blank for a general campaign ad)</span>
        </label>
        <input
          type="text"
          value={issue}
          onChange={e => setIssue(e.target.value)}
          placeholder="e.g. Border security, property taxes, public safety…"
          className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 transition-all"
        />
      </div>

      {/* Format grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl">
        {FORMATS.map(fmt => (
          <FormatCard key={fmt.id} fmt={fmt} issue={issue} />
        ))}
      </div>

      <p className="text-[11px] text-gray-300 mt-6 max-w-xl">
        Each format is stored and can be regenerated at any time. Change the focus issue above to produce new variations.
      </p>
    </section>
  )
}
