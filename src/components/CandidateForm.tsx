'use client'
import { useState } from 'react'

export default function CandidateForm() {
  const [name, setName]         = useState('')
  const [race, setRace]         = useState('')
  const [state, setState]       = useState('')
  const [party, setParty]       = useState('')
  const [status, setStatus]     = useState('')
  const [loading, setLoading]   = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setStatus('')
    const res = await fetch('/api/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, race, state, party }),
    })
    setLoading(false)
    if (res.ok) { setStatus('Candidate added.'); setName(''); setRace(''); setState(''); setParty('') }
    else setStatus('Error saving candidate.')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3" aria-label="Add candidate">
      {(['Name', 'Race', 'State', 'Party'] as const).map(field => (
        <div key={field}>
          <label htmlFor={`cand-${field}`} className="block text-xs font-medium text-gray-600 mb-1">{field}</label>
          <input id={`cand-${field}`} type="text" required
            value={field === 'Name' ? name : field === 'Race' ? race : field === 'State' ? state : party}
            onChange={e => {
              if (field === 'Name') setName(e.target.value)
              else if (field === 'Race') setRace(e.target.value)
              else if (field === 'State') setState(e.target.value)
              else setParty(e.target.value)
            }}
            className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      ))}
      <button type="submit" disabled={loading}
        className="bg-brand-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-brand-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500">
        {loading ? 'Saving…' : 'Add Candidate'}
      </button>
      {status && <p className="text-sm text-gray-500" role="status">{status}</p>}
    </form>
  )
}
