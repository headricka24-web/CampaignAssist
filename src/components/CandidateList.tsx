'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

type Candidate = {
  id: string
  name: string
  race: string
  state: string
  party: string
  incumbent: boolean
}

export default function CandidateList({ candidates }: { candidates: Candidate[] }) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)

  async function handleDelete(id: string) {
    setDeleting(id)
    await fetch('/api/candidates', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    setDeleting(null)
    setConfirmId(null)
    router.refresh()
  }

  if (candidates.length === 0) {
    return <p className="text-sm text-gray-400 mt-4">No candidates yet.</p>
  }

  return (
    <ul className="mt-4 space-y-2">
      {candidates.map(c => (
        <li key={c.id} className="text-sm bg-white border border-gray-200 rounded px-3 py-2 flex items-center justify-between gap-3">
          <div>
            <span className="font-medium">{c.name}</span>
            <span className="text-gray-400 ml-2">{c.race} · {c.state} · {c.party}</span>
            {c.incumbent && <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">Incumbent</span>}
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
        </li>
      ))}
    </ul>
  )
}
