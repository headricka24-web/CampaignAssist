import type { Metadata } from 'next'
import './globals.css'
import Sidebar from '@/components/Sidebar'
import AuthProvider from '@/components/AuthProvider'
import { auth } from '@/auth'

export const metadata: Metadata = {
  title: 'CampaignAssist — AI-Powered Campaign Intelligence Platform',
  description: 'The all-in-one platform for modern political campaigns. Real-time news intelligence, constituent profiles, voter strategy, and AI-powered tools — built for every candidate.',
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const session  = await auth()
  const isLoggedIn = !!session?.user

  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50">
        <AuthProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-navy focus:text-white focus:rounded-br-lg"
          >
            Skip to main content
          </a>

          {isLoggedIn ? (
            /* ── Authenticated: sidebar + content ──────────────────────── */
            <div className="flex min-h-screen">
              <Sidebar
                userEmail={session.user.email ?? ''}
                userName={session.user.name  ?? ''}
              />

              {/* Main content column */}
              <div className="flex-1 flex flex-col min-w-0">
                <main id="main-content" className="flex-1 p-6">
                  {children}
                </main>

                <footer className="bg-[#0f2744] mt-16 shrink-0">
                  <div className="h-px bg-gold-gradient opacity-60" />
                  <div className="px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-red-gradient flex items-center justify-center text-xs">★</div>
                      <span className="font-display font-bold tracking-widest uppercase text-white">
                        Campaign<span className="text-gold-400">Assist</span>
                      </span>
                      <span className="text-blue-300/50 hidden sm:block">·</span>
                      <span className="text-blue-300/50 hidden sm:block">Intelligence · Strategy · Victory</span>
                    </div>
                    <div className="flex items-center gap-4 text-blue-400/50">
                      <span>The political intelligence platform built to win.</span>
                      <span className="text-gold-400/50">© {new Date().getFullYear()}</span>
                    </div>
                  </div>
                  <div className="h-1 bg-red-gradient opacity-60" />
                </footer>
              </div>
            </div>
          ) : (
            /* ── Unauthenticated: full-width ───────────────────────────── */
            <main id="main-content" className="min-h-screen">
              {children}
            </main>
          )}
        </AuthProvider>
      </body>
    </html>
  )
}
