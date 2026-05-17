'use client'

import { useState } from 'react'
import RichText from '@/components/RichText'

const PHASES = [
  { id: 'early',      label: 'Early Campaign',  sub: '6+ months out',      icon: '🌱' },
  { id: 'middle',     label: 'Mid-Campaign',     sub: '2–6 months out',     icon: '📈' },
  { id: 'final-push', label: 'Final Push',       sub: 'Last 30–60 days',    icon: '🚀' },
  { id: 'gotv',       label: 'GOTV',             sub: 'Final 2 weeks',      icon: '🗳️' },
] as const

const BUDGETS = [
  { id: 'under-5k',  label: 'Under $5,000',       sub: 'Hyperlocal / grassroots' },
  { id: '5k-25k',    label: '$5,000 – $25,000',    sub: 'Local targeted'          },
  { id: '25k-100k',  label: '$25,000 – $100,000',  sub: 'Regional media'          },
  { id: '100k-plus', label: '$100,000+',            sub: 'Full media buy'          },
] as const

type Phase  = typeof PHASES[number]['id']
type Budget = typeof BUDGETS[number]['id']

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

export default function AdStrategyAdvisor() {
  const [phase,   setPhase]   = useState<Phase | null>(null)
  const [budget,  setBudget]  = useState<Budget | null>(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function generate() {
    if (!phase || !budget) return
    setLoading(true)
    setError('')
    setContent('')
    try {
      const res  = await fetch('/api/advertising/strategy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phase, budget }),
      })
      const data = await res.json()
      if (data.error === 'no_candidate') { setError('Add a candidate first.'); return }
      if (data.error) { setError('Something went wrong.'); return }
      setContent(data.content)
    } catch {
      setError('Network error.')
    } finally {
      setLoading(false)
    }
  }

  const canGenerate = phase && budget

  return (
    <section>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center text-xl shadow-lg select-none">🎯</div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-orange-500 font-black mb-0.5">Advertising</p>
            <h1 className="font-display font-black text-navy text-3xl">Ad Strategy Advisor</h1>
          </div>
        </div>
        <p className="text-gray-400 text-sm ml-[52px]">Get a complete advertising strategy built around your campaign phase and budget.</p>
      </div>

      <div className="max-w-2xl space-y-8">

        {/* Phase selector */}
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Campaign Phase</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {PHASES.map(p => (
              <button
                key={p.id}
                onClick={() => setPhase(p.id)}
                className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all text-center ${
                  phase === p.id
                    ? 'border-orange-500 bg-orange-50 shadow-sm'
                    : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/30'
                }`}
              >
                <span className="text-2xl">{p.icon}</span>
                <p className={`text-xs font-black leading-tight ${phase === p.id ? 'text-orange-700' : 'text-navy'}`}>{p.label}</p>
                <p className="text-[10px] text-gray-400">{p.sub}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Budget selector */}
        <div>
          <p className="text-xs font-black uppercase tracking-widest text-gray-500 mb-3">Advertising Budget</p>
          <div className="grid grid-cols-2 gap-3">
            {BUDGETS.map(b => (
              <button
                key={b.id}
                onClick={() => setBudget(b.id)}
                className={`flex items-center justify-between px-4 py-3.5 rounded-2xl border-2 transition-all ${
                  budget === b.id
                    ? 'border-orange-500 bg-orange-50 shadow-sm'
                    : 'border-gray-200 hover:border-orange-200 hover:bg-orange-50/30'
                }`}
              >
                <div className="text-left">
                  <p className={`text-sm font-black ${budget === b.id ? 'text-orange-700' : 'text-navy'}`}>{b.label}</p>
                  <p className="text-[11px] text-gray-400">{b.sub}</p>
                </div>
                {budget === b.id && <span className="text-orange-500 text-lg ml-2">✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={generate}
          disabled={!canGenerate || loading}
          className="w-full py-4 rounded-2xl font-black uppercase tracking-widest text-sm transition-all bg-navy text-white hover:bg-navy-700 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          {loading ? 'Building your strategy…' : 'Generate Ad Strategy'}
        </button>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {/* Output */}
        {content && (
          <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <span className="text-xl">🎯</span>
                <p className="font-black text-sm text-navy uppercase tracking-wide">Your Ad Strategy</p>
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
