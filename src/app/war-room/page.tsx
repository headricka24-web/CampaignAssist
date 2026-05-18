'use client'

import { useState } from 'react'
import WarRoom from '@/components/WarRoom'
import OppResearchDossier from '@/components/OppResearchDossier'

type Tab = 'threats' | 'dossier'

export default function WarRoomPage() {
  const [tab, setTab] = useState<Tab>('threats')

  return (
    <div className="space-y-6">
      {/* Tab toggle */}
      <div className="flex gap-2 border-b border-gray-100 pb-4">
        <button
          onClick={() => setTab('threats')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
            tab === 'threats'
              ? 'bg-navy text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-500 hover:border-navy hover:text-navy'
          }`}
        >
          🚨 Threats
        </button>
        <button
          onClick={() => setTab('dossier')}
          className={`px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors ${
            tab === 'dossier'
              ? 'bg-navy text-white shadow-sm'
              : 'bg-white border border-gray-200 text-gray-500 hover:border-navy hover:text-navy'
          }`}
        >
          🗂 O.R. Dossier
        </button>
      </div>

      {tab === 'threats'  && <WarRoom />}
      {tab === 'dossier'  && <OppResearchDossier />}
    </div>
  )
}
