'use client'

import React, { useState } from 'react'
import type { Article, Outlet, Candidate } from '@prisma/client'
import SentimentBadge from './SentimentBadge'

type ArticleWithOutlet = Article & { outlet: Outlet }

const TABS = [
  { key: 'CandidateCoverage', label: 'Candidate Coverage', icon: '🗳️', color: 'text-navy',     badge: 'bg-navy-100 text-navy'         },
  { key: 'OpponentCoverage',  label: 'Opponent Coverage',  icon: '⚔️', color: 'text-red-500',  badge: 'bg-red-100 text-red-700'       },
  { key: 'GeneralRace',       label: 'General Race',       icon: '🏛️', color: 'text-gold-600', badge: 'bg-gold-100 text-gold-700'     },
  { key: 'HotButtons',        label: 'Hot Button Issues',  icon: '🔥', color: 'text-orange-600',badge: 'bg-orange-50 text-orange-700'  },
] as const

type BucketKey = (typeof TABS)[number]['key']

interface Props {
  candidates: Candidate[]
  initialBuckets: Record<string, ArticleWithOutlet[]>
}

export default function NewsClient({ candidates, initialBuckets }: Props) {
  const [activeTab, setActiveTab]         = useState<BucketKey>('CandidateCoverage')
  const [buckets, setBuckets]             = useState(initialBuckets)
  const [candidateId, setCandidateId]     = useState(candidates[0]?.id ?? '')
  const [opponentName, setOpponentName]   = useState('')
  const [hotTopics, setHotTopics]         = useState('')
  const [scanning, setScanning]           = useState(false)
  const [scanStatus, setScanStatus]       = useState('')
  const [backfilling, setBackfilling]     = useState(false)
  const [clearing, setClearing]           = useState(false)
  const [confirmClear, setConfirmClear]   = useState(false)
  const [expandedId, setExpandedId]       = useState<string | null>(null)
  const [sortCol, setSortCol]             = useState<'datePublished' | 'outlet' | 'sentiment' | 'title'>('datePublished')
  const [sortDir, setSortDir]             = useState<'asc' | 'desc'>('desc')

  async function handleScan() {
    if (!candidateId) return
    setScanning(true); setScanStatus('Scanning Google News…')
    try {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          opponentName: opponentName || undefined,
          hotButtonTopics: hotTopics ? hotTopics.split(',').map(t => t.trim()).filter(Boolean) : undefined,
        }),
      })
      const data = await res.json()
      if (res.ok) {
        const aiNote = data.aiEnabled ? '' : ' · ⚠️ Add API key for AI summaries'
        setScanStatus(`✔ ${data.ingested} new articles · ${data.skipped} already tracked${data.errors ? ` · ${data.errors} errors` : ''}${aiNote}`)
        await refreshArticles()
      } else {
        setScanStatus(`✘ Error: ${data.error}`)
      }
    } catch { setScanStatus('✘ Scan failed.') }
    finally { setScanning(false) }
  }

  async function handleClearAll() {
    setClearing(true)
    try {
      await fetch('/api/articles', { method: 'DELETE' })
      setBuckets({ CandidateCoverage: [], OpponentCoverage: [], GeneralRace: [], HotButtons: [] })
      setScanStatus('✔ All articles cleared.')
    } catch { setScanStatus('✘ Clear failed.') }
    finally { setClearing(false); setConfirmClear(false) }
  }

  async function handleBackfill() {
    setBackfilling(true); setScanStatus('Generating AI summaries for existing articles…')
    try {
      const res = await fetch('/api/summarize-pending', { method: 'POST' })
      const data = await res.json()
      setScanStatus(`✔ ${data.updated} summaries generated${data.errors ? ` · ${data.errors} errors` : ''}${data.remaining > 0 ? ` · ${data.remaining} still pending` : ''}`)
      await refreshArticles()
    } catch { setScanStatus('✘ Summary generation failed.') }
    finally { setBackfilling(false) }
  }

  async function refreshArticles() {
    const updated = await fetch('/api/articles?limit=200').then(r => r.json())
    const grouped: Record<string, ArticleWithOutlet[]> = {
      CandidateCoverage: [], OpponentCoverage: [], GeneralRace: [], HotButtons: [],
    }
    for (const a of updated) if (a.bucket && grouped[a.bucket]) grouped[a.bucket].push(a)
    setBuckets(grouped)
  }

  function toggleSort(col: typeof sortCol) {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  function toggleExpand(id: string) {
    setExpandedId(prev => prev === id ? null : id)
  }

  const articles = [...(buckets[activeTab] ?? [])].sort((a, b) => {
    let av: string, bv: string
    if      (sortCol === 'datePublished') { av = a.datePublished.toString(); bv = b.datePublished.toString() }
    else if (sortCol === 'outlet')        { av = a.outlet.name; bv = b.outlet.name }
    else if (sortCol === 'sentiment')     { av = a.sentiment ?? ''; bv = b.sentiment ?? '' }
    else                                  { av = a.title; bv = b.title }
    return sortDir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av)
  })

  const SortBtn = ({ col, label }: { col: typeof sortCol; label: string }) => (
    <button onClick={() => toggleSort(col)}
      className="flex items-center gap-1 hover:text-gold-400 transition-colors focus:outline-none font-bold text-xs uppercase tracking-wider">
      {label}
      <span className="opacity-60 text-[10px]">{sortCol === col ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}</span>
    </button>
  )

  const pendingCount = Object.values(buckets).flat().filter(a => !a.summary).length
  const activeTabConfig = TABS.find(t => t.key === activeTab) ?? TABS[0]

  return (
    <div className="space-y-6">

      {/* Scan Panel */}
      <div className="relative bg-hero-gradient rounded-2xl overflow-hidden shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute top-3 right-5 text-white opacity-10 text-5xl select-none">★★★</div>
        <div className="relative p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-gold-400 text-lg">★</span>
            <h2 className="font-display font-bold text-white text-xl tracking-wide">Intelligence Scan</h2>
          </div>
          <p className="text-blue-300 text-sm mb-5">Monitor every story. Track every opponent move. Stay ahead of the news cycle.</p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="scan-candidate" className="block text-xs font-bold uppercase tracking-widest text-gold-400 mb-1.5">Your Candidate</label>
              <select id="scan-candidate" value={candidateId} onChange={e => setCandidateId(e.target.value)}
                className="w-full bg-navy-500 border border-navy-300 text-white rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400">
                <option value="">— select candidate —</option>
                {candidates.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="scan-opponent" className="block text-xs font-bold uppercase tracking-widest text-red-300 mb-1.5">Opponent</label>
              <input id="scan-opponent" type="text" value={opponentName} onChange={e => setOpponentName(e.target.value)}
                placeholder="e.g. John Smith"
                className="w-full bg-navy-500 border border-navy-300 text-white placeholder-blue-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400" />
            </div>
            <div className="lg:col-span-2">
              <label htmlFor="scan-topics" className="block text-xs font-bold uppercase tracking-widest text-orange-300 mb-1.5">Hot Button Topics</label>
              <input id="scan-topics" type="text" value={hotTopics} onChange={e => setHotTopics(e.target.value)}
                placeholder="healthcare, immigration, economy, education…"
                className="w-full bg-navy-500 border border-navy-300 text-white placeholder-blue-400 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gold-400" />
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-3 mt-5">
            <button onClick={handleScan} disabled={!candidateId || scanning} aria-busy={scanning}
              className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-bold px-7 py-2.5 rounded-lg text-sm tracking-widest uppercase shadow-glow-red transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400">
              {scanning
                ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Scanning…</span>
                : '★ Scan Google News'}
            </button>

            {pendingCount > 0 && (
              <button onClick={handleBackfill} disabled={backfilling} aria-busy={backfilling}
                className="border border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-navy font-bold px-5 py-2.5 rounded-lg text-sm tracking-wide transition-colors disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-gold-400">
                {backfilling
                  ? <span className="flex items-center gap-2"><span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin inline-block" />Generating…</span>
                  : `⚡ Generate ${pendingCount} Missing Summaries`}
              </button>
            )}

            {confirmClear ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-red-300">Remove all articles?</span>
                <button onClick={handleClearAll} disabled={clearing}
                  className="text-xs bg-red-500 hover:bg-red-600 text-white font-bold px-3 py-1.5 rounded-lg disabled:opacity-50">
                  {clearing ? '…' : 'Yes, clear all'}
                </button>
                <button onClick={() => setConfirmClear(false)}
                  className="text-xs text-blue-300 hover:text-white px-2 py-1.5">
                  Cancel
                </button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)}
                className="text-xs text-red-300 hover:text-red-200 font-semibold border border-red-400 border-opacity-40 px-3 py-2 rounded-lg transition-colors">
                🗑 Clear All
              </button>
            )}

            {scanStatus && (
              <p className={`text-sm font-medium ${scanStatus.startsWith('✔') ? 'text-green-400' : scanStatus.startsWith('✘') ? 'text-red-300' : 'text-blue-300'}`}
                role="status" aria-live="polite">{scanStatus}</p>
            )}
          </div>
        </div>
      </div>

      {/* Tabs + Table */}
      <div className="bg-white rounded-2xl shadow-patriot overflow-hidden border-2 border-gray-100">

        {/* Tab Bar */}
        <div className="flex border-b-2 border-gray-100 bg-gray-50 overflow-x-auto" role="tablist">
          {TABS.map(tab => {
            const count = buckets[tab.key]?.length ?? 0
            const isActive = activeTab === tab.key
            return (
              <button key={tab.key} role="tab" aria-selected={isActive}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-5 py-4 text-sm font-bold border-b-[3px] whitespace-nowrap transition-all focus:outline-none ${
                  isActive
                    ? `border-current ${tab.color} bg-white`
                    : 'border-transparent text-gray-400 hover:text-gray-600 hover:bg-white'
                }`}>
                <span>{tab.icon}</span>
                <span className="hidden sm:inline">{tab.label}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-bold ${isActive ? tab.badge : 'bg-gray-200 text-gray-500'}`}>
                  {count}
                </span>
              </button>
            )
          })}
        </div>

        {/* Table header label */}
        <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">{activeTabConfig.icon}</span>
            <span className={`font-bold text-sm ${activeTabConfig.color}`}>{activeTabConfig.label}</span>
            <span className="text-gray-400 text-xs">— {articles.length} article{articles.length !== 1 ? 's' : ''}</span>
          </div>
          <span className="text-xs text-gray-400 hidden sm:block">Click column headers to sort · Click "What's it about?" to expand</span>
        </div>

        {/* Table */}
        <div role="tabpanel">
          {articles.length === 0 ? (
            <div className="py-16 text-center">
              <div className="text-5xl mb-3 opacity-20">★</div>
              <p className="text-gray-500 font-semibold">No articles in this category yet.</p>
              <p className="text-gray-400 text-sm mt-1">Run a scan above to pull the latest Google News coverage.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-navy text-blue-200">
                    <th className="px-5 py-3 text-left w-[32%]"><SortBtn col="title"         label="Headline" /></th>
                    <th className="px-4 py-3 text-left w-[14%]"><SortBtn col="outlet"        label="Outlet" /></th>
                    <th className="px-4 py-3 text-left w-[10%]"><SortBtn col="datePublished" label="Date" /></th>
                    <th className="px-4 py-3 text-left w-[11%]"><SortBtn col="sentiment"     label="Sentiment" /></th>
                    <th className="px-4 py-3 text-left w-[13%]">
                      <span className="font-bold text-xs uppercase tracking-wider">Topics</span>
                    </th>
                    <th className="px-4 py-3 text-left w-[20%]">
                      <span className="font-bold text-xs uppercase tracking-wider">Summary</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {articles.map((a, i) => {
                    const topics    = (() => { try { return JSON.parse(a.topics) as string[] } catch { return [] } })()
                    const isOpen    = expandedId === a.id
                    const hasSummary = Boolean(a.summary)

                    return (
                      <React.Fragment key={a.id}>
                        <tr
                          className={`news-row border-b border-gray-100 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'} ${isOpen ? 'bg-navy-100/40' : ''}`}>
                          <td className="px-5 py-3.5 align-top">
                            <a href={a.url} target="_blank" rel="noopener noreferrer"
                              className="font-semibold text-navy hover:text-red-500 transition-colors line-clamp-2 focus:outline-none focus:underline leading-snug">
                              {a.title}
                            </a>
                          </td>
                          <td className="px-4 py-3.5 align-top text-gray-600 text-xs whitespace-nowrap font-medium">{a.outlet.name}</td>
                          <td className="px-4 py-3.5 align-top text-gray-500 text-xs whitespace-nowrap">
                            {new Date(a.datePublished).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}
                          </td>
                          <td className="px-4 py-3.5 align-top"><SentimentBadge sentiment={a.sentiment} /></td>
                          <td className="px-4 py-3.5 align-top">
                            <div className="flex flex-wrap gap-1">
                              {topics.slice(0, 3).map((t: string, ti: number) => (
                                <span key={ti} className="text-xs bg-navy-100 text-navy px-1.5 py-0.5 rounded font-medium">{t}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 align-top">
                            {hasSummary ? (
                              <button
                                onClick={() => toggleExpand(a.id)}
                                aria-expanded={isOpen}
                                className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border transition-all focus:outline-none focus:ring-2 focus:ring-gold-400 ${
                                  isOpen
                                    ? 'bg-navy text-white border-navy'
                                    : 'bg-white text-navy border-navy hover:bg-navy hover:text-white'
                                }`}
                              >
                                <span>{isOpen ? '▲' : '▼'}</span>
                                What&apos;s it about?
                              </button>
                            ) : (
                              <span className="text-xs text-gray-300 italic">No summary yet</span>
                            )}
                          </td>
                        </tr>

                        {/* Expanded summary row */}
                        {isOpen && hasSummary && (
                          <tr key={`${a.id}-expanded`} className="bg-navy-100/30 border-b-2 border-navy-100">
                            <td colSpan={6} className="px-6 py-4">
                              <div className="flex items-start gap-3">
                                <span className="text-gold-500 text-lg mt-0.5 shrink-0">★</span>
                                <div>
                                  <p className="text-xs font-bold uppercase tracking-widest text-navy mb-2">Summary</p>
                                  <p className="text-sm text-gray-700 leading-relaxed">{a.summary}</p>
                                  <button onClick={() => setExpandedId(null)}
                                    className="mt-3 text-xs text-navy hover:text-red-500 font-semibold transition-colors focus:outline-none">
                                    ▲ Collapse
                                  </button>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
