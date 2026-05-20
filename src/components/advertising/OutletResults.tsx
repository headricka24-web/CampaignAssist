'use client'

import { useState } from 'react'
import { usePersistedContent } from '@/lib/usePersistedContent'

// ── Add to Press Contacts ─────────────────────────────────────────────────────

function AddContactButton({
  outlet, beat, added, onAdded,
}: {
  outlet: string; beat: string; added: boolean; onAdded: (outlet: string) => void
}) {
  const [state, setState] = useState<'idle' | 'adding'>(added ? 'idle' : 'idle')

  async function add() {
    if (added) return
    setState('adding')
    try {
      await fetch('/api/press-contacts', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ name: `${outlet} Reporter`, outlet, beat, role: 'Reporter' }),
      })
      onAdded(outlet)
    } catch { setState('idle') }
  }

  const done = added
  return (
    <button
      onClick={add}
      disabled={done || state === 'adding'}
      className={`ml-2 text-[10px] font-bold px-2 py-0.5 rounded-lg transition-colors whitespace-nowrap ${
        done
          ? 'bg-green-100 text-green-700 cursor-default'
          : 'bg-navy/10 text-navy hover:bg-navy hover:text-white'
      }`}
    >
      {done ? '✓ Added' : state === 'adding' ? '…' : '+ Contacts'}
    </button>
  )
}

// ── Outlet section config ─────────────────────────────────────────────────────

const SECTION_STYLES: Record<string, { icon: string; color: string; bg: string; border: string; bar: string }> = {
  'TELEVISION': { icon: '📺', color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-100',    bar: 'bg-red-500'    },
  'RADIO':      { icon: '📻', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-100',   bar: 'bg-blue-500'   },
  'DIGITAL':    { icon: '💻', color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-100', bar: 'bg-violet-500' },
  'STREAMING':  { icon: '💻', color: 'text-violet-700', bg: 'bg-violet-50',  border: 'border-violet-100', bar: 'bg-violet-500' },
  'NEWSPAPER':  { icon: '📰', color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-100',  bar: 'bg-amber-500'  },
  'PRINT':      { icon: '📰', color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-100',  bar: 'bg-amber-500'  },
  'HYPERLOCAL': { icon: '🏘️', color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-100',bar: 'bg-emerald-500'},
  'COMMUNITY':  { icon: '🏘️', color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-100',bar: 'bg-emerald-500'},
  'TIP':        { icon: '💡', color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-100', bar: 'bg-orange-400' },
  'BUYING':     { icon: '💡', color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-100', bar: 'bg-orange-400' },
}

const DEFAULT_STYLE = { icon: '📋', color: 'text-navy', bg: 'bg-gray-50', border: 'border-gray-100', bar: 'bg-gray-400' }

function getSectionStyle(title: string) {
  const upper = title.toUpperCase()
  for (const [key, style] of Object.entries(SECTION_STYLES)) {
    if (upper.includes(key)) return style
  }
  return DEFAULT_STYLE
}

// ── Text inline formatting ────────────────────────────────────────────────────

function inlineFormat(text: string): React.ReactNode[] {
  // Handle **bold** and *italic*
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={i} className="font-bold text-gray-900">{part.slice(2, -2)}</strong>
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return <em key={i}>{part.slice(1, -1)}</em>
    }
    return <span key={i}>{part}</span>
  })
}

// ── Table renderer ────────────────────────────────────────────────────────────

function parseTable(rows: string[]): { headers: string[]; body: string[][] } | null {
  const dataRows = rows.filter(r => !r.match(/^\|[\s\-|]+\|$/))
  if (dataRows.length < 2) return null
  const parse = (row: string) =>
    row.split('|').map(c => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1)
  const [header, ...body] = dataRows
  return { headers: parse(header), body: body.map(parse) }
}

function OutletTable({ rows, beat, addedOutlets, onAdded }: { rows: string[]; beat: string; addedOutlets: Set<string>; onAdded: (outlet: string) => void }) {
  const table = parseTable(rows)
  if (!table) return null
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 mt-3">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            {table.headers.map((h, i) => (
              <th key={i} className="text-left px-4 py-2.5 text-[11px] font-black uppercase tracking-wider text-gray-500 whitespace-nowrap">
                {h}
              </th>
            ))}
            <th className="px-4 py-2.5" />
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {table.body.map((row, ri) => (
            <tr key={ri} className="hover:bg-gray-50/60 transition-colors">
              {row.map((cell, ci) => (
                <td key={ci} className={`px-4 py-3 text-gray-700 leading-snug ${ci === 0 ? 'font-semibold text-navy' : 'text-gray-500 text-[13px]'}`}>
                  {inlineFormat(cell)}
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                {row[0] && (
                  <AddContactButton
                    outlet={row[0].replace(/\*\*/g, '').trim()}
                    beat={beat}
                    added={addedOutlets.has(row[0].replace(/\*\*/g, '').trim())}
                    onAdded={onAdded}
                  />
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Callout renderer ──────────────────────────────────────────────────────────

function Callout({ text }: { text: string }) {
  const clean = text.replace(/^>\s*/, '')
  // Detect if it starts with an emoji warning/tip
  const isWarning = clean.startsWith('⚠') || clean.toLowerCase().includes('must')
  return (
    <div className={`flex gap-3 rounded-xl px-4 py-3 mt-3 ${isWarning ? 'bg-amber-50 border border-amber-200' : 'bg-blue-50 border border-blue-100'}`}>
      <span className="text-base shrink-0 mt-0.5">{isWarning ? '⚠️' : 'ℹ️'}</span>
      <p className={`text-sm leading-relaxed ${isWarning ? 'text-amber-800' : 'text-blue-800'}`}>
        {inlineFormat(clean.replace(/^⚠️?\s*/, ''))}
      </p>
    </div>
  )
}

// ── Section body renderer ─────────────────────────────────────────────────────

function SectionBody({ lines, beat, addedOutlets, onAdded }: { lines: string[]; beat: string; addedOutlets: Set<string>; onAdded: (outlet: string) => void }) {
  const elements: React.ReactNode[] = []
  let tableBuffer: string[] = []
  let bulletBuffer: string[] = []

  function flushTable() {
    if (tableBuffer.length) {
      elements.push(<OutletTable key={elements.length} rows={tableBuffer} beat={beat} addedOutlets={addedOutlets} onAdded={onAdded} />)
      tableBuffer = []
    }
  }
  function flushBullets() {
    if (bulletBuffer.length) {
      elements.push(
        <ul key={elements.length} className="space-y-1.5 mt-3">
          {bulletBuffer.map((b, i) => (
            <li key={i} className="flex gap-2 text-sm text-gray-600 leading-relaxed">
              <span className="text-gray-300 mt-1 shrink-0">•</span>
              <span>{inlineFormat(b.replace(/^[-•]\s*/, ''))}</span>
            </li>
          ))}
        </ul>
      )
      bulletBuffer = []
    }
  }

  // Extract bold outlet name from the start of a bullet, e.g. "**WMUR-TV (ABC)** – ..."
  function extractOutletName(text: string): string | null {
    const m = text.match(/^\*\*([^*]+)\*\*/)
    return m ? m[1].trim() : null
  }

  for (const line of lines) {
    const trimmed = line.trim()
    // Skip blank lines and horizontal rules (--- / ***)
    if (!trimmed || /^[-*_]{2,}$/.test(trimmed)) {
      flushTable()
      flushBullets()
      continue
    }
    if (trimmed.startsWith('|')) {
      flushBullets()
      tableBuffer.push(trimmed)
      continue
    }
    if (trimmed.startsWith('> ') || trimmed.startsWith('>')) {
      flushTable()
      flushBullets()
      elements.push(<Callout key={elements.length} text={trimmed} />)
      continue
    }
    if (trimmed.match(/^[-•]\s/)) {
      flushTable()
      bulletBuffer.push(trimmed)
      continue
    }
    // Plain paragraph
    flushTable()
    flushBullets()
    elements.push(
      <p key={elements.length} className="text-sm text-gray-600 leading-relaxed mt-2">
        {inlineFormat(trimmed)}
      </p>
    )
  }

  flushTable()

  // Render bullets with inline add buttons for bold outlet names
  if (bulletBuffer.length) {
    elements.push(
      <ul key={elements.length} className="space-y-2 mt-3">
        {bulletBuffer.map((b, i) => {
          const raw        = b.replace(/^[-•]\s*/, '')
          const outletName = extractOutletName(raw)
          return (
            <li key={i} className="flex gap-2 text-sm text-gray-600 leading-relaxed items-start">
              <span className="text-gray-300 mt-1 shrink-0">•</span>
              <span className="flex-1">{inlineFormat(raw)}</span>
              {outletName && (
                <span className="shrink-0 mt-0.5">
                  <AddContactButton
                    outlet={outletName}
                    beat={beat}
                    added={addedOutlets.has(outletName)}
                    onAdded={onAdded}
                  />
                </span>
              )}
            </li>
          )
        })}
      </ul>
    )
    bulletBuffer = []
  }

  return <>{elements}</>
}

// ── Section card ──────────────────────────────────────────────────────────────

function SectionCard({ title, lines, addedOutlets, onAdded }: { title: string; lines: string[]; addedOutlets: Set<string>; onAdded: (outlet: string) => void }) {
  const style = getSectionStyle(title)
  return (
    <div className={`rounded-2xl border ${style.border} overflow-hidden`}>
      {/* Color bar */}
      <div className={`h-1 ${style.bar}`} />
      {/* Header */}
      <div className={`flex items-center gap-3 px-5 py-4 ${style.bg}`}>
        <span className="text-xl leading-none">{style.icon}</span>
        <h3 className={`font-black text-sm uppercase tracking-widest ${style.color}`}>{title}</h3>
      </div>
      {/* Body */}
      <div className="px-5 pb-5 pt-1 bg-white">
        <SectionBody lines={lines} beat={title} addedOutlets={addedOutlets} onAdded={onAdded} />
      </div>
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export default function OutletResults({ content, geo }: { content: string; geo?: string }) {
  const [addedList, saveAddedList] = usePersistedContent<string[]>('press-contacts-added', [])
  const addedOutlets = new Set(addedList)

  function handleAdded(outlet: string) {
    const next = [...new Set([...addedList, outlet])]
    saveAddedList(next)
  }

  const lines = content.split('\n')

  // Extract title (first non-empty lines before any ##)
  let titleLines: string[] = []
  let bodyStart = 0
  for (let i = 0; i < lines.length; i++) {
    const t = lines[i].trim()
    if (t.startsWith('##')) { bodyStart = i; break }
    if (t && !t.startsWith('#')) titleLines.push(t)
    bodyStart = i + 1
  }

  // Parse sections
  type Section = { title: string; lines: string[] }
  const sections: Section[] = []
  let currentSection: Section | null = null

  for (let i = bodyStart; i < lines.length; i++) {
    const line = lines[i]
    const trimmed = line.trim()
    if (trimmed.startsWith('## ')) {
      if (currentSection) sections.push(currentSection)
      currentSection = { title: trimmed.replace(/^#+\s*/, ''), lines: [] }
    } else if (currentSection) {
      currentSection.lines.push(line)
    }
  }
  if (currentSection) sections.push(currentSection)

  // Clean title
  const titleText = titleLines
    .join(' ')
    .replace(/[#*_]/g, '')
    .replace(/\s+/g, ' ')
    .trim()

  return (
    <div className="space-y-4">
      {/* Hero title bar */}
      {(titleText || geo) && (
        <div className="rounded-2xl bg-navy px-5 py-4 flex items-center gap-4">
          <div className="w-9 h-9 rounded-full bg-orange-500/20 border border-orange-400/30 flex items-center justify-center text-lg shrink-0">
            📡
          </div>
          <div>
            {titleText && (
              <p className="text-white font-black text-sm leading-tight">
                {titleText}
              </p>
            )}
            {geo && (
              <p className="text-blue-300/60 text-[11px] mt-0.5 uppercase tracking-widest font-bold">
                {geo}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Section cards — skip preamble/title-only sections with no real content */}
      {sections
        .filter(s => s.lines.some(l => l.trim() && !/^[-*_]{2,}$/.test(l.trim())))
        .map((s, i) => (
          <SectionCard key={i} title={s.title} lines={s.lines} addedOutlets={addedOutlets} onAdded={handleAdded} />
        ))}
    </div>
  )
}
