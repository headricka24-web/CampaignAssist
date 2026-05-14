'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

// ── Navigation structure ──────────────────────────────────────────────────────

const NAV_GROUPS = [
  {
    category: 'Command',
    icon: '◈',
    links: [
      { href: '/dashboard', label: 'Dashboard',       icon: '⊞' },
      { href: '/victory',   label: 'Path to Victory', icon: '★' },
    ],
  },
  {
    category: 'Intelligence',
    icon: '◉',
    links: [
      { href: '/war-room',     label: 'War Room',     icon: '🛡' },
      { href: '/briefing',     label: 'Hot Buttons',  icon: '⚡' },
      { href: '/news',         label: 'News Feed',    icon: '◎' },
      { href: '/constituents', label: 'Constituents', icon: '◑' },
    ],
  },
  {
    category: 'Communications',
    icon: '◈',
    links: [
      { href: '/media',       label: 'Media Studio',   icon: '✦' },
      { href: '/legislative', label: "Let's Fund",     icon: '◆' },
      { href: '/press',       label: 'Press Contacts', icon: '◇' },
    ],
  },
  {
    category: 'Field Ops',
    icon: '◉',
    links: [
      { href: '/outreach', label: 'Outreach', icon: '◎' },
      { href: '/voters',   label: 'Voters',   icon: '◑' },
    ],
  },
  {
    category: 'Finance',
    icon: '◈',
    links: [
      { href: '/budget', label: 'Budget', icon: '◆' },
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
  const [open,    setOpen]    = useState(false) // mobile drawer
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

  // ── Shared sidebar body ───────────────────────────────────────────────────
  const sidebarBody = (
    <div className="flex flex-col h-full bg-[#0f2744] text-white overflow-y-auto">

      {/* Logo */}
      <div className="px-5 pt-6 pb-5 border-b border-white/10 shrink-0">
        <Link href="/dashboard" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
          <div className="w-8 h-8 rounded-full bg-red-gradient shadow-glow-red flex items-center justify-center text-sm font-bold shrink-0">★</div>
          <div className="leading-tight">
            <p className="font-display font-bold text-base tracking-widest uppercase text-white">
              Campaign<span className="text-gold-400">Assist</span>
            </p>
            <p className="text-[9px] uppercase tracking-[0.18em] text-blue-300/60 -mt-0.5">Intelligence · Strategy · Victory</p>
          </div>
        </Link>
      </div>

      {/* Nav groups */}
      <nav className="flex-1 px-3 py-4 space-y-5 overflow-y-auto" aria-label="Main navigation">
        {NAV_GROUPS.map((group, i) => (
          <div key={group.category}>
            {/* Section divider + label */}
            {i > 0 && <div className="h-px bg-white/10 mb-4" />}
            <p className="px-2 mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-white/50">
              {group.category}
            </p>

            {/* Links */}
            <div className="space-y-0.5">
              {group.links.map(link => {
                const active = isActive(link.href)
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all group ${
                      active
                        ? 'bg-white/10 text-white'
                        : 'text-blue-200/70 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {/* Active indicator */}
                    <span className={`w-1 h-5 rounded-full transition-all shrink-0 ${active ? 'bg-gold-400' : 'bg-transparent group-hover:bg-white/20'}`} />
                    <span className="text-xs w-4 text-center shrink-0 opacity-60">{link.icon}</span>
                    <span>{link.label}</span>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Divider */}
      <div className="h-px bg-white/10 mx-4 shrink-0" />

      {/* My Candidate — gold CTA */}
      <div className="px-3 py-3 shrink-0">
        <Link
          href="/my-candidate"
          onClick={() => setOpen(false)}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-black uppercase tracking-wide transition-all ${
            pathname === '/my-candidate'
              ? 'bg-gold-400 text-[#0f2744]'
              : 'text-gold-400 hover:bg-gold-400 hover:text-[#0f2744] border border-gold-400/30'
          }`}
        >
          <span className="w-1 h-5 rounded-full bg-transparent shrink-0" />
          <span className="text-xs w-4 text-center shrink-0">★</span>
          My Candidate
        </Link>
      </div>

      {/* User footer */}
      <div className="px-3 pb-5 shrink-0 space-y-1">
        <div className="flex items-center gap-2.5 px-3 py-2">
          <div className="w-7 h-7 rounded-full bg-gold-400 flex items-center justify-center text-[#0f2744] text-xs font-black shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-white truncate">{userName || userEmail}</p>
            {userName && <p className="text-[10px] text-blue-300/50 truncate">{userEmail}</p>}
          </div>
        </div>

        <Link
          href="/settings"
          onClick={() => setOpen(false)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-blue-300/60 hover:text-white hover:bg-white/5 transition-all"
        >
          <span className="w-1 h-4 rounded-full shrink-0" />
          <span className="w-4 text-center shrink-0 text-xs">⚙</span>
          Settings
        </Link>

        <button
          onClick={handleSignOut}
          className="w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs text-red-400/70 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <span className="w-1 h-4 rounded-full shrink-0" />
          <span className="w-4 text-center shrink-0 text-xs">↩</span>
          Sign Out
        </button>

        {/* Live indicator */}
        <div className="flex items-center gap-1.5 px-3 pt-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" />
          <span className="text-[10px] font-bold tracking-widest uppercase text-green-400">Live</span>
        </div>
      </div>
    </div>
  )

  return (
    <>
      {/* ── Desktop: static sidebar ─────────────────────────────────────── */}
      <aside className="hidden lg:flex flex-col w-56 shrink-0 sticky top-0 h-screen">
        {sidebarBody}
      </aside>

      {/* ── Mobile: hamburger + drawer ──────────────────────────────────── */}
      <div className="lg:hidden">
        {/* Top bar */}
        <div className="fixed top-0 left-0 right-0 z-40 bg-[#0f2744] border-b border-white/10 flex items-center justify-between px-4 h-14">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-red-gradient flex items-center justify-center text-sm font-bold">★</div>
            <span className="font-display font-bold text-sm tracking-widest uppercase text-white">
              Campaign<span className="text-gold-400">Assist</span>
            </span>
          </Link>
          <button
            onClick={() => setOpen(o => !o)}
            className="text-white p-2 rounded-lg hover:bg-white/10 transition"
            aria-label="Open navigation menu"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
              {open
                ? <path fillRule="evenodd" clipRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" />
                : <path fillRule="evenodd" clipRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" />
              }
            </svg>
          </button>
        </div>

        {/* Spacer so content clears the fixed top bar */}
        <div className="h-14" />

        {/* Drawer overlay */}
        {mounted && open && createPortal(
          <>
            <div className="fixed inset-0 bg-black/60 z-[9998]" onClick={() => setOpen(false)} />
            <div className="fixed top-0 left-0 bottom-0 w-64 z-[9999] shadow-2xl">
              {sidebarBody}
            </div>
          </>,
          document.body
        )}
      </div>
    </>
  )
}
