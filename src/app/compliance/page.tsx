export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import CampaignCompliance from '@/components/CampaignCompliance'

export default async function CompliancePage() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) redirect('/login')

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { name: true, race: true, state: true, raceLevel: true },
  })

  return <CampaignCompliance candidate={candidate} />
}
