'use client'

import { useState } from 'react'
import { useLocalStorage } from '@/lib/useLocalStorage'

type PollEntry = { label: string; value: number; isOurs: boolean }
type Poll = { title: string; date: string; source: string; entries: PollEntry[] }
type PollData = { polls: Poll[]; summary: string }

function PollBar({ entry, max }: { entry: PollEntry; max: number }) {
  const pct = max > 0 ? Math.round((entry.value / max) * 100) : 0
  return (
    <div className="mb-2">
      <div className="flex items-center justify-between mb-1">
        <span className={`text-xs font-bold ${entry.isOurs ? 'text-navy' : 'text-gray-500'}`}>
          {entry.isOurs ? '★ ' : ''}{entry.label}
        </span>
        <span className={`text-sm font-black ${entry.isOurs ? 'text-navy' : 'text-gray-500'}`}>
          {entry.value}%
        </span>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ${entry.isOurs ? 'bg-gradient-to-r from-navy to-blue-500' : 'bg-gradient-to-r from-red-400 to-red-600'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

function PollCard({ poll }: { poll: Poll }) {
  const max = Math.max(...poll.entries.map(e => e.value), 1)
  const lead = poll.entries.find(e => e.isOurs)
  const opp  = poll.entries.find(e => !e.isOurs)
  const margin = lead && opp ? lead.value - opp.value : null

  return (
    <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-sm overflow-hidden">
      <div className={`h-1 bg-gradient-to-r ${margin !== null && margin >= 0 ? 'from-navy to-blue-500' : 'from-red-500 to-red-700'}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-display font-black text-navy text-sm leading-snug flex-1">{poll.title}</h3>
          {margin !== null && (
            <span className={`shrink-0 text-xs font-black px-2 py-0.5 rounded-full ${margin >= 0 ? 'bg-blue-50 text-navy' : 'bg-red-50 text-red-700'}`}>
              {margin >= 0 ? `+${margin}` : margin}
            </span>
          )}
        </div>
        <p className="text-[11px] text-gray-400 mb-4">{poll.source} · {poll.date}</p>
        <div>
          {poll.entries.map((e, i) => <PollBar key={i} entry={e} max={max} />)}
        </div>
      </div>
    </div>
  )
}

export default function PollTracker() {
  const [data,    setData]    = useLocalStorage<PollData | null>('poll-tracker-data', null)
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState('')

  async function fetchPolls() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/polling', { method: 'POST' })
      const json = await res.json()
      if (json.error === 'no_polling_data') { setError('No polling data found in your news feed. Run a scan and try again.'); return }
      if (json.error) { setError('Could not load polling data. Try again.'); return }
      setData(json)
    } catch { setError('Network error. Try again.') }
    finally { setLoading(false) }
  }

  return (
    <div className="bg-white rounded-2xl border-2 border-navy-100 shadow-patriot overflow-hidden">
      <div className="h-1 bg-gradient-to-r from-navy to-gold-400" />
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Polling Tracker</h2>
            {data && <p className="text-[11px] text-gray-300 mt-0.5">Synthesized from scanned news coverage</p>}
          </div>
          <button
            onClick={fetchPolls}
            disabled={loading}
            className="shrink-0 text-xs font-black uppercase tracking-widest px-4 py-2 rounded-xl bg-navy text-white hover:bg-navy-700 disabled:opacity-50 transition-all"
          >
            {loading
              ? <span className="flex items-center gap-1.5"><span className="animate-spin w-3 h-3 border-2 border-white border-t-transparent rounded-full inline-block" />Loading…</span>
              : data ? '↺ Refresh' : '📊 Load Polls'}
          </button>
        </div>

        {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

        {!data && !loading && !error && (
          <div className="py-8 text-center">
            <div className="text-4xl mb-3 opacity-20">📊</div>
            <p className="text-sm text-gray-500 font-semibold">No polling data loaded.</p>
            <p className="text-xs text-gray-400 mt-1">Click the button above to synthesize polls from your news feed.</p>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center py-10 gap-3">
            <span className="w-5 h-5 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-400">Scanning articles for polling data…</span>
          </div>
        )}

        {data && !loading && (
          <>
            {data.summary && (
              <div className="bg-gray-50 rounded-xl px-4 py-3 mb-5 border border-gray-100">
                <p className="text-[11px] font-black uppercase tracking-widest text-gray-400 mb-1">Analysis</p>
                <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
              </div>
            )}

            {data.polls.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-sm text-gray-500">No specific polling numbers found in current coverage.</p>
                <p className="text-xs text-gray-400 mt-1">Run a news scan to pull in fresh articles with poll data.</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {data.polls.map((poll, i) => <PollCard key={i} poll={poll} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
