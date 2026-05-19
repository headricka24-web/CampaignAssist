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
      <div className="flex gap-2 bg-[#0a1e38] rounded-2xl p-1.5 mb-2">
        <button
          onClick={() => setTab('threats')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            tab === 'threats'
              ? 'bg-red-500 text-white shadow-glow-red'
              : 'text-white/50 hover:text-white hover:bg-white/5'
          }`}
        >
          🚨 Threats
        </button>
        <button
          onClick={() => setTab('dossier')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
            tab === 'dossier'
              ? 'bg-navy text-white'
              : 'text-white/50 hover:text-white hover:bg-white/5'
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
