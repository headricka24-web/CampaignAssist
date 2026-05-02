'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Candidate = {
  id:           string
  name:         string
  race:         string
  state:        string
  party:        string
  incumbent:    boolean
  raceLevel:    string | null
  district:     string | null
  county:       string | null
  city:         string | null
  zip:          string | null
  opponentName: string | null
}

const LEVEL_COLORS: Record<string, string> = {
  federal:   'bg-blue-100 text-blue-700',
  state:     'bg-purple-100 text-purple-700',
  county:    'bg-orange-100 text-orange-700',
  municipal: 'bg-green-100 text-green-700',
}

export default function CandidateList({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter()
  const [deleting,  setDeleting]  = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch('/api/candidates', {
      method:  'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ id }),
    })
    setDeleting(null)
    setConfirmId(null)
    router.refresh()
  }

  if (candidates.length === 0) {
    return <p className="text-sm text-gray-400 mt-4">No candidates yet.</p>
  }

  return (
    <ul className="space-y-3">
      {candidates.map(c => {
        const geoDetails = [
          c.district && `District ${c.district}`,
          c.county,
          c.city,
          c.zip,
        ].filter(Boolean).join(' · ')

        return (
          <li key={c.id} className="bg-white border border-gray-200 rounded-xl px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="font-semibold text-navy text-sm">{c.name}</span>
                  {c.incumbent && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Incumbent</span>
                  )}
                  {c.raceLevel && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${LEVEL_COLORS[c.raceLevel] ?? 'bg-gray-100 text-gray-600'}`}>
                      {c.raceLevel}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500">{c.race} · {c.state} · {c.party}</p>
                {geoDetails && (
                  <p className="text-[11px] text-gray-400 mt-0.5">{geoDetails}</p>
                )}
                {c.opponentName && (
                  <p className="text-[11px] text-gray-400">vs. {c.opponentName}</p>
                )}
              </div>

              {confirmId === c.id ? (
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-gray-500">Remove?</span>
                  <button
                    onClick={() => handleDelete(c.id)}
                    disabled={deleting === c.id}
                    className="text-xs bg-red-500 hover:bg-red-600 text-white px-2 py-1 rounded font-semibold disabled:opacity-50"
                  >
                    {deleting === c.id ? '...' : 'Yes, delete'}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="text-xs text-gray-400 hover:text-gray-600 px-2 py-1"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmId(c.id)}
                  className="text-xs text-red-400 hover:text-red-600 font-semibold shrink-0"
                >
                  Remove
                </button>
              )}
            </div>
          </li>
        )
      })}
    </ul>
  )
}
