'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

// ── Department color palette ──────────────────────────────────────────────────

const DEPT_COLORS = {
  Command:        { label: 'text-red-400',    bar: 'bg-red-500',     glow: 'shadow-red-900/30'    },
  Intelligence:   { label: 'text-blue-400',   bar: 'bg-blue-500',    glow: 'shadow-blue-900/30'   },
  Communications: { label: 'text-violet-400', bar: 'bg-violet-500',  glow: 'shadow-violet-900/30' },
  'Field Ops':    { label: 'text-emerald-400',bar: 'bg-emerald-500', glow: 'shadow-emerald-900/30'},
  Finance:        { label: 'text-amber-400',  bar: 'bg-amber-500',   glow: 'shadow-amber-900/30'  },
} as const

// ── Navigation structure ──────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    category: 'Command' as const,
    links: [
      { href: '/dashboard', label: 'Dashboard'       },
      { href: '/victory',   label: 'Path to Victory' },
    ],
  },
  {
    category: 'Intelligence' as const,
    links: [
      { href: '/war-room',     label: 'War Room'     },
      { href: '/briefing',     label: 'Hot Buttons'  },
      { href: '/news',         label: 'News Feed'    },
      { href: '/constituents', label: 'Constituents' },
    ],
  },
  {
    category: 'Communications' as const,
    links: [
      { href: '/media',       label: 'Media Studio'   },
      { href: '/legislative', label: "Let's Fund"     },
      { href: '/press',       label: 'Press Contacts' },
    ],
  },
  {
    category: 'Field Ops' as const,
    links: [
      { href: '/outreach', label: 'Outreach' },
      { href: '/voters',   label: 'Voters'   },
    ],
  },
  {
    category: 'Finance' as const,
    links: [
      { href: '/budget', label: 'Budget' },
    ],
  },
]

// ── Component ─────────────────────────────────────────────────────────────────

export default function Sidebar({
  userEmail,
  userName,
}: {
  userEmail: string
  userName:  string
}) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [open,    setOpen]    = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setOpen(false) }, [pathname])

  async function handleSignOut() {
    setOpen(false)
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    return pathname === href || pathname.startsWith(href + '/')
  }

  // ── Sidebar body ──────────────────────────────────────────────────────────
  const sidebarBody = (
    <div className="flex flex-col h-full bg-[#08192e] text-white overflow-y-auto">

      {/* ── Logo ──────────────────────────────────────────────────────────── */}
      <div className="px-4 pt-5 pb-4 shrink-0">
        <Link href="/command" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <div className="w-9 h-9 rounded-full bg-red-gradient shadow-glow-red flex items-center justify-center text-base font-black shrink-0 group-hover:scale-110 transition-transform select-none">
            ★
          </div>
          <div className="min-w-0">
            <p className="font-display font-black text-[15px] leading-none text-white truncate">
              Campaign<span className="text-gold-400">Assist</span>
            </p>
            <p className="text-[9px] text-blue-400/50 tracking-widest uppercase mt-0.5 truncate">
              Intel · Strategy · Victory
            </p>
          </div>
        </Link>
      </div>

      {/* Gold rule */}
      <div className="h-px mx-4 bg-gradient-to-r from-gold-400/60 via-gold-400/20 to-transparent shrink-0" />

      {/* ── Nav groups ────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {NAV_GROUPS.map(group => {
          const colors = DEPT_COLORS[group.category]
          return (
            <div key={group.category} className="mb-1">

              {/* Department header */}
              <div className={`flex items-center gap-2 px-2 pt-3 pb-1.5`}>
                <div className={`h-3 w-0.5 rounded-full ${colors.bar}`} />
                <span className={`text-[10px] font-black uppercase tracking-[0.22em] ${colors.label}`}>
                  {group.category}
                </span>
                <div className={`flex-1 h-px bg-gradient-to-r ${
                  group.category === 'Command'        ? 'from-red-500/30'    :
                  group.category === 'Intelligence'   ? 'from-blue-500/30'   :
                  group.category === 'Communications' ? 'from-violet-500/30' :
                  group.category === 'Field Ops'      ? 'from-emerald-500/30':
                                                        'from-amber-500/30'
                } to-transparent`} />
              </div>

              {/* Links */}
              <div className="space-y-0.5 pl-1">
                {group.links.map(link => {
                  const active = isActive(link.href)
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setOpen(false)}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all group ${
                        active
                          ? 'bg-white/10 text-white'
                          : 'text-white/55 hover:text-white/90 hover:bg-white/5'
                      }`}
                    >
                      {/* Active indicator bar */}
                      <span className={`w-0.5 h-4 rounded-full shrink-0 transition-all ${
                        active ? colors.bar : 'bg-transparent'
                      }`} />
                      {link.label}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* ── Bottom section ────────────────────────────────────────────────── */}
      <div className="shrink-0">
        {/* Gold rule */}
        <div className="h-px mx-4 bg-gradient-to-r from-gold-400/40 via-gold-400/15 to-transparent mb-3" />

        <div className="px-3 space-y-0.5 pb-4">
          {/* My Candidate CTA */}
          <Link
            href="/my-candidate"
            onClick={() => setOpen(false)}
            className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-[13px] font-black uppercase tracking-wider transition-all ${
              pathname === '/my-candidate'
                ? 'bg-gold-400 text-[#08192e]'
                : 'text-gold-400 border border-gold-400/25 hover:bg-gold-400/10 hover:border-gold-400/50'
            }`}
          >
            <span className="text-base leading-none">★</span>
            My Candidate
          </Link>

          {/* User row */}
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1">
            <div className="w-7 h-7 rounded-full bg-gold-400 flex items-center justify-center text-[#08192e] text-xs font-black shrink-0 select-none">
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[12px] font-semibold text-white/80 truncate leading-none">{userName || userEmail}</p>
              {userName && <p className="text-[10px] text-white/30 truncate mt-0.5">{userEmail}</p>}
            </div>
          </div>

          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] text-white/35 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            <span className="text-sm">⚙</span> Settings
          </Link>

          <button
            onClick={handleSignOut}
            className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[12px] text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all"
          >
            <span className="text-sm">↩</span> Sign Out
          </button>

          {/* Live indicator */}
          <div className="flex items-center gap-1.5 px-3 pt-2">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
            <span className="text-[10px] font-black tracking-widest uppercase text-green-400/80">Live</span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop sidebar ───────────────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen border-r border-white/5">
        {sidebarBody}
      </aside>

      {/* ── Mobile ────────────────────────────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Fixed top bar */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-[#08192e] border-b border-white/10 flex items-center justify-between px-4 h-14">
          <Link href="/command" className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-red-gradient flex items-center justify-center text-sm font-black select-none">★</div>
            <span className="font-display font-black text-[14px] text-white">
              Campaign<span className="text-gold-400">Assist</span>
            </span>
          </Link>
          <button
            onClick={() => setOpen(o => !o)}
            className="text-white/70 hover:text-white p-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Open navigation"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {open
                ? <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                : <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              }
            </svg>
          </button>
        </div>

        {/* Spacer */}
        <div className="h-14" />

        {/* Drawer */}
        {mounted && open && createPortal(
          <>
            <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={() => setOpen(false)} />
            <div className="fixed top-0 left-0 bottom-0 w-56 z-[9999] shadow-2xl border-r border-white/10">
              {sidebarBody}
            </div>
          </>,
          document.body
        )}
      </div>
    </>
  )
}
