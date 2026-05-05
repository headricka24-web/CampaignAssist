'use client'

import { useEffect, useState } from 'react'

const BG_TOASTS = [
  { icon: '💰', text: '$500 donation received',    sub: 'James R. · Chicago, IL',        delay: '0s',   right: 'right-8',   top: 'top-[13%]'  },
  { icon: '📰', text: 'New article detected',      sub: '"Smith leads 52–44 in poll"',    delay: '1.6s', right: 'right-28',  top: 'top-[32%]'  },
  { icon: '🗳️', text: '42 GOTV voters tagged',     sub: 'Precinct 7 · sorted & flagged',  delay: '3.2s', right: 'right-10',  top: 'top-[53%]'  },
  { icon: '⚡', text: 'War Room alert',            sub: 'Opponent statement flagged',      delay: '4.8s', right: 'right-36',  top: 'top-[70%]'  },
  { icon: '🙋', text: 'New volunteer signup',      sub: 'Sarah K. · door knocking',        delay: '6.4s', right: 'right-14',  top: 'top-[23%]'  },
  { icon: '💰', text: '$1,000 pledge logged',      sub: 'Major donor · follow-up sent',    delay: '8s',   right: 'right-24',  top: 'top-[82%]'  },
]

export function HeroBackgroundToasts() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden hidden xl:block">
      {BG_TOASTS.map((t, i) => (
        <div
          key={i}
          className={`absolute ${t.right} ${t.top}`}
          style={{ animation: 'notifCycle 9.6s ease-in-out infinite', animationDelay: t.delay, opacity: 0 }}
        >
          <div className="flex items-center gap-2.5 bg-white/8 backdrop-blur-sm border border-white/12 rounded-xl px-3.5 py-2.5 shadow-xl">
            <span className="text-base shrink-0">{t.icon}</span>
            <div>
              <div className="text-white text-[11px] font-bold leading-tight whitespace-nowrap">{t.text}</div>
              <div className="text-blue-300/55 text-[10px] whitespace-nowrap mt-0.5">{t.sub}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

const ACTIVITIES = [
  { icon: '💰', title: 'Donation received',       detail: 'James R.  ·  $500  ·  Chicago, IL',               badge: 'DONOR',    bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30' },
  { icon: '📰', title: 'New article detected',     detail: '"Smith leads 52–44 in latest district poll"',      badge: 'NEWS',     bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/30'  },
  { icon: '🗳️', title: 'Voters sorted: GOTV',      detail: 'Precinct 7  ·  42 priority  ·  18 persuadables',   badge: 'VOTERS',   bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30'},
  { icon: '🙋', title: 'Volunteer confirmed',      detail: 'Sarah K.  ·  Door knocking  ·  Saturday AM',       badge: 'OUTREACH', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30'},
  { icon: '⚡', title: 'War Room alert',           detail: 'Opponent statement flagged — education cuts',       badge: 'ALERT',    bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30'},
  { icon: '💰', title: '$1,000 pledge logged',     detail: 'Major donor  ·  Follow-up email sent automatically', badge: 'DONOR',   bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30' },
  { icon: '📊', title: 'Morning brief ready',      detail: 'District 14  ·  8 stories  ·  3 key alerts',        badge: 'BRIEF',    bg: 'bg-teal-500/20',   text: 'text-teal-400',   border: 'border-teal-500/30'  },
  { icon: '📞', title: 'Voter contact logged',     detail: 'Phone bank  ·  Precinct 3  ·  Marked supportive',   badge: 'VOTERS',   bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30'},
  { icon: '💰', title: 'Fundraising goal hit',     detail: 'Weekly $5,000 goal reached  ·  3 days early',       badge: 'DONOR',    bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30' },
  { icon: '📰', title: 'Media coverage spike',     detail: 'Tribune + Gazette both picked up the story',        badge: 'NEWS',     bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/30'  },
]

const NEWS_HEADLINES = [
  'Smith Campaign Raises $180K in Q3, Leads in Fundraising',
  'New Poll: District 14 Tightens — Smith Ahead by 4 Points',
  'Opponent Skips Town Hall on Education Budget',
  'Local Teachers Union Endorses Smith for State House',
  'Unemployment Ticks Up 0.2% in District 14',
  'Smith Launches Weekend Door-Knock Blitz Across Three Precincts',
  'Early Voting Numbers Up 18% Versus Last Election Cycle',
  'Opponent Campaign Reports Significant Fundraising Gap',
  'Census: Median Income Stagnant in District for Third Straight Year',
  'Smith Leads Among Independent Voters 48–37, New Poll Finds',
  'District 14 School Board Meeting Draws Record Turnout',
  'Campaign Finance Report: Smith Team on Track for Quarter Goal',
]

const DONOR_ITEMS = [
  '💰  James R.  ·  $500',
  '💰  Anonymous  ·  $1,000',
  '💰  Maria G.  ·  $75',
  '💰  David K.  ·  $250',
  '💰  The Chen Family  ·  $2,500',
  '💰  Pat W.  ·  $150',
  '💰  Sandra L.  ·  $500',
  '💰  Robert M.  ·  $100',
  '💰  Teachers for Smith PAC  ·  $5,000',
  '💰  Anonymous  ·  $50',
  '💰  Neighborhood Action Fund  ·  $1,200',
  '💰  Kim T.  ·  $300',
]

export function HeroActivityCard() {
  const [items, setItems] = useState(ACTIVITIES.slice(0, 3))
  const [cursor, setCursor] = useState(3)

  useEffect(() => {
    const id = setInterval(() => {
      setCursor(c => {
        const next = c % ACTIVITIES.length
        setItems(prev => [ACTIVITIES[next], ...prev.slice(0, 2)])
        return c + 1
      })
    }, 2300)
    return () => clearInterval(id)
  }, [])

  return (
    <div className="w-[340px] rounded-2xl overflow-hidden border border-white/10 bg-[#0A1628]/92 backdrop-blur-md"
      style={{ boxShadow: '0 0 60px rgba(0,0,0,0.55), 0 0 30px rgba(10,22,40,0.4)' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[11px] font-black text-white uppercase tracking-widest">Live Dashboard</span>
        </div>
        <span className="text-[10px] font-semibold text-green-400/80">● Connected</span>
      </div>

      {/* Feed */}
      <div className="divide-y divide-white/5">
        {items.map((item, i) => (
          <div
            key={`${item.title}-${cursor - i}`}
            className={`px-4 py-3 flex items-start gap-3 ${i === 0 ? 'activity-slide-in' : ''}`}
            style={{ opacity: 1 - i * 0.28 }}
          >
            <span className="text-lg shrink-0 mt-0.5">{item.icon}</span>
            <div className="flex-1 min-w-0">
              <div className="text-white text-[12px] font-bold leading-tight">{item.title}</div>
              <div className="text-blue-300/55 text-[11px] mt-0.5 truncate">{item.detail}</div>
            </div>
            <span className={`shrink-0 self-start text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border ${item.bg} ${item.text} ${item.border}`}>
              {item.badge}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2.5 bg-white/5 border-t border-white/10 flex items-center justify-between">
        <span className="text-[10px] text-blue-400/40 uppercase tracking-widest">CampaignAssist</span>
        <span className="text-[10px] text-blue-300/40">Real-time updates</span>
      </div>
    </div>
  )
}

export function NewsTicker() {
  const items = [...NEWS_HEADLINES, ...NEWS_HEADLINES]
  return (
    <div className="bg-red-700 py-3 overflow-hidden border-y border-red-600/60">
      <div className="flex items-stretch">
        <div className="shrink-0 bg-red-900 text-white text-[10px] font-black uppercase tracking-[0.12em] px-4 flex items-center leading-tight z-10"
          style={{ boxShadow: '2px 0 10px rgba(0,0,0,0.35)' }}>
          LIVE<br />NEWS
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track text-white text-xs font-medium whitespace-nowrap leading-none py-0.5">
            {items.map((h, i) => (
              <span key={i} className="inline-flex items-center gap-3 mx-8">
                <span className="text-red-300 text-[10px]">★</span>
                <span>{h}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export function DonorTicker() {
  const items = [...DONOR_ITEMS, ...DONOR_ITEMS]
  return (
    <div className="bg-navy py-3 overflow-hidden border-y border-white/5">
      <div className="flex items-stretch">
        <div className="shrink-0 bg-gold-600/30 text-gold-400 text-[10px] font-black uppercase tracking-[0.12em] px-4 flex items-center leading-tight z-10 border-r border-gold-400/20"
          style={{ boxShadow: '2px 0 10px rgba(0,0,0,0.25)' }}>
          LIVE<br />DONORS
        </div>
        <div className="overflow-hidden flex-1">
          <div className="ticker-track text-gold-300 text-xs font-semibold whitespace-nowrap leading-none py-0.5"
            style={{ animationDuration: '22s' }}>
            {items.map((d, i) => (
              <span key={i} className="inline-flex items-center gap-2 mx-8">
                <span className="text-gold-400/50 text-[10px]">◆</span>
                <span>{d}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
