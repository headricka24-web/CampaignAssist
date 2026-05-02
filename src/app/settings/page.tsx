export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import CandidateForm from '@/components/CandidateForm'
import CandidateList from '@/components/CandidateList'

export default async function SettingsPage() {
  const session    = await auth()
  const userId     = session?.user?.id ?? null
  const candidates = await prisma.candidate.findMany({
    where:   userId ? { userId } : { userId: null },
    orderBy: { name: 'asc' },
  })
  const first = candidates[0] ?? null

  return (
    <section aria-labelledby="settings-heading">
      <h1 id="settings-heading" className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="max-w-2xl space-y-8">
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">
            {first ? 'Candidate Settings' : 'Add Your Candidate'}
          </h2>
          {!first && (
            <p className="text-sm text-gray-400 mb-4">
              Set up your candidate to personalize your intelligence feed, constituent profiles, and voter analysis.
            </p>
          )}
          <div className="bg-white border border-gray-200 rounded-2xl p-6">
            <CandidateForm existing={first} />
          </div>
        </div>

        {candidates.length > 0 && (
          <div>
            <h2 className="font-semibold text-gray-700 mb-3">All Candidates</h2>
            <CandidateList candidates={candidates} />
          </div>
        )}
      </div>
    </section>
  )
}
