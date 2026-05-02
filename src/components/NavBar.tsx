'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { useState } from 'react'

const links = [
  { href: '/dashboard',    label: 'Dashboard'     },
  { href: '/news',         label: 'News Tracker'  },
  { href: '/war-room',     label: '⚡ War Room'   },
  { href: '/outreach',     label: '📋 Outreach'   },
  { href: '/voters',       label: '🗳️ Voters'     },
  { href: '/media',        label: 'Media Studio'  },
  { href: '/briefing',     label: 'Hot Buttons'   },
  { href: '/legislative',  label: "Let's Fund"    },
  { href: '/constituents', label: 'Constituents'  },
  { href: '/settings',     label: 'Settings'      },
]

export default function NavBar({ userEmail, userName }: { userEmail: string; userName: string }) {
  const pathname = usePathname()
  const router   = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)

  async function handleSignOut() {
    await signOut({ redirect: false })
    router.push('/')
    router.refresh()
  }

  const initials = userName
    ? userName.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2)
    : userEmail.slice(0, 2).toUpperCase()

  return (
    <header className="sticky top-0 z-40">
      <div className="h-1 bg-red-gradient" />
      <nav className="bg-navy/95 backdrop-blur-sm text-white px-6 py-0 border-b border-navy-500/50" aria-label="Main navigation">
        <div className="container mx-auto max-w-7xl flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/dashboard" className="flex items-center gap-3 group focus:outline-none">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-gradient shadow-glow-red text-lg font-bold select-none shrink-0">★</div>
            <div className="leading-tight">
              <span className="font-display font-bold text-xl tracking-widest uppercase text-white">
                Campaign<span className="text-gold-400">Assist</span>
              </span>
              <p className="text-[9px] uppercase tracking-[0.2em] text-blue-300/70 -mt-0.5">Intelligence · Strategy · Victory</p>
            </div>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-0.5 overflow-x-auto">
            {links.map((l) => {
              const isActive = pathname === l.href || (l.href !== '/dashboard' && pathname.startsWith(l.href))
              return (
                <Link key={l.href} href={l.href}
                  className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all whitespace-nowrap focus:outline-none focus:ring-2 focus:ring-gold-400 ${
                    isActive
                      ? 'text-white bg-navy-500/80'
                      : 'text-blue-300 hover:text-white hover:bg-navy-500/50'
                  }`}>
                  {l.label}
                  {isActive && <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gold-400 rounded-full" />}
                </Link>
              )
            })}
          </div>

          {/* User menu */}
          <div className="relative flex items-center gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 border border-navy-400/60 px-2.5 py-1 rounded-full text-xs text-blue-300/80">
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse-slow" aria-hidden="true" />
              <span className="font-bold tracking-widest uppercase text-green-400">Live</span>
            </div>

            <button
              onClick={() => setMenuOpen(o => !o)}
              className="flex items-center gap-2 bg-navy-500/50 hover:bg-navy-500 border border-navy-400/50 rounded-xl px-3 py-1.5 transition-colors focus:outline-none focus:ring-2 focus:ring-gold-400"
            >
              <div className="w-7 h-7 rounded-full bg-gold-400 flex items-center justify-center text-navy text-xs font-black select-none">
                {initials}
              </div>
              <span className="text-xs text-blue-200 hidden md:block max-w-[120px] truncate">{userName || userEmail}</span>
              <span className="text-blue-400 text-xs">▾</span>
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-xs font-black text-navy uppercase tracking-wide truncate">{userName || 'Account'}</p>
                  <p className="text-xs text-gray-400 truncate">{userEmail}</p>
                </div>
                <Link href="/settings"
                  onClick={() => setMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-sm text-navy hover:bg-gray-50 transition-colors">
                  ⚙️ Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition-colors border-t border-gray-100"
                >
                  ↩ Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </nav>
      <div className="h-px bg-gold-gradient opacity-40" />
    </header>
  )
}
