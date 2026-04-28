'use client'

import { useState } from 'react'

export default function IngestForm() {
  const [url, setUrl]           = useState('')
  const [title, setTitle]       = useState('')
  const [text, setText]         = useState('')
  const [outletId, setOutletId] = useState('')
  const [candidate, setCandidate] = useState('')
  const [loading, setLoading]   = useState(false)
  const [message, setMessage]   = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMessage('')
    try {
      const res = await fetch('/api/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateName: candidate,
          payload: {
            url,
            title,
            rawText: text,
            outletId,
            sourceType: 'News',
            datePublished: new Date().toISOString(),
          },
        }),
      })
      if (res.ok) {
        setMessage('Article ingested successfully.')
        setUrl(''); setTitle(''); setText('')
      } else {
        const err = await res.json()
        setMessage(`Error: ${err.error}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-5 space-y-4"
      aria-label="Ingest new article"
    >
      <h2 className="font-semibold text-gray-700">Ingest Article</h2>
      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="ingest-url" className="block text-xs font-medium text-gray-600 mb-1">URL</label>
          <input id="ingest-url" type="url" required value={url} onChange={e => setUrl(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label htmlFor="ingest-title" className="block text-xs font-medium text-gray-600 mb-1">Title</label>
          <input id="ingest-title" type="text" required value={title} onChange={e => setTitle(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label htmlFor="ingest-outlet" className="block text-xs font-medium text-gray-600 mb-1">Outlet ID</label>
          <input id="ingest-outlet" type="text" required value={outletId} onChange={e => setOutletId(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
        <div>
          <label htmlFor="ingest-candidate" className="block text-xs font-medium text-gray-600 mb-1">Candidate Name</label>
          <input id="ingest-candidate" type="text" required value={candidate} onChange={e => setCandidate(e.target.value)}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
        </div>
      </div>
      <div>
        <label htmlFor="ingest-text" className="block text-xs font-medium text-gray-600 mb-1">Article Text</label>
        <textarea id="ingest-text" required rows={5} value={text} onChange={e => setText(e.target.value)}
          className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500" />
      </div>
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={loading}
          aria-busy={loading}
          className="bg-brand-500 text-white px-4 py-2 rounded text-sm font-medium hover:bg-brand-600 disabled:opacity-60 focus:outline-none focus:ring-2 focus:ring-brand-500"
        >
          {loading ? 'Processing…' : 'Ingest & Classify'}
        </button>
        {message && <p className="text-sm text-gray-600" role="status" aria-live="polite">{message}</p>}
      </div>
    </form>
  )
}
