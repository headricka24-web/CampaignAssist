export const dynamic = 'force-dynamic'

import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { redirect } from 'next/navigation'
import CommandCenter from '@/components/CommandCenter'

export default async function CommandPage() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) redirect('/login')

  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { name: true, race: true, state: true, raceLevel: true, district: true, county: true, city: true },
  })

  // New user — no candidate yet → guide them to setup first
  if (!candidate) redirect('/my-candidate')

  return <CommandCenter candidate={candidate} />
}
