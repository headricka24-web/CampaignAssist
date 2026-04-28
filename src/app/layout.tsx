import type { Metadata } from 'next'
import './globals.css'
import NavBar from '@/components/NavBar'

export const metadata: Metadata = {
  title: 'CampaignAssist — Your Political Intelligence War Room',
  description: 'AI-powered campaign intelligence. Monitor every story. Own the narrative.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <a href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:p-3 focus:bg-navy focus:text-white focus:rounded-br-lg">
          Skip to main content
        </a>

        <NavBar />

        <main id="main-content" className="flex-1 container mx-auto px-4 py-8 max-w-7xl">
          {children}
        </main>

        <footer className="bg-navy mt-16">
          <div className="h-px bg-gold-gradient opacity-60" />
          <div className="container mx-auto max-w-7xl px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-full bg-red-gradient flex items-center justify-center text-sm">★</div>
              <span className="font-display font-bold tracking-widest uppercase text-white">
                Campaign<span className="text-gold-400">Assist</span>
              </span>
              <span className="text-navy-400 hidden sm:block">·</span>
              <span className="text-blue-400 hidden sm:block">Intelligence · Strategy · Victory</span>
            </div>
            <div className="flex items-center gap-4 text-blue-400/70">
              <span>AI-Powered Campaign Intelligence</span>
              <span className="w-1 h-1 rounded-full bg-navy-400" />
              <span>Built for those who serve.</span>
            </div>
          </div>
          <div className="h-1 bg-red-gradient opacity-60" />
        </footer>
      </body>
    </html>
  )
}
