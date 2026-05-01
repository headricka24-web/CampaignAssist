'use client'

import { useState } from 'react'
import RichText from './RichText'
import { useLocalStorage } from '@/lib/useLocalStorage'

export default function Constituents() {
  const [profile,   setProfile]   = useLocalStorage('constituents-profile', '')
  const [stateName, setStateName] = useLocalStorage('constituents-state', '')
  const [sources,   setSources]   = useLocalStorage<string[]>('constituents-sources', [])
  const [loading,   setLoading]   = useState(false)
  const [error,     setError]     = useState('')
  const [loaded,    setLoaded]    = useState(!!profile)

  async function generate() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/constituents')
      const data = await res.json()
      if (data.error) { setError('Could not generate profile. Try again.'); return }
      setProfile(data.profile)
      setStateName(data.state ?? '')
      setSources(data.sources ?? [])
      setLoaded(true)
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  const STAT_CARDS = [
    { icon: '🗺️', label: 'State Profile',        color: 'border-blue-100',   bar: 'from-blue-500 to-blue-700'     },
    { icon: '👥', label: 'Demographics',          color: 'border-purple-100', bar: 'from-purple-500 to-purple-700' },
    { icon: '🗳️', label: 'Voting Patterns',       color: 'border-red-100',    bar: 'from-red-500 to-red-700'       },
    { icon: '🏛️', label: 'GOP Voter Blocs',       color: 'border-navy-100',   bar: 'from-navy to-blue-600'         },
    { icon: '🎯', label: 'Swing Voters',          color: 'border-gold-100',   bar: 'from-yellow-400 to-gold-400'   },
    { icon: '📣', label: 'Marketing Focus',       color: 'border-green-100',  bar: 'from-green-500 to-green-700'   },
  ]

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute inset-0 flex items-center justify-end pr-10 pointer-events-none select-none">
          <span className="text-white opacity-[0.04] text-[160px] font-black leading-none">🗺</span>
        </div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-gold-400 text-navy text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            ✦ Voter Intelligence
          </div>
          <h1 className="font-display text-5xl font-black text-white leading-tight mb-2">
            Know Your <span className="text-gold-400">Constituents.</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-6">
            Stop guessing. Know exactly who your voters are — their income, voting history, and what moves them. Identify your base, your swing targets, and where every dollar of outreach should go.
          </p>
          <button onClick={generate} disabled={loading}
            className="bg-gold-400 hover:bg-gold-500 disabled:opacity-50 text-navy font-black px-8 py-3 rounded-xl text-sm tracking-widest uppercase transition-colors focus:outline-none focus:ring-2 focus:ring-white">
            {loading
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-navy border-t-transparent rounded-full animate-spin inline-block" />Analyzing{stateName ? ` ${stateName}` : ''}…</span>
              : loaded ? '↺ Refresh Profile' : '★ Generate Constituent Profile'}
          </button>
          {error && <p className="mt-3 text-red-300 text-sm">{error}</p>}
        </div>
      </div>

      {/* Sections legend */}
      {!loaded && !loading && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {STAT_CARDS.map(c => (
              <div key={c.label} className={`bg-white rounded-2xl border-2 ${c.color} overflow-hidden`}>
                <div className={`h-1 bg-gradient-to-r ${c.bar}`} />
                <div className="px-5 py-4 flex items-center gap-3">
                  <span className="text-2xl">{c.icon}</span>
                  <span className="text-sm font-bold text-navy">{c.label}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-12 text-center">
            <div className="text-5xl mb-4 opacity-30">📊</div>
            <p className="text-gray-500 font-semibold">No profile generated yet.</p>
            <p className="text-gray-400 text-sm mt-1">Click the button above to analyze your state's voter demographics.</p>
          </div>
        </>
      )}

      {/* Profile content */}
      {loaded && profile && (
        <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
          <div className="h-1.5 bg-gold-gradient" />
          <div className="p-8">
            <div className="flex items-start justify-between gap-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-2xl">📊</span>
                <div>
                  <h2 className="font-display font-black text-navy uppercase tracking-wide">{stateName} Constituent Profile</h2>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                    {sources.length > 0 ? (
                      sources.map(src => (
                        <span key={src} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-100 text-green-700">
                          ✓ {src}
                        </span>
                      ))
                    ) : (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-yellow-100 text-yellow-700">
                        AI estimates only
                      </span>
                    )}
                    <span className="text-[10px] text-gray-400">+ strategic analysis by Claude</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => { navigator.clipboard.writeText(profile) }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-navy text-white hover:bg-navy-700 transition-colors shrink-0"
              >
                Copy All
              </button>
            </div>
            <RichText text={profile} />
          </div>
        </div>
      )}
    </div>
  )
}
