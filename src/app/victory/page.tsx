export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import VictoryCalculator from '@/components/VictoryCalculator'

export default async function VictoryPage() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) redirect('/login')

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { id: true, name: true, race: true, state: true, raceLevel: true, district: true, county: true, city: true },
  })

  // Pull live outreach totals
  const cid = candidate?.id ?? ''
  const [totalContacts, totalVoters, raisedTotal] = await Promise.all([
    cid ? prisma.contact.count({ where: { candidateId: cid } }) : Promise.resolve(0),
    cid ? prisma.voter.count({ where: { candidateId: cid } }) : Promise.resolve(0),
    cid ? prisma.donor.aggregate({ where: { candidateId: cid }, _sum: { amount: true } }) : Promise.resolve({ _sum: { amount: 0 } }),
  ])

  return (
    <VictoryCalculator
      candidate={candidate}
      totalContacts={totalContacts}
      totalVoters={totalVoters}
      totalRaised={raisedTotal._sum.amount ?? 0}
    />
  )
}
