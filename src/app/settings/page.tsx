export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import CandidateForm from '@/components/CandidateForm'
import CandidateList from '@/components/CandidateList'

export default async function SettingsPage() {
  const candidates = await prisma.candidate.findMany({ orderBy: { name: 'asc' } })

  return (
    <section aria-labelledby="settings-heading">
      <h1 id="settings-heading" className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="max-w-lg">
        <h2 className="font-semibold text-gray-700 mb-3">Candidates</h2>
        <CandidateForm />
        <CandidateList candidates={candidates} />
      </div>
    </section>
  )
}
