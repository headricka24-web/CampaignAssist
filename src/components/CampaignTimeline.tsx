'use client'

import Link from 'next/link'
import { useState } from 'react'

type Phase = {
  id:           string
  name:         string
  shortName:    string
  startDaysOut: number
  endDaysOut:   number
  icon:         string
  dot:          string   // bg class for the node
  ring:         string   // ring class for current
  bar:          string   // bg class for the filled connector
  textColor:    string
  borderClass:  string
  panelBg:      string
  focus:        string
  tasks:        string[]
  link:         string
  linkLabel:    string
}

const PHASES: Phase[] = [
  {
    id: 'foundation', name: 'Foundation', shortName: 'Foundation',
    startDaysOut: 9999, endDaysOut: 121, icon: '🏛️',
    dot: 'bg-slate-500', ring: 'ring-slate-400', bar: 'bg-slate-500',
    textColor: 'text-slate-300', borderClass: 'border-slate-500/30', panelBg: 'bg-slate-800/60',
    focus: 'Register your campaign, hire staff, and define your message.',
    tasks: ['File paperwork & open campaign bank account', 'Hire campaign manager and key staff', 'Define candidate message and core issues', 'Set fundraising goals and build donor list'],
    link: '/my-candidate', linkLabel: 'Campaign Settings',
  },
  {
    id: 'launch', name: 'Build & Launch', shortName: 'Launch',
    startDaysOut: 120, endDaysOut: 91, icon: '📢',
    dot: 'bg-blue-500', ring: 'ring-blue-400', bar: 'bg-blue-500',
    textColor: 'text-blue-300', borderClass: 'border-blue-500/30', panelBg: 'bg-blue-900/50',
    focus: 'Go public, earn first media coverage, and build your donor base.',
    tasks: ['Public announcement & kickoff event', 'First press release — work your press list', 'Launch online fundraising', 'Upload voter file and begin initial ID'],
    link: '/media', linkLabel: 'Media Studio',
  },
  {
    id: 'voter-id', name: 'Voter Contact', shortName: 'Voter ID',
    startDaysOut: 90, endDaysOut: 61, icon: '🗳️',
    dot: 'bg-emerald-500', ring: 'ring-emerald-400', bar: 'bg-emerald-500',
    textColor: 'text-emerald-300', borderClass: 'border-emerald-500/30', panelBg: 'bg-emerald-900/50',
    focus: "Knock doors, phone bank, and identify who's with you.",
    tasks: ['Door-to-door canvassing by precinct', 'Phone banking — ID persuadable voters', 'Recruit and train volunteers', 'Target outreach to strong-support voters'],
    link: '/voters', linkLabel: 'Voter File',
  },
  {
    id: 'persuasion', name: 'Persuasion Sprint', shortName: 'Persuasion',
    startDaysOut: 60, endDaysOut: 31, icon: '⚡',
    dot: 'bg-violet-500', ring: 'ring-violet-400', bar: 'bg-violet-500',
    textColor: 'text-violet-300', borderClass: 'border-violet-500/30', panelBg: 'bg-violet-900/50',
    focus: 'Move undecided voters and maximize earned media coverage.',
    tasks: ['Launch paid advertising (TV, digital, mail)', 'Direct contact with persuadable voters', 'Intensify press & earned media outreach', 'Final fundraising push before ad blackout'],
    link: '/media', linkLabel: 'Media Studio',
  },
  {
    id: 'gotv-prep', name: 'GOTV Prep', shortName: 'GOTV Prep',
    startDaysOut: 30, endDaysOut: 15, icon: '📋',
    dot: 'bg-amber-500', ring: 'ring-amber-400', bar: 'bg-amber-500',
    textColor: 'text-amber-300', borderClass: 'border-amber-500/30', panelBg: 'bg-amber-900/50',
    focus: 'Set up Election Day infrastructure and chase early votes.',
    tasks: ['Chase early vote targets — call and knock', 'Finalize canvass routes for Election Day', 'Volunteer mobilization — confirm all shifts', 'Poll watcher training and assignments'],
    link: '/outreach', linkLabel: 'Outreach',
  },
  {
    id: 'final-sprint', name: 'Final Sprint', shortName: 'Final Push',
    startDaysOut: 14, endDaysOut: 1, icon: '🚀',
    dot: 'bg-red-500', ring: 'ring-red-400', bar: 'bg-red-500',
    textColor: 'text-red-300', borderClass: 'border-red-500/30', panelBg: 'bg-red-900/50',
    focus: 'All hands on deck — every single vote counts.',
    tasks: ['All-out canvassing — no door left unknocked', 'Robocalls, texts, and email blasts to base', 'Chase outstanding early vote returns', 'Run last TV, radio, and digital ads'],
    link: '/victory', linkLabel: 'Path to Victory',
  },
  {
    id: 'election-day', name: 'Election Day', shortName: 'E-Day',
    startDaysOut: 0, endDaysOut: 0, icon: '★',
    dot: 'bg-yellow-400', ring: 'ring-yellow-300', bar: 'bg-yellow-400',
    textColor: 'text-yellow-300', borderClass: 'border-yellow-400/30', panelBg: 'bg-yellow-900/50',
    focus: 'Execute the plan. Get every supporter to the polls.',
    tasks: ['Poll watchers at every key precinct', 'Ride-to-polls program running all day', 'GOTV calls and texts until polls close', 'Victory party ready to go'],
    link: '/victory', linkLabel: 'Path to Victory',
  },
]

function daysUntil(dateStr: string): number {
  if (!dateStr) return 0
  return Math.ceil((new Date(dateStr + 'T00:00:00').getTime() - Date.now()) / 86_400_000)
}

function currentPhaseIdx(days: number): number {
  if (days > 120) return 0
  if (days > 90)  return 1
  if (days > 60)  return 2
  if (days > 30)  return 3
  if (days > 14)  return 4
  if (days > 0)   return 5
  return 6
}

export default function CampaignTimeline({ electionDate }: { electionDate: string }) {
  const days   = daysUntil(electionDate)
  const curIdx = electionDate ? currentPhaseIdx(days) : -1
  const [sel, setSel] = useState<number>(curIdx)

  const selected = sel >= 0 ? PHASES[sel] : null

  return (
    <div className="bg-[#0a1e38] rounded-2xl border border-white/10 overflow-hidden">

      {/* ── Header strip ─────────────────────────────────────────────── */}
      <div className="px-6 pt-5 pb-4 border-b border-white/[0.06] flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.32em] text-white/30 mb-1">Campaign Timeline</p>
          {!electionDate ? (
            <p className="text-white/50 text-sm">Set your election date to track campaign phases.</p>
          ) : days > 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-gold-400 font-black text-4xl leading-none">{days}</span>
              <span className="text-white/50 text-sm">days to Election Day</span>
            </div>
          ) : days === 0 ? (
            <p className="text-yellow-400 font-black text-xl">It's Election Day! 🗳️</p>
          ) : (
            <p className="text-white/30 text-sm">Election has passed.</p>
          )}
          {curIdx >= 0 && (
            <p className="text-white/30 text-[11px] mt-0.5">
              Current phase: <span className={`font-bold ${PHASES[curIdx].textColor}`}>{PHASES[curIdx].name}</span>
            </p>
          )}
        </div>
        <Link
          href="/victory"
          className="text-[11px] font-bold text-blue-400/50 hover:text-blue-300 transition-colors uppercase tracking-widest shrink-0"
        >
          Full Plan →
        </Link>
      </div>

      {/* ── Timeline track ───────────────────────────────────────────── */}
      <div className="px-6 py-6 overflow-x-auto">
        {!electionDate ? (
          <div className="text-center py-4">
            <Link
              href="/victory"
              className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all"
            >
              Set Up Path to Victory →
            </Link>
          </div>
        ) : (
          <div className="min-w-[580px]">
            {/* Phase row */}
            <div className="flex items-center">
              {PHASES.map((phase, i) => {
                const isPast     = i < curIdx
                const isCurrent  = i === curIdx
                const isSelected = i === sel
                const isFuture   = i > curIdx

                return (
                  <div key={phase.id} className="flex items-center flex-1 last:flex-none">
                    {/* Node button */}
                    <button
                      onClick={() => setSel(prev => prev === i ? -1 : i)}
                      className="relative flex flex-col items-center gap-2 group focus:outline-none shrink-0"
                    >
                      {/* Ping ring for current phase */}
                      {isCurrent && !isSelected && (
                        <div
                          className={`absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-full ${phase.dot} animate-ping opacity-60 z-0`}
                          style={{ animationDuration: '2.5s' }}
                        />
                      )}

                      {/* Circle */}
                      <div className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-xl
                        border-2 transition-all duration-200 relative z-10
                        ${isSelected
                          ? `${phase.dot} border-white/80 scale-110 shadow-xl ring-2 ${phase.ring} ring-offset-2 ring-offset-[#0a1e38]`
                          : isCurrent
                          ? `${phase.dot} border-white/70 shadow-lg ring-4 ${phase.ring} ring-offset-2 ring-offset-[#0a1e38]`
                          : isPast
                          ? `${phase.dot} border-white/25 opacity-70`
                          : 'bg-white/[0.06] border-white/15 text-white/30 group-hover:bg-white/[0.12] group-hover:border-white/30'
                        }
                      `}>
                        {isPast && !isSelected
                          ? <span className="text-white font-black text-sm">✓</span>
                          : <span className={isFuture ? 'opacity-55' : ''}>{phase.icon}</span>
                        }
                      </div>

                      {/* Label */}
                      <div className="text-center w-16">
                        <p className={`text-[10px] font-bold uppercase tracking-wide leading-tight transition-colors ${
                          isSelected ? 'text-white' :
                          isCurrent  ? 'text-white font-black' :
                          isPast     ? 'text-white/60' :
                                       'text-white/45 group-hover:text-white/70'
                        }`}>
                          {phase.shortName}
                        </p>
                        {isCurrent && (
                          <span className={`text-[9px] font-black uppercase tracking-wider ${phase.textColor} opacity-80`}>
                            ● Now
                          </span>
                        )}
                      </div>
                    </button>

                    {/* Connector bar between nodes */}
                    {i < PHASES.length - 1 && (
                      <div className="flex-1 h-1 mx-1 rounded-full overflow-hidden bg-white/[0.07]">
                        <div className={`h-full rounded-full transition-all duration-500 ${
                          i < curIdx
                            ? PHASES[i + 1].bar + ' opacity-50'
                            : i === curIdx
                            ? PHASES[i].bar + ' opacity-60 w-1/2 animate-pulse-slow'
                            : 'w-0'
                        }`} />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── Selected phase detail ─────────────────────────────────────── */}
      {selected && (
        <div className={`border-t border-white/[0.06] ${selected.panelBg} px-6 py-5`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className={`text-[9px] font-black uppercase tracking-[0.28em] ${selected.textColor} mb-1`}>
                {sel === curIdx ? '● Current Phase' : sel < curIdx ? 'Completed' : 'Upcoming'}
              </p>
              <h3 className="text-white font-black text-lg leading-none">{selected.name}</h3>
              <p className="text-white/45 text-sm mt-1.5 leading-relaxed max-w-lg">{selected.focus}</p>
            </div>
            <Link
              href={selected.link}
              className={`shrink-0 text-[11px] font-black uppercase tracking-wider px-4 py-2 rounded-lg border ${selected.borderClass} ${selected.textColor} hover:bg-white/10 transition-colors whitespace-nowrap`}
            >
              {selected.linkLabel} →
            </Link>
          </div>
          <div className="grid sm:grid-cols-2 gap-x-8 gap-y-2">
            {selected.tasks.map(task => (
              <div key={task} className="flex items-start gap-2.5">
                <span className={`${selected.textColor} text-[11px] mt-0.5 shrink-0`}>★</span>
                <span className="text-white/60 text-sm leading-snug">{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
