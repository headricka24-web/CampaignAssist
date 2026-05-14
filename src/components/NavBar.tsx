'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const links = [
  { href: '/dashboard',    label: 'Dashboard'    },
  { href: '/news',         label: 'News'         },
  { href: '/war-room',     label: 'War Room'     },
  { href: '/outreach',     label: 'Outreach'     },
  { href: '/voters',       label: 'Voters'       },
  { href: '/media',        label: 'Media'        },
  { href: '/briefing',     label: 'Hot Buttons'  },
  { href: '/legislative',  label: "Let's Fund"   },
  { href: '/constituents', label: 'Constituents' },
  { href: '/victory',      label: '★ Victory'    },
]

export default function NavBar({
  userEmail,
  userName,
}: {
  userEmail: string
  userName: string
}) {
  const pathname   = usePathname()
  const router     = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const [mounted,  setMounted]  = useState(false)
  const buttonRef  = useRef<HTMLButtonElement>(null)

  useEffect(() => { setMounted(true) }, [])
  useEffect(() => { setMenuOpen(false) }, [pathname])

  async function handleSignOut() {
    setMenuOpen(false)
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase()

  const isMyCandidateActive = pathname === '/my-candidate'

  return (
    <header className="sticky top-0 z-50">
      <div className="h-1 bg-red-gradient" />
      <nav className="bg-navy/95 backdrop-blur-sm text-white px-6 py-0 border-b border-navy-500/50" aria-label="Main navigation">
        <div className="container mx-auto max-w-7xl flex items-center justify-between h-16 gap-3">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group focus:outline-none shrink-0">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-gradient shadow-glow-red text-lg font-bold select-none shrink-0">★</div>
            <div className="leading-tight hidden sm:block">
              <span className="font-display font-bold text-xl tracking-widest uppercase text-white">
                Campaign<span className="text-gold-400">Assist</span>
              </span>
              <p className="text-[9px] uppercase tracking-[0.2em] text-blue-300/70 -mt-0.5">Intelligence · Strategy · Victory</p>
            </div>
          </Link>

          {/* Nav links */}
          <div className="flex items-center gap-0 overflow-x-auto flex-1 justify-center">
            {links.map((l) => {
              const isActive = pathname === l.href || (l.href !== '/dashboard' && pathname.startsWith(l.href))
              return (
                <Link key={l.href} href={l.href}
                  className={`relative px-2 py-1.5 text-xs font-medium rounded-md transition-all whitespace-nowrap focus:outline-none focus:ring-1 focus:ring-gold-400 ${
                    isActive
                      ? 'text-white bg-navy-500/80'
                      : 'text-blue-300 hover:text-white hover:bg-navy-500/50'
                  }`}>
                  {l.label}
                  {isActive && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-gold-400 rounded-full" />}
                </Link>
              )
            })}

            {/* MY CANDIDATE — always gold, more prominent */}
            <Link href="/my-candidate"
              className={`relative px-2 py-1.5 text-xs font-black rounded-md transition-all whitespace-nowrap uppercase tracking-wide focus:outline-none focus:ring-1 focus:ring-gold-400 ${
                isMyCandidateActive
                  ? 'text-navy bg-gold-400'
                  : 'text-gold-400 hover:text-navy hover:bg-gold-400 border border-gold-400/40 hover:border-gold-400'
              }`}>
              ★ My Candidate
              {isMyCandidateActive && <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-navy rounded-full" />}
            </Link>
          </div>

          {/* Right side: user menu trigger */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 border border-navy-400/60 px-2.5 py-1 rounded-full text-xs text-blue-300/80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" aria-hidden="true" />
              <span className="font-bold tracking-widest uppercase text-green-400">Live</span>
            </div>

            <button
              ref={buttonRef}
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 bg-navy-500/50 hover:bg-navy-500 border border-navy-400/50 rounded-xl px-3 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <div className="w-7 h-7 rounded-full bg-gold-400 flex items-center justify-center text-navy text-xs font-black select-none">
                {initials}
              </div>
              <span className="text-xs text-blue-200 hidden md:block max-w-[100px] truncate">{userName || userEmail}</span>
              <span className="text-blue-400 text-xs">▾</span>
            </button>
          </div>
        </div>
      </nav>
      <div className="h-px bg-gold-gradient opacity-40" />

      {/* Portal: renders directly into document.body, escaping all stacking contexts */}
      {mounted && menuOpen && createPortal(
        <>
          <div className="fixed inset-0 z-[9998]" onClick={() => setMenuOpen(false)} />
          <div className="fixed right-6 top-[4.5rem] w-52 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-[9999]">
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-black text-navy uppercase tracking-wide truncate">{userName || 'Account'}</p>
              <p className="text-xs text-gray-400 truncate">{userEmail}</p>
            </div>
            <Link href="/my-candidate"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm text-navy hover:bg-gold-50 font-semibold transition-colors">
              ★ My Candidate
            </Link>
            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
            >
              ↩ Sign Out
            </button>
          </div>
        </>,
        document.body
      )}
    </header>
  )
}
