export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import CandidateForm from '@/components/CandidateForm'
import CandidateList from '@/components/CandidateList'

export default async function MyCandidatePage() {
  const session    = await auth()
  const userId     = session?.user?.id ?? null
  const candidates = await prisma.candidate.findMany({
    where:   userId ? { userId } : { userId: null },
    orderBy: { name: 'asc' },
  })
  const first = candidates[0] ?? null
  const isNew = candidates.length === 0

  return (
    <section>
      {isNew ? (
        /* ── New user: welcome + onboarding ── */
        <div className="mb-10">
          <div className="inline-flex items-center gap-2 bg-gold-400/10 border border-gold-400/20 text-gold-600 text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-full mb-5">
            ★ Welcome to CampaignAssist
          </div>
          <h1 className="font-display font-black text-navy text-4xl md:text-5xl leading-tight mb-4">
            Let&apos;s get<br />
            <span className="text-red-500">started.</span>
          </h1>
          <p className="text-gray-500 text-base max-w-xl leading-relaxed">
            Your candidate drives everything on this platform. Add them below and CampaignAssist will personalize your intelligence operations, constituent profiles, voter analysis, and every command function around your specific race.
          </p>
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-400">
            <span className="w-5 h-5 rounded-full bg-navy text-white text-[10px] flex items-center justify-center font-black shrink-0">1</span>
            Fill in your candidate details below to activate your full campaign command center.
          </div>
        </div>
      ) : (
        /* ── Returning user: standard header ── */
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-full bg-red-gradient flex items-center justify-center text-xl shadow-glow-red select-none">★</div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-gold-600 font-black mb-0.5">Campaign HQ</p>
              <h1 className="font-display font-black text-navy text-3xl">My Candidate</h1>
            </div>
          </div>
          <p className="text-gray-400 text-sm ml-[52px]">Update your candidate details, race info, and geographic settings.</p>
        </div>
      )}

      <div className="max-w-2xl space-y-8">
        <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
          {isNew && (
            <div className="bg-navy px-6 py-4 flex items-center gap-3 border-b border-navy-500/50">
              <span className="text-gold-400 text-xl">📋</span>
              <div>
                <p className="text-white font-black text-sm uppercase tracking-wide">Candidate Setup</p>
                <p className="text-blue-300/60 text-xs mt-0.5">Fill in the details below to activate your command center.</p>
              </div>
            </div>
          )}
          <div className="p-6">
            <CandidateForm existing={first} />
          </div>
        </div>

        {candidates.length > 1 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-3">All Candidates</h2>
            <CandidateList candidates={candidates} />
          </div>
        )}
      </div>
    </section>
  )
}
