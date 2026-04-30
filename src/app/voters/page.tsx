'use client'

import { useState, useEffect } from 'react'
import VoterUpload from '@/components/voters/VoterUpload'
import VoterSegmentsTable from '@/components/voters/VoterSegmentsTable'

export default function VotersPage() {
  const [view,         setView]        = useState<'loading' | 'upload' | 'table'>('loading')
  const [voterCount,   setVoterCount]  = useState(0)

  useEffect(() => {
    fetch('/api/voters?limit=1')
      .then(r => r.json())
      .then(d => {
        setVoterCount(d.total ?? 0)
        setView(d.total > 0 ? 'table' : 'upload')
      })
      .catch(() => setView('upload'))
  }, [])

  return (
    <div className="space-y-8">
      {/* ── Hero ── */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none select-none">
          <span className="text-white opacity-[0.04] text-[180px] font-black leading-none">🗳️</span>
        </div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-gold-400 text-navy text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            ✦ Voter Intelligence
          </div>
          <h1 className="font-display text-5xl font-black text-white leading-tight mb-2">
            Voter <span className="text-gold-400">Command.</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-6">
            Upload your voter file. Claude segments every contact — GOTV targets, persuadables, issue voters — so your team always knows who to call and what to say.
          </p>
          <div className="flex flex-wrap gap-3 items-center">
            {voterCount > 0 && (
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-xl text-white text-sm font-bold">
                <span className="text-gold-400">✓</span>
                {voterCount.toLocaleString()} voters loaded
              </div>
            )}
            {view === 'table' && (
              <button onClick={() => setView('upload')}
                className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all">
                + Upload More Voters
              </button>
            )}
            {view === 'upload' && voterCount > 0 && (
              <button onClick={() => setView('table')}
                className="text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all">
                ← View Voter List
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Content ── */}
      {view === 'loading' && (
        <div className="flex items-center justify-center py-16">
          <span className="w-8 h-8 border-4 border-navy border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {view === 'upload' && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-8 max-w-2xl mx-auto">
          <VoterUpload onComplete={() => {
            fetch('/api/voters?limit=1').then(r => r.json()).then(d => setVoterCount(d.total ?? 0))
            setView('table')
          }} />
        </div>
      )}

      {view === 'table' && (
        <div className="bg-white rounded-2xl border-2 border-gray-100 shadow-sm p-6">
          <VoterSegmentsTable onUploadMore={() => setView('upload')} />
        </div>
      )}
    </div>
  )
}
