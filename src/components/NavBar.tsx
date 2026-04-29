'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const links = [
  { href: '/',              label: 'Dashboard'     },
  { href: '/news',          label: 'News Tracker'  },
  { href: '/war-room',      label: '⚡ War Room'   },
  { href: '/media',         label: 'Media Studio'  },
  { href: '/briefing',      label: 'Hot Buttons'   },
  { href: '/legislative',   label: "Let's Fund"    },
  { href: '/constituents',  label: 'Constituents'  },
  { href: '/settings',      label: 'Settings'      },
]

export default function NavBar() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40">
      <div className="h-1 bg-red-gradient" />
      <nav className="bg-navy/95 backdrop-blur-sm text-white px-6 py-0 border-b border-navy-500/50" aria-label="Main navigation">
        <div className="container mx-auto max-w-7xl flex items-center justify-between h-16">

          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group focus:outline-none">
            <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-gradient shadow-glow-red text-lg font-bold select-none shrink-0">★</div>
            <div className="leading-tight">
              <span className="font-display font-bold text-xl tracking-widest uppercase text-white">
                Campaign<span className="text-gold-400">Assist</span>
              </span>
              <p className="text-[9px] uppercase tracking-[0.2em] text-blue-300/70 -mt-0.5">Intelligence · Strategy · Victory</p>
            </div>
          </Link>

          {/* Links */}
          <div className="flex items-center gap-0.5">
            {links.map((l) => {
              const isActive = l.href === '/' ? pathname === '/' : pathname.startsWith(l.href)
              return (
                <Link key={l.href} href={l.href}
                  className={`relative px-3 py-1.5 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-gold-400 ${
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

          {/* Live indicator */}
          <div className="flex items-center gap-2 text-xs text-blue-300/80">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse-slow" aria-hidden="true" />
            <span className="hidden sm:block font-medium tracking-widest uppercase">Live</span>
          </div>
        </div>
      </nav>
      <div className="h-px bg-gold-gradient opacity-40" />
    </header>
  )
}
