'use client'

import { useState, useEffect } from 'react'

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

type RaceLevel = 'federal' | 'state' | 'county' | 'municipal' | ''

const RACE_LEVELS: { value: RaceLevel; label: string; description: string }[] = [
  { value: 'federal',   label: 'Federal',   description: 'U.S. Senate, U.S. House of Representatives' },
  { value: 'state',     label: 'State',     description: 'Governor, State Senate, State House/Assembly' },
  { value: 'county',    label: 'County',    description: 'County Commissioner, Sheriff, DA, Judge' },
  { value: 'municipal', label: 'Municipal', description: 'Mayor, City Council, School Board, Local office' },
]

const inputCls  = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400'
const selectCls = 'w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy bg-white focus:outline-none focus:ring-2 focus:ring-gold-400'

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-gray-400 mt-1">{hint}</p>}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black uppercase tracking-widest text-navy border-b border-gray-100 pb-2 mb-4">{children}</p>
  )
}

export default function CandidateForm({ existing }: { existing?: Candidate | null }) {
  const isEdit = !!existing

  const [name,         setName]         = useState(existing?.name         ?? '')
  const [race,         setRace]         = useState(existing?.race         ?? '')
  const [state,        setState]        = useState(existing?.state        ?? '')
  const [party,        setParty]        = useState(existing?.party        ?? '')
  const [incumbent,    setIncumbent]    = useState(existing?.incumbent    ?? false)
  const [raceLevel,    setRaceLevel]    = useState<RaceLevel>((existing?.raceLevel as RaceLevel) ?? '')
  const [district,     setDistrict]     = useState(existing?.district     ?? '')
  const [county,       setCounty]       = useState(existing?.county       ?? '')
  const [city,         setCity]         = useState(existing?.city         ?? '')
  const [zip,          setZip]          = useState(existing?.zip          ?? '')
  const [opponentName, setOpponentName] = useState(existing?.opponentName ?? '')
  const [status,       setStatus]       = useState('')
  const [saving,       setSaving]       = useState(false)

  // Keep form in sync if existing candidate changes (e.g., after save)
  useEffect(() => {
    if (existing) {
      setName(existing.name)
      setRace(existing.race)
      setState(existing.state)
      setParty(existing.party)
      setIncumbent(existing.incumbent)
      setRaceLevel((existing.raceLevel as RaceLevel) ?? '')
      setDistrict(existing.district ?? '')
      setCounty(existing.county ?? '')
      setCity(existing.city ?? '')
      setZip(existing.zip ?? '')
      setOpponentName(existing.opponentName ?? '')
    }
  }, [existing?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setStatus('')

    const payload = { name, race, state, party, incumbent, raceLevel: raceLevel || null, district: district || null, county: county || null, city: city || null, zip: zip || null, opponentName: opponentName || null }

    const res = await fetch('/api/candidates', {
      method:  isEdit ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(isEdit ? { id: existing!.id, ...payload } : payload),
    })

    setSaving(false)
    if (res.ok) {
      setStatus(isEdit ? 'Settings saved.' : 'Candidate added.')
      if (!isEdit) { setName(''); setRace(''); setState(''); setParty(''); setRaceLevel(''); setDistrict(''); setCounty(''); setCity(''); setZip(''); setOpponentName('') }
      // Refresh the page to reflect changes
      setTimeout(() => window.location.reload(), 600)
    } else {
      setStatus('Error saving — please try again.')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">

      {/* ── Candidate Basics ── */}
      <div className="space-y-4">
        <SectionLabel>Candidate Info</SectionLabel>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Full Name *">
            <input className={inputCls} required value={name} onChange={e => setName(e.target.value)} placeholder="Jane Smith" />
          </Field>
          <Field label="Party *">
            <select className={selectCls} required value={party} onChange={e => setParty(e.target.value)}>
              <option value="">Select party…</option>
              <option value="Republican">Republican</option>
              <option value="Democrat">Democrat</option>
              <option value="Independent">Independent</option>
              <option value="Libertarian">Libertarian</option>
              <option value="Other">Other</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="State *">
            <input className={inputCls} required value={state} onChange={e => setState(e.target.value)} placeholder="New Hampshire" />
          </Field>
          <Field label="Race / Office *">
            <input className={inputCls} required value={race} onChange={e => setRace(e.target.value)} placeholder="U.S. Senate, Governor, State House…" />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Opponent Name" hint="Used for news monitoring and opposition analysis">
            <input className={inputCls} value={opponentName} onChange={e => setOpponentName(e.target.value)} placeholder="John Doe" />
          </Field>
          <Field label="Incumbent?">
            <div className="flex items-center gap-3 pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={incumbent} onChange={e => setIncumbent(e.target.checked)}
                  className="w-4 h-4 accent-navy rounded" />
                <span className="text-sm text-navy">This candidate is the incumbent</span>
              </label>
            </div>
          </Field>
        </div>
      </div>

      {/* ── Geographic Targeting ── */}
      <div className="space-y-4">
        <SectionLabel>Geographic Targeting</SectionLabel>
        <p className="text-xs text-gray-400 -mt-2">
          The more precisely you define the race geography, the more targeted the constituent profile and voter analysis will be.
        </p>

        <Field label="Race Level" hint="Sets which geographic level to pull Census, demographic, and zoning data for">
          <select className={selectCls} value={raceLevel} onChange={e => setRaceLevel(e.target.value as RaceLevel)}>
            <option value="">Not specified (state-level data)</option>
            {RACE_LEVELS.map(l => (
              <option key={l.value} value={l.value}>{l.label} — {l.description}</option>
            ))}
          </select>
        </Field>

        {/* Federal: congressional district */}
        {raceLevel === 'federal' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl border border-blue-100">
            <Field label="Congressional District #" hint="e.g. 1, 2, 3 — leave blank for Senate (statewide)">
              <input className={inputCls} value={district} onChange={e => setDistrict(e.target.value)} placeholder="1" />
            </Field>
            <Field label="ZIP Code (optional)" hint="For hyper-local targeting within the district">
              <input className={inputCls} value={zip} onChange={e => setZip(e.target.value)} placeholder="03101" />
            </Field>
          </div>
        )}

        {/* State: legislative district */}
        {raceLevel === 'state' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-purple-50 rounded-xl border border-purple-100">
            <Field label="State District #" hint="Your state legislative district number">
              <input className={inputCls} value={district} onChange={e => setDistrict(e.target.value)} placeholder="7" />
            </Field>
            <Field label="ZIP Code (optional)">
              <input className={inputCls} value={zip} onChange={e => setZip(e.target.value)} placeholder="03101" />
            </Field>
          </div>
        )}

        {/* County */}
        {raceLevel === 'county' && (
          <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50 rounded-xl border border-orange-100">
            <Field label="County Name *" hint="e.g. Hillsborough County">
              <input className={inputCls} value={county} onChange={e => setCounty(e.target.value)} placeholder="Hillsborough County" />
            </Field>
            <Field label="ZIP Code (optional)">
              <input className={inputCls} value={zip} onChange={e => setZip(e.target.value)} placeholder="03101" />
            </Field>
          </div>
        )}

        {/* Municipal */}
        {raceLevel === 'municipal' && (
          <div className="space-y-3 p-4 bg-green-50 rounded-xl border border-green-100">
            <div className="grid grid-cols-2 gap-4">
              <Field label="City / Municipality *" hint="e.g. Manchester, Concord">
                <input className={inputCls} value={city} onChange={e => setCity(e.target.value)} placeholder="Manchester" />
              </Field>
              <Field label="District # (if applicable)" hint="City council ward, school board district, etc.">
                <input className={inputCls} value={district} onChange={e => setDistrict(e.target.value)} placeholder="Ward 3" />
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="County" hint="County the municipality sits in">
                <input className={inputCls} value={county} onChange={e => setCounty(e.target.value)} placeholder="Hillsborough County" />
              </Field>
              <Field label="ZIP Code">
                <input className={inputCls} value={zip} onChange={e => setZip(e.target.value)} placeholder="03101" />
              </Field>
            </div>
          </div>
        )}
      </div>

      {/* ── Save ── */}
      <div className="flex items-center gap-4 pt-2">
        <button type="submit" disabled={saving || !name.trim() || !race.trim() || !state.trim() || !party}
          className="bg-navy hover:bg-navy-700 disabled:opacity-50 text-white font-black uppercase tracking-widest px-8 py-3 rounded-xl text-sm transition-all">
          {saving ? 'Saving…' : isEdit ? 'Save Settings' : 'Add Candidate'}
        </button>
        {status && (
          <p className={`text-sm font-bold ${status.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
            {status}
          </p>
        )}
      </div>
    </form>
  )
}
