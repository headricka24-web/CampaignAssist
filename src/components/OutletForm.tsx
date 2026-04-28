'use client'
import { useState } from 'react'

const TYPES = ['News', 'Blog', 'Social', 'TV', 'Radio', 'Other']

export default function OutletForm() {
  const [name, setName]       = useState('')
  const [type, setType]       = useState('News')
  const [status, setStatus]   = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setStatus('')
    const res = await fetch('/api/outlets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, type }),
    })
    setLoading(false)
    if (res.ok) { setStatus('Outlet added.'); setName('') }
    else setStatus('Error saving outlet.')
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-lg p-4 space-y-3" aria-label="Add outlet">
      <div>
        <label htmlFor="outlet-name" className="block text-xs font-medium text-gray-600 mb-1">Name</label>
        <input id="outlet-name" type="text" required value={name} onChange={e => setName(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div>
        <label htmlFor="outlet-type" className="block text-xs font-medium text-gray-600 mb-1">Type</label>
        <select id="outlet-type" value={type} onChange={e => setType(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500">
          {TYPES.map(t => <option key={t}>{t}</option>)}
        </select>
      </div>
      <button type="submit" disabled={loading}
        className="bg-brand-500 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-brand-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500">
        {loading ? 'Saving…' : 'Add Outlet'}
      </button>
      {status && <p className="text-sm text-gray-500" role="status">{status}</p>}
    </form>
  )
}
