export const dynamic = 'force-dynamic'

import { prisma } from '@/lib/db'
import OutletForm from '@/components/OutletForm'
import CandidateForm from '@/components/CandidateForm'
import CandidateList from '@/components/CandidateList'

export default async function SettingsPage() {
  const [candidates, outlets] = await Promise.all([
    prisma.candidate.findMany({ orderBy: { name: 'asc' } }),
    prisma.outlet.findMany({ orderBy: { name: 'asc' } }),
  ])

  return (
    <section aria-labelledby="settings-heading">
      <h1 id="settings-heading" className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Candidates</h2>
          <CandidateForm />
          <CandidateList candidates={candidates} />
        </div>
        <div>
          <h2 className="font-semibold text-gray-700 mb-3">Outlets</h2>
          <OutletForm />
          <ul className="mt-4 space-y-2">
            {outlets.map(o => (
              <li key={o.id} className="text-sm bg-white border border-gray-200 rounded px-3 py-2">
                <span className="font-medium">{o.name}</span>
                <span className="text-gray-400 ml-2">{o.type}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
