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
  activeClass:  string
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
    activeClass: 'bg-slate-600 border-slate-400',
    textColor: 'text-slate-300', borderClass: 'border-slate-600/40', panelBg: 'bg-slate-900/50',
    focus: 'Register your campaign, hire staff, and define your message.',
    tasks: ['File paperwork & open campaign bank account', 'Hire campaign manager and key staff', 'Define candidate message and core issues', 'Set fundraising goals and build donor list'],
    link: '/my-candidate', linkLabel: 'Campaign Settings',
  },
  {
    id: 'launch', name: 'Build & Launch', shortName: 'Launch',
    startDaysOut: 120, endDaysOut: 91, icon: '📢',
    activeClass: 'bg-blue-600 border-blue-400',
    textColor: 'text-blue-300', borderClass: 'border-blue-600/40', panelBg: 'bg-blue-950/50',
    focus: 'Go public, earn first media coverage, and build your donor base.',
    tasks: ['Public announcement & kickoff event', 'First press release — work your press list', 'Launch online fundraising', 'Upload voter file and begin initial ID'],
    link: '/media', linkLabel: 'Media Studio',
  },
  {
    id: 'voter-id', name: 'Voter Contact', shortName: 'Voter ID',
    startDaysOut: 90, endDaysOut: 61, icon: '🗳️',
    activeClass: 'bg-emerald-600 border-emerald-400',
    textColor: 'text-emerald-300', borderClass: 'border-emerald-600/40', panelBg: 'bg-emerald-950/50',
    focus: "Knock doors, phone bank, and identify who's with you.",
    tasks: ['Door-to-door canvassing by precinct', 'Phone banking — ID persuadable voters', 'Recruit and train volunteers', 'Target outreach to strong-support voters'],
    link: '/voters', linkLabel: 'Voter File',
  },
  {
    id: 'persuasion', name: 'Persuasion Sprint', shortName: 'Persuasion',
    startDaysOut: 60, endDaysOut: 31, icon: '⚡',
    activeClass: 'bg-violet-600 border-violet-400',
    textColor: 'text-violet-300', borderClass: 'border-violet-600/40', panelBg: 'bg-violet-950/50',
    focus: 'Move undecided voters and maximize earned media coverage.',
    tasks: ['Launch paid advertising (TV, digital, mail)', 'Direct contact with persuadable voters', 'Intensify press & earned media outreach', 'Final fundraising push before ad blackout'],
    link: '/media', linkLabel: 'Media Studio',
  },
  {
    id: 'gotv-prep', name: 'GOTV Prep', shortName: 'GOTV Prep',
    startDaysOut: 30, endDaysOut: 15, icon: '📋',
    activeClass: 'bg-amber-600 border-amber-400',
    textColor: 'text-amber-300', borderClass: 'border-amber-600/40', panelBg: 'bg-amber-950/50',
    focus: 'Set up Election Day infrastructure and chase early votes.',
    tasks: ['Chase early vote targets — call and knock', 'Finalize canvass routes for Election Day', 'Volunteer mobilization — confirm all shifts', 'Poll watcher training and assignments'],
    link: '/outreach', linkLabel: 'Outreach',
  },
  {
    id: 'final-sprint', name: 'Final Sprint', shortName: 'Final Push',
    startDaysOut: 14, endDaysOut: 1, icon: '🚀',
    activeClass: 'bg-red-600 border-red-400',
    textColor: 'text-red-300', borderClass: 'border-red-600/40', panelBg: 'bg-red-950/50',
    focus: 'All hands on deck — every single vote counts.',
    tasks: ['All-out canvassing — no door left unknocked', 'Robocalls, texts, and email blasts to base', 'Chase outstanding early vote returns', 'Run last TV, radio, and digital ads'],
    link: '/victory', linkLabel: 'Path to Victory',
  },
  {
    id: 'election-day', name: 'Election Day', shortName: 'E-Day',
    startDaysOut: 0, endDaysOut: 0, icon: '★',
    activeClass: 'bg-yellow-500 border-yellow-300',
    textColor: 'text-yellow-300', borderClass: 'border-yellow-500/40', panelBg: 'bg-yellow-950/50',
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

  if (!electionDate) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-3xl mb-3">🗓️</p>
        <p className="text-white/50 text-sm font-semibold mb-1">No election date set.</p>
        <p className="text-white/30 text-xs mb-5">Set your election date to unlock your interactive campaign timeline.</p>
        <Link
          href="/victory"
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs uppercase tracking-widest px-6 py-2.5 rounded-xl transition-all"
        >
          Set Up Path to Victory →
        </Link>
      </div>
    )
  }

  const selected     = sel >= 0 ? PHASES[sel] : null
  const progressPct  = curIdx >= 0 ? (curIdx / (PHASES.length - 1)) * 100 : 0

  return (
    <div>
      {/* Header */}
      <div className="flex items-end justify-between mb-7 gap-4">
        <div>
          {days > 0 ? (
            <div className="flex items-baseline gap-2">
              <span className="text-gold-400 font-black text-5xl leading-none">{days}</span>
              <span className="text-white/50 text-base">days to Election Day</span>
            </div>
          ) : days === 0 ? (
            <p className="text-yellow-400 text-2xl font-black">It's Election Day! 🗳️</p>
          ) : (
            <p className="text-white/30 text-base">Election has passed.</p>
          )}
          {curIdx >= 0 && (
            <p className="text-white/25 text-[11px] uppercase tracking-widest mt-1">
              Current phase: {PHASES[curIdx].name}
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

      {/* Timeline track — horizontally scrollable on small screens */}
      <div className="relative mb-5 overflow-x-auto pb-2">
        <div className="min-w-[500px] relative">
          {/* Background connector line */}
          <div className="absolute top-5 left-5 right-5 h-px bg-white/[0.08]" />
          {/* Progress fill */}
          <div
            className="absolute top-5 left-5 h-px bg-white/30 transition-all duration-700"
            style={{ width: `calc(${progressPct / 100} * (100% - 40px))` }}
          />

          <div className="relative flex justify-between">
            {PHASES.map((phase, i) => {
              const isPast     = i < curIdx
              const isCurrent  = i === curIdx
              const isSelected = i === sel

              return (
                <button
                  key={phase.id}
                  onClick={() => setSel(prev => prev === i ? -1 : i)}
                  className="flex flex-col items-center gap-1.5 group focus:outline-none"
                  style={{ minWidth: '58px' }}
                >
                  {/* Node bubble */}
                  <div className={`
                    relative w-10 h-10 rounded-full flex items-center justify-center text-sm border-2 z-10
                    transition-all duration-200
                    ${isSelected
                      ? `${phase.activeClass} scale-110 shadow-lg`
                      : isCurrent
                      ? `${phase.activeClass} shadow-md`
                      : isPast
                      ? 'bg-white/10 border-white/20 text-white/50'
                      : 'bg-white/[0.04] border-white/10 text-white/20 group-hover:bg-white/10 group-hover:border-white/25 group-hover:text-white/45'
                    }
                  `}>
                    {isPast && !isSelected
                      ? <span className="text-white/50 text-[11px] font-black">✓</span>
                      : phase.icon
                    }
                  </div>

                  {/* Label */}
                  <div className="text-center">
                    <p className={`
                      text-[9px] font-bold uppercase tracking-wide leading-tight max-w-[54px] mx-auto transition-colors
                      ${isSelected ? 'text-white' : isCurrent ? phase.textColor : isPast ? 'text-white/25' : 'text-white/15 group-hover:text-white/35'}
                    `}>
                      {phase.shortName}
                    </p>
                    {isCurrent && (
                      <p className="text-[8px] font-black text-white/35 tracking-widest uppercase mt-0.5">● Now</p>
                    )}
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Expanded phase detail */}
      {selected && (
        <div className={`rounded-xl border ${selected.borderClass} ${selected.panelBg} p-5 mt-1`}>
          <div className="flex items-start justify-between gap-4 mb-4">
            <div>
              <p className={`text-[9px] font-black uppercase tracking-[0.28em] ${selected.textColor} mb-1`}>
                {sel === curIdx ? '● Current Phase' : sel < curIdx ? 'Completed' : 'Upcoming'}
              </p>
              <h3 className="text-white font-black text-base leading-none">{selected.name}</h3>
              <p className="text-white/45 text-xs mt-1.5 leading-relaxed">{selected.focus}</p>
            </div>
            <Link
              href={selected.link}
              className={`shrink-0 text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-lg border ${selected.borderClass} ${selected.textColor} hover:bg-white/10 transition-colors whitespace-nowrap`}
            >
              {selected.linkLabel} →
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 gap-x-6 gap-y-1.5">
            {selected.tasks.map(task => (
              <div key={task} className="flex items-start gap-2">
                <span className={`${selected.textColor} text-[10px] mt-0.5 shrink-0`}>★</span>
                <span className="text-white/55 text-[11px] leading-relaxed">{task}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
