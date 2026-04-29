'use client'

import { useState } from 'react'
import RichText from './RichText'

type Threat = {
  raw: string
  threat: string
  severity: 'HIGH' | 'MEDIUM' | 'LOW'
  angle: string
  why: string
}

function parseThreat(block: string): Threat {
  const get = (label: string) =>
    block.match(new RegExp(`${label}:\\s*(.+)`, 'i'))?.[1]?.trim() ?? ''
  const sev = get('SEVERITY').toUpperCase()
  return {
    raw:      block.trim(),
    threat:   get('THREAT'),
    severity: (sev === 'HIGH' || sev === 'MEDIUM' || sev === 'LOW') ? sev as Threat['severity'] : 'MEDIUM',
    angle:    get('ANGLE'),
    why:      get('WHY IT MATTERS'),
  }
}

const SEV_STYLE: Record<Threat['severity'], { badge: string; border: string; bar: string; icon: string }> = {
  HIGH:   { badge: 'bg-red-100 text-red-700',    border: 'border-red-200',    bar: 'from-red-500 to-red-700',      icon: '🚨' },
  MEDIUM: { badge: 'bg-yellow-100 text-yellow-700', border: 'border-yellow-200', bar: 'from-yellow-400 to-orange-500', icon: '⚠️' },
  LOW:    { badge: 'bg-blue-100 text-blue-700',   border: 'border-blue-200',   bar: 'from-blue-400 to-blue-600',    icon: '👁' },
}

function ResponseModal({ threat, onClose }: { threat: Threat; onClose: () => void }) {
  const [response, setResponse] = useState('')
  const [loading,  setLoading]  = useState(false)
  const [copied,   setCopied]   = useState(false)

  async function generate() {
    setLoading(true)
    try {
      const res  = await fetch('/api/war-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'respond', threat: threat.raw }),
      })
      const data = await res.json()
      if (data.response) setResponse(data.response)
    } finally { setLoading(false) }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-navy/70 backdrop-blur-sm" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="h-1.5 bg-gradient-to-r from-red-500 to-gold-400" />
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h2 className="font-display font-black text-sm uppercase tracking-wide text-navy">Rapid Response</h2>
            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{threat.threat}</p>
          </div>
          <div className="flex items-center gap-2">
            {response && (
              <button
                onClick={() => { navigator.clipboard.writeText(response); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                className="text-xs font-bold px-3 py-1.5 rounded-lg bg-navy text-white hover:bg-navy-700"
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            )}
            <button onClick={onClose} className="text-xl text-gray-300 hover:text-navy leading-none">✕</button>
          </div>
        </div>
        <div className="overflow-y-auto p-6">
          {!response && !loading && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">⚡</div>
              <p className="text-gray-500 text-sm mb-4">Generate a rapid-response package for this threat.</p>
              <button onClick={generate}
                className="bg-red-500 hover:bg-red-600 text-white font-black uppercase tracking-widest px-6 py-3 rounded-xl text-sm shadow-glow-red transition-colors">
                Generate Counter-Response
              </button>
            </div>
          )}
          {loading && (
            <div className="flex items-center justify-center py-12 gap-3">
              <span className="w-5 h-5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Drafting response…</span>
            </div>
          )}
          {response && <RichText text={response} />}
          {response && (
            <button onClick={generate} disabled={loading}
              className="mt-4 text-xs text-gray-400 hover:text-navy font-bold border border-gray-200 hover:border-navy px-3 py-1.5 rounded-lg transition-colors">
              ↺ Regenerate
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function ThreatCard({ threat, index }: { threat: Threat; index: number }) {
  const s = SEV_STYLE[threat.severity]
  const [showResponse, setShowResponse] = useState(false)

  return (
    <>
      <div className={`bg-white rounded-2xl border-2 ${s.border} shadow-sm overflow-hidden`}>
        <div className={`h-1.5 bg-gradient-to-r ${s.bar}`} />
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">{s.icon}</span>
              <span className={`text-xs font-black uppercase tracking-widest px-2.5 py-1 rounded-full ${s.badge}`}>
                {threat.severity} THREAT
              </span>
              <span className="text-xs text-gray-300 font-bold">#{index + 1}</span>
            </div>
          </div>

          <h3 className="font-display font-black text-navy text-sm leading-snug mb-3">{threat.threat}</h3>

          <div className="space-y-2 mb-4">
            <div className="bg-gray-50 rounded-xl px-4 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">How They'll Attack</p>
              <p className="text-xs text-gray-700">{threat.angle}</p>
            </div>
            <div className="bg-red-50 rounded-xl px-4 py-2.5">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-1">Why It Matters</p>
              <p className="text-xs text-gray-700">{threat.why}</p>
            </div>
          </div>

          <button
            onClick={() => setShowResponse(true)}
            className="w-full bg-navy hover:bg-navy-700 text-white font-black uppercase tracking-widest text-xs py-2.5 rounded-xl transition-colors"
          >
            ⚡ Generate Response
          </button>
        </div>
      </div>

      {showResponse && <ResponseModal threat={threat} onClose={() => setShowResponse(false)} />}
    </>
  )
}

export default function WarRoom() {
  const [threats,  setThreats]  = useState<Threat[]>([])
  const [loading,  setLoading]  = useState(false)
  const [error,    setError]    = useState('')
  const [scanned,  setScanned]  = useState(false)

  async function handleScan() {
    setLoading(true)
    setError('')
    try {
      const res  = await fetch('/api/war-room', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'scan' }),
      })
      const data = await res.json()
      if (data.error) { setError('No threat data found. Try again shortly.'); return }
      const blocks = (data.threats as string).split('---').map((b: string) => b.trim()).filter(Boolean)
      setThreats(blocks.map(parseThreat))
      setScanned(true)
    } catch { setError('Scan failed. Check your connection.') }
    finally { setLoading(false) }
  }

  const highCount   = threats.filter(t => t.severity === 'HIGH').length
  const medCount    = threats.filter(t => t.severity === 'MEDIUM').length

  return (
    <div className="space-y-8">

      {/* Hero */}
      <div className="relative rounded-2xl overflow-hidden bg-hero-gradient shadow-patriot">
        <div className="absolute inset-0 bg-stripe-pattern opacity-40" />
        <div className="absolute inset-0 flex items-center justify-end pr-12 pointer-events-none select-none">
          <span className="text-white opacity-[0.03] text-[200px] font-black leading-none">⚡</span>
        </div>
        <div className="relative px-8 py-10">
          <div className="inline-flex items-center gap-2 bg-red-500 text-white text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-4">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Threat Intelligence
          </div>
          <h1 className="font-display text-5xl font-black text-white leading-tight mb-2">
            The <span className="text-gold-400">War Room.</span>
          </h1>
          <p className="text-blue-200 text-lg max-w-xl mb-6">
            Stay ahead of attacks before they land. We scan today's news for every angle the opposition could use — then arm you with a counter-punch.
          </p>
          <button onClick={handleScan} disabled={loading}
            className="bg-red-500 hover:bg-red-600 disabled:opacity-50 text-white font-black px-8 py-3 rounded-xl text-sm tracking-widest uppercase shadow-glow-red transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400">
            {loading
              ? <span className="flex items-center gap-2"><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block" />Scanning for threats…</span>
              : scanned ? '↺ Rescan Threats' : '🚨 Scan for Threats'}
          </button>
          {error && <p className="mt-3 text-red-300 text-sm">{error}</p>}
        </div>
      </div>

      {/* Threat summary bar */}
      {scanned && threats.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl border-2 border-red-100 p-4 text-center">
            <div className="text-3xl font-black text-red-600">{highCount}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-red-400 mt-1">High Threats</div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-yellow-100 p-4 text-center">
            <div className="text-3xl font-black text-yellow-600">{medCount}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-yellow-500 mt-1">Medium Threats</div>
          </div>
          <div className="bg-white rounded-2xl border-2 border-navy-100 p-4 text-center">
            <div className="text-3xl font-black text-navy">{threats.length}</div>
            <div className="text-xs font-bold uppercase tracking-widest text-navy-400 mt-1">Total Flags</div>
          </div>
        </div>
      )}

      {/* Threat cards */}
      {threats.length > 0 && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <div className="h-px flex-1 bg-gradient-to-r from-red-200 to-transparent" />
            <h2 className="text-xs font-black uppercase tracking-[0.3em] text-red-400">Active Threats</h2>
            <div className="h-px flex-1 bg-gradient-to-l from-red-200 to-transparent" />
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {threats.map((t, i) => <ThreatCard key={i} threat={t} index={i} />)}
          </div>
        </div>
      )}

      {/* Empty state before scan */}
      {!scanned && !loading && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-gray-200 py-16 text-center">
          <div className="text-5xl mb-4 opacity-30">🚨</div>
          <p className="text-gray-500 font-semibold">No scan run yet.</p>
          <p className="text-gray-400 text-sm mt-1">Hit the button above to scan today's news for attack opportunities.</p>
        </div>
      )}
    </div>
  )
}
