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

  if (!candidate) redirect('/my-candidate')

  let electionDate = ''
  try {
    const vp = await prisma.generatedContent.findUnique({
      where:  { userId_type: { userId, type: 'victory-plan' } },
      select: { content: true },
    })
    if (vp) electionDate = (JSON.parse(vp.content) as { electionDate?: string }).electionDate ?? ''
  } catch {}

  return <CommandCenter candidate={candidate} electionDate={electionDate} />
}
