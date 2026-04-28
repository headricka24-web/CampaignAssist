'use client'

import { useState } from 'react'
import type { Bin, Candidate } from '@prisma/client'

type BinWithMeta = Bin & { candidate: Candidate; _count: { items: number } }

const BRIEF_TYPES = ['DailyDigest', 'IssueBrief', 'Newsletter'] as const
const EXPORT_FORMATS = ['Markdown', 'CSV', 'JSON'] as const

export default function BriefingStudio({ bins }: { bins: BinWithMeta[] }) {
  const [selectedBin, setSelectedBin] = useState('')
  const [briefType, setBriefType]     = useState<string>('DailyDigest')
  const [topic, setTopic]             = useState('')
  const [output, setOutput]           = useState('')
  const [loading, setLoading]         = useState(false)
  const [status, setStatus]           = useState('')

  async function generateBrief() {
    setLoading(true); setStatus(''); setOutput('')
    try {
      const res = await fetch('/api/briefs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ binId: selectedBin, type: briefType, topic: topic || undefined }),
      })
      const data = await res.json()
      if (res.ok) { setOutput(data.content); setStatus('Brief generated.') }
      else setStatus(`Error: ${data.error}`)
    } finally { setLoading(false) }
  }

  async function exportBin(format: string) {
    const res = await fetch('/api/export', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ binId: selectedBin, format }),
    })
    if (!res.ok) { setStatus('Export failed.'); return }
    const blob = await res.blob()
    const cd = res.headers.get('Content-Disposition') ?? ''
    const filename = cd.match(/filename="([^"]+)"/)?.[1] ?? `export.${format.toLowerCase()}`
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-1 space-y-5">
        <div className="bg-white border border-gray-200 rounded-lg p-5">
          <h2 className="font-semibold text-gray-700 mb-3">Select Bin</h2>
          <select
            value={selectedBin}
            onChange={e => setSelectedBin(e.target.value)}
            aria-label="Select bin"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">— choose a bin —</option>
            {bins.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.candidate.name}, {b._count.items} items)
              </option>
            ))}
          </select>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
          <h2 className="font-semibold text-gray-700">Generate Brief</h2>
          <div>
            <label htmlFor="brief-type" className="block text-xs font-medium text-gray-600 mb-1">Type</label>
            <select id="brief-type" value={briefType} onChange={e => setBriefType(e.target.value)}
              className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
              {BRIEF_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          {briefType === 'IssueBrief' && (
            <div>
              <label htmlFor="brief-topic" className="block text-xs font-medium text-gray-600 mb-1">Topic</label>
              <input id="brief-topic" type="text" value={topic} onChange={e => setTopic(e.target.value)}
                placeholder="e.g. healthcare, economy"
                className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
            </div>
          )}
          <button
            onClick={generateBrief}
            disabled={!selectedBin || loading}
            aria-busy={loading}
            className="w-full bg-brand-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            {loading ? 'Generating…' : 'Generate'}
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-2">
          <h2 className="font-semibold text-gray-700 mb-2">Export Bin</h2>
          {EXPORT_FORMATS.map(f => (
            <button key={f} onClick={() => exportBin(f)} disabled={!selectedBin}
              className="w-full border border-gray-300 text-gray-700 px-3 py-1.5 rounded text-sm hover:border-brand-500 hover:text-brand-600 disabled:opacity-50 focus:outline-none focus:ring-2 focus:ring-brand-500">
              Export {f}
            </button>
          ))}
        </div>

        {status && <p className="text-sm text-gray-600" role="status" aria-live="polite">{status}</p>}
      </div>

      <div className="md:col-span-2">
        <div className="bg-white border border-gray-200 rounded-lg p-5 min-h-64">
          <h2 className="font-semibold text-gray-700 mb-3">Output</h2>
          {output ? (
            <pre className="whitespace-pre-wrap text-sm text-gray-800 font-mono leading-relaxed">{output}</pre>
          ) : (
            <p className="text-gray-400 text-sm">Generated content will appear here.</p>
          )}
        </div>
      </div>
    </div>
  )
}
