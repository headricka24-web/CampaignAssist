'use client'

import { useState } from 'react'

type AuditFinding = { title: string; detail: string }
type AuditAction  = { priority: number; action: string; why: string }

type AuditResult = {
  grade:     string
  headline:  string
  critical:  AuditFinding[]
  warnings:  AuditFinding[]
  strengths: AuditFinding[]
  actions:   AuditAction[]
}

type AuditResponse = {
  audit:       AuditResult
  generatedAt: string
  dataBlock:   string
}

const GRADE_STYLE: Record<string, { bg: string; text: string; ring: string }> = {
  A:  { bg: 'bg-green-500',  text: 'text-white', ring: 'ring-green-400'  },
  B:  { bg: 'bg-blue-500',   text: 'text-white', ring: 'ring-blue-400'   },
  C:  { bg: 'bg-yellow-500', text: 'text-white', ring: 'ring-yellow-400' },
  D:  { bg: 'bg-orange-500', text: 'text-white', ring: 'ring-orange-400' },
  F:  { bg: 'bg-red-600',    text: 'text-white', ring: 'ring-red-500'    },
}

function gradeStyle(grade: string) {
  const letter = grade[0]?.toUpperCase() ?? 'C'
  return GRADE_STYLE[letter] ?? GRADE_STYLE['C']
}

function FindingCard({ title, detail, variant }: { title: string; detail: string; variant: 'critical' | 'warning' | 'strength' }) {
  const styles = {
    critical: { border: 'border-red-200',    bg: 'bg-red-50',     dot: 'bg-red-500',    label: 'bg-red-100 text-red-700'    },
    warning:  { border: 'border-yellow-200', bg: 'bg-yellow-50',  dot: 'bg-yellow-500', label: 'bg-yellow-100 text-yellow-700'},
    strength: { border: 'border-green-200',  bg: 'bg-green-50',   dot: 'bg-green-500',  label: 'bg-green-100 text-green-700' },
  }[variant]

  return (
    <div className={`rounded-xl border ${styles.border} ${styles.bg} px-4 py-3`}>
      <div className="flex items-start gap-2.5">
        <div className={`w-2 h-2 rounded-full ${styles.dot} shrink-0 mt-1.5`} />
        <div className="flex-1 min-w-0">
          <p className="font-bold text-sm text-navy">{title}</p>
          <p className="text-xs text-gray-600 leading-relaxed mt-0.5">{detail}</p>
        </div>
      </div>
    </div>
  )
}

function ActionCard({ item }: { item: AuditAction }) {
  return (
    <div className="flex gap-3 bg-white rounded-xl border border-navy/10 px-4 py-3 shadow-sm">
      <div className="w-6 h-6 rounded-full bg-navy text-white text-[11px] font-black flex items-center justify-center shrink-0 mt-0.5">
        {item.priority}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm text-navy">{item.action}</p>
        <p className="text-xs text-gray-500 leading-relaxed mt-0.5">{item.why}</p>
      </div>
    </div>
  )
}

export default function FieldOpsAudit() {
  const [result,    setResult]    = useState<AuditResponse | null>(null)
  const [running,   setRunning]   = useState(false)
  const [error,     setError]     = useState<string | null>(null)
  const [showData,  setShowData]  = useState(false)

  async function runAudit() {
    setRunning(true)
    setError(null)
    try {
      const res  = await fetch('/api/field-ops/audit', { method: 'POST' })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? 'Audit failed'); return }
      setResult(json)
    } catch {
      setError('Failed to connect to audit service.')
    } finally {
      setRunning(false)
    }
  }

  if (!result) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] p-8 text-center">
        <div className="w-16 h-16 rounded-2xl bg-navy flex items-center justify-center text-3xl mb-5 shadow-patriot">
          🎯
        </div>
        <h2 className="font-display font-black text-navy text-xl mb-2">Campaign Manager Audit</h2>
        <p className="text-sm text-gray-500 max-w-sm leading-relaxed mb-6">
          Alex Rivera, your on-call field director, will review your voter universe, phone bank progress, and outreach coverage — and tell you exactly what's broken.
        </p>
        {error && (
          <p className="text-sm text-red-500 mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-2">{error}</p>
        )}
        <button
          onClick={runAudit}
          disabled={running}
          className="bg-navy hover:bg-navy-700 disabled:opacity-60 text-white font-black uppercase tracking-widest px-8 py-3.5 rounded-2xl text-sm transition-all flex items-center gap-2 shadow-patriot"
        >
          {running ? (
            <>
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Auditing field ops…
            </>
          ) : (
            '★ Run Field Ops Audit'
          )}
        </button>
        {running && (
          <p className="text-xs text-gray-400 mt-4">Crunching your voter universe, phone bank data, and outreach coverage…</p>
        )}
      </div>
    )
  }

  const { audit, generatedAt, dataBlock } = result
  const gs = gradeStyle(audit.grade)

  return (
    <div className="space-y-5 pb-8">

      {/* Header bar */}
      <div className="bg-navy rounded-2xl px-5 py-4 flex items-center gap-4">
        <div className={`w-14 h-14 rounded-2xl ${gs.bg} ${gs.ring} ring-2 flex items-center justify-center shrink-0`}>
          <span className={`font-display font-black text-2xl ${gs.text}`}>{audit.grade}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-blue-300/70 text-[10px] font-black uppercase tracking-widest mb-0.5">Field Ops Grade</p>
          <p className="text-white font-black text-base leading-snug">{audit.headline}</p>
          <p className="text-blue-300/50 text-[10px] mt-1">
            Audited by Alex Rivera · {new Date(generatedAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
          </p>
        </div>
        <button
          onClick={runAudit}
          disabled={running}
          className="shrink-0 text-[10px] font-black uppercase tracking-widest border border-blue-400/40 text-blue-300 hover:bg-navy-500 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
        >
          {running ? '…' : '⟳ Re-audit'}
        </button>
      </div>

      {/* Critical issues */}
      {audit.critical.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-red-600 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
            Critical Issues ({audit.critical.length})
          </p>
          {audit.critical.map((f, i) => (
            <FindingCard key={i} title={f.title} detail={f.detail} variant="critical" />
          ))}
        </div>
      )}

      {/* Warnings */}
      {audit.warnings.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-yellow-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-yellow-400 inline-block" />
            Needs Attention ({audit.warnings.length})
          </p>
          {audit.warnings.map((f, i) => (
            <FindingCard key={i} title={f.title} detail={f.detail} variant="warning" />
          ))}
        </div>
      )}

      {/* Strengths */}
      {audit.strengths.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-green-700 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500 inline-block" />
            What's Working ({audit.strengths.length})
          </p>
          {audit.strengths.map((f, i) => (
            <FindingCard key={i} title={f.title} detail={f.detail} variant="strength" />
          ))}
        </div>
      )}

      {/* Action items */}
      {audit.actions.length > 0 && (
        <div className="space-y-2">
          <p className="text-[10px] font-black uppercase tracking-widest text-navy flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-navy inline-block" />
            Next Actions
          </p>
          {audit.actions.map((a, i) => (
            <ActionCard key={i} item={a} />
          ))}
        </div>
      )}

      {/* Raw data toggle */}
      <div className="border-t border-gray-100 pt-4">
        <button
          onClick={() => setShowData(v => !v)}
          className="text-[10px] font-bold text-gray-400 hover:text-navy transition-colors uppercase tracking-widest"
        >
          {showData ? '▲ Hide Data Snapshot' : '▼ Show Data Snapshot'}
        </button>
        {showData && (
          <pre className="mt-3 text-[11px] text-gray-500 font-mono bg-gray-50 rounded-xl p-4 overflow-x-auto whitespace-pre-wrap leading-relaxed border border-gray-100">
            {dataBlock}
          </pre>
        )}
      </div>
    </div>
  )
}
