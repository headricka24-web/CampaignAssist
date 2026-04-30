'use client'

import { useState, useRef } from 'react'

// ── Types ─────────────────────────────────────────────────────────────────────

type Step = 'drop' | 'map' | 'processing' | 'summary'

type ImportSummary = {
  total:           number
  withPhone:       number
  withEmail:       number
  topSegments:     Array<{ name: string; count: number }>
  suggestedAction: string
}

// ── Voter field targets ───────────────────────────────────────────────────────

const VOTER_FIELDS = [
  { key: 'firstName',    label: 'First Name'     },
  { key: 'lastName',     label: 'Last Name'      },
  { key: 'address',      label: 'Address'        },
  { key: 'city',         label: 'City'           },
  { key: 'zip',          label: 'Zip Code'       },
  { key: 'phone',        label: 'Phone'          },
  { key: 'email',        label: 'Email'          },
  { key: 'party',        label: 'Party'          },
  { key: 'supportLevel', label: 'Support Level'  },
  { key: 'turnoutScore', label: 'Turnout Score'  },
  { key: 'precinct',     label: 'Precinct'       },
  { key: 'notes',        label: 'Notes'          },
  { key: 'tags',         label: 'Tags / Issues'  },
]

const AUTO_DETECT: Record<string, string[]> = {
  firstName:    ['first', 'fname', 'first_name', 'firstname', 'first name'],
  lastName:     ['last', 'lname', 'last_name', 'lastname', 'last name', 'surname'],
  address:      ['address', 'addr', 'street', 'res_address', 'residential'],
  city:         ['city', 'town', 'municipality'],
  zip:          ['zip', 'postal', 'zipcode', 'zip_code', 'zip code'],
  phone:        ['phone', 'cell', 'mobile', 'telephone', 'phone_number'],
  email:        ['email', 'e-mail', 'email_address'],
  party:        ['party', 'affiliation', 'party_affiliation', 'party affiliation', 'reg_party'],
  supportLevel: ['support', 'support_level', 'supportlevel', 'score', 'candidate_score'],
  turnoutScore: ['turnout', 'turnout_score', 'turnoutscore', 'voter_score', 'participation'],
  precinct:     ['precinct', 'pct', 'ward', 'district'],
  notes:        ['notes', 'comments', 'remarks', 'memo'],
  tags:         ['tags', 'issues', 'interests', 'issue_flags'],
}

function autoDetect(headers: string[]): Record<string, string> {
  const mappings: Record<string, string> = {}
  for (const [field, patterns] of Object.entries(AUTO_DETECT)) {
    for (const header of headers) {
      const h = header.toLowerCase().trim()
      if (patterns.some(p => h === p || h.includes(p))) {
        mappings[field] = header
        break
      }
    }
  }
  return mappings
}

// ── Client-side CSV parse (preview only) ─────────────────────────────────────

function parseCSVPreview(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split('\n').filter(l => l.trim())
  const parseLine = (line: string): string[] => {
    const result: string[] = []
    let cur = '', inQ = false
    for (const ch of line) {
      if (ch === '"') inQ = !inQ
      else if (ch === ',' && !inQ) { result.push(cur.trim()); cur = '' }
      else cur += ch
    }
    result.push(cur.trim())
    return result
  }
  return {
    headers: parseLine(lines[0] ?? ''),
    rows:    lines.slice(1, 4).map(parseLine),
  }
}

// ── Shared styles ─────────────────────────────────────────────────────────────

const selectCls = 'w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-navy bg-white focus:outline-none focus:ring-1 focus:ring-gold-400'

// ── Component ─────────────────────────────────────────────────────────────────

export default function VoterUpload({ onComplete }: { onComplete: () => void }) {
  const [step,      setStep]     = useState<Step>('drop')
  const [dragOver,  setDragOver] = useState(false)
  const [file,      setFile]     = useState<File | null>(null)
  const [headers,   setHeaders]  = useState<string[]>([])
  const [preview,   setPreview]  = useState<string[][]>([])
  const [mappings,  setMappings] = useState<Record<string, string>>({})
  const [error,     setError]    = useState('')
  const [summary,   setSummary]  = useState<ImportSummary | null>(null)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(f: File) {
    setFile(f)
    setError('')
    const reader = new FileReader()
    reader.onload = e => {
      const text = e.target?.result as string ?? ''
      const { headers: h, rows } = parseCSVPreview(text)
      setHeaders(h)
      setPreview(rows)
      setMappings(autoDetect(h))
      setStep('map')
    }
    reader.readAsText(f)
  }

  async function startImport() {
    if (!file) return
    setStep('processing')
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('mappings', JSON.stringify(mappings))
      const res  = await fetch('/api/voters/upload', { method: 'POST', body: fd })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Import failed')
      setSummary(data)
      setStep('summary')
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Import failed')
      setStep('map')
    }
  }

  const mappedCount = Object.values(mappings).filter(Boolean).length

  // ── Step: Drop ──────────────────────────────────────────────────────────────
  if (step === 'drop') {
    return (
      <div className="space-y-4">
        <div>
          <h2 className="font-display font-black text-navy text-lg mb-1">Upload Voter File</h2>
          <p className="text-sm text-gray-400">CSV or XLSX — voter rolls, VAN exports, county data, any spreadsheet.</p>
        </div>
        <label
          className={`flex flex-col items-center justify-center gap-4 w-full border-2 border-dashed rounded-2xl py-14 cursor-pointer transition-all ${dragOver ? 'border-gold-400 bg-gold-50' : 'border-gray-200 hover:border-gold-300 hover:bg-gray-50'}`}
          onDragOver={e => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
        >
          <input ref={fileRef} type="file" className="hidden" accept=".csv,.xlsx,.xls"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <span className="text-5xl opacity-30">🗳️</span>
          <div className="text-center">
            <p className="font-bold text-navy">Drag & drop your voter file here</p>
            <p className="text-sm text-gray-400 mt-1">or click to browse — CSV or XLSX</p>
          </div>
          <div className="flex gap-2">
            {['First Name', 'Party', 'Phone', 'Turnout Score'].map(f => (
              <span key={f} className="text-[10px] font-black uppercase tracking-widest bg-navy/10 text-navy px-2 py-1 rounded-full">{f}</span>
            ))}
            <span className="text-[10px] text-gray-400 self-center">+ more</span>
          </div>
        </label>
        {error && <p className="text-sm text-red-500">{error}</p>}
      </div>
    )
  }

  // ── Step: Map ───────────────────────────────────────────────────────────────
  if (step === 'map') {
    return (
      <div className="space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display font-black text-navy text-lg mb-1">Map Your Columns</h2>
            <p className="text-sm text-gray-400">
              We auto-detected {mappedCount} field{mappedCount !== 1 ? 's' : ''} from <span className="font-bold text-navy">{file?.name}</span>. Adjust any mismatches below.
            </p>
          </div>
          <button onClick={() => { setStep('drop'); setFile(null); setHeaders([]) }}
            className="text-xs text-gray-400 hover:text-navy transition-colors whitespace-nowrap">← Change file</button>
        </div>

        {/* Preview table */}
        {preview.length > 0 && (
          <div className="overflow-x-auto rounded-xl border border-gray-100">
            <table className="text-[11px] w-full">
              <thead className="bg-gray-50">
                <tr>{headers.map(h => <th key={h} className="px-3 py-2 text-left font-black text-gray-500 uppercase tracking-widest whitespace-nowrap">{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i} className="border-t border-gray-50">
                    {row.map((cell, j) => <td key={j} className="px-3 py-1.5 text-gray-600 max-w-[120px] truncate">{cell || <span className="text-gray-300">—</span>}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Field mapping grid */}
        <div className="grid sm:grid-cols-2 gap-3">
          {VOTER_FIELDS.map(({ key, label }) => (
            <div key={key} className="flex items-center gap-2">
              <span className="text-[11px] font-black text-gray-500 w-28 shrink-0 uppercase tracking-wide">{label}</span>
              <select
                className={selectCls}
                value={mappings[key] ?? ''}
                onChange={e => setMappings(m => ({ ...m, [key]: e.target.value }))}
              >
                <option value="">— Skip —</option>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        {(!mappings.firstName && !mappings.lastName) && (
          <p className="text-xs text-yellow-600 bg-yellow-50 rounded-xl px-4 py-2">
            Map at least First Name or Last Name to continue.
          </p>
        )}

        <button
          onClick={startImport}
          disabled={!mappings.firstName && !mappings.lastName}
          className="w-full bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-black uppercase tracking-widest py-3.5 rounded-xl text-sm transition-all">
          Import Voters →
        </button>
      </div>
    )
  }

  // ── Step: Processing ────────────────────────────────────────────────────────
  if (step === 'processing') {
    return (
      <div className="py-16 flex flex-col items-center gap-5 text-center">
        <span className="w-12 h-12 border-4 border-gold-400 border-t-transparent rounded-full animate-spin" />
        <div>
          <p className="font-display font-black text-navy text-lg">Importing & Segmenting…</p>
          <p className="text-sm text-gray-400 mt-1">Claude is analyzing voter notes for issue tags. Large files may take a moment.</p>
        </div>
      </div>
    )
  }

  // ── Step: Summary ───────────────────────────────────────────────────────────
  if (step === 'summary' && summary) {
    const pctPhone = summary.total > 0 ? Math.round((summary.withPhone / summary.total) * 100) : 0
    const pctEmail = summary.total > 0 ? Math.round((summary.withEmail / summary.total) * 100) : 0

    return (
      <div className="space-y-6">
        <div className="text-center">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="font-display font-black text-navy text-2xl">Import Complete</h2>
          <p className="text-sm text-gray-400 mt-1">{summary.total.toLocaleString()} voters are ready for outreach</p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'Voters Imported', value: summary.total.toLocaleString(), icon: '👤', accent: 'border-navy-100' },
            { label: 'Have Phones',     value: `${summary.withPhone.toLocaleString()} (${pctPhone}%)`, icon: '📞', accent: 'border-green-100' },
            { label: 'Have Emails',     value: `${summary.withEmail.toLocaleString()} (${pctEmail}%)`, icon: '📧', accent: 'border-blue-100' },
          ].map(stat => (
            <div key={stat.label} className={`bg-white rounded-2xl border-2 ${stat.accent} p-4 text-center`}>
              <p className="text-2xl mb-1">{stat.icon}</p>
              <p className="font-display font-black text-navy text-xl">{stat.value}</p>
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Top segments */}
        {summary.topSegments.length > 0 && (
          <div className="bg-white rounded-2xl border-2 border-gray-100 p-5">
            <h3 className="font-display font-black text-navy text-xs uppercase tracking-widest mb-3">Top Segments Found</h3>
            <div className="space-y-2">
              {summary.topSegments.map(seg => (
                <div key={seg.name} className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-xs font-bold text-navy">{seg.name}</span>
                    <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-navy to-blue-500 rounded-full"
                        style={{ width: `${Math.min(100, Math.round((seg.count / summary.total) * 100))}%` }} />
                    </div>
                  </div>
                  <span className="text-xs font-black text-gray-500 shrink-0">{seg.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested action */}
        <div className="bg-gradient-to-r from-navy to-blue-700 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl shrink-0">⚡</span>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-gold-400 mb-1">Suggested First Action</p>
              <p className="text-sm text-white leading-relaxed">{summary.suggestedAction}</p>
            </div>
          </div>
        </div>

        <button onClick={onComplete}
          className="w-full bg-gold-400 hover:bg-gold-500 text-navy font-black uppercase tracking-widest py-3.5 rounded-xl text-sm transition-all">
          View Voter List →
        </button>
      </div>
    )
  }

  return null
}
