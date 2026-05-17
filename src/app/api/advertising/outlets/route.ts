import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { auth } from '@/auth'

export const maxDuration = 60

async function getContext(userId: string) {
  const candidate = await prisma.candidate.findFirst({
    where: { userId },
    select: { name: true, race: true, state: true, raceLevel: true, district: true, county: true, city: true },
  })
  return candidate ?? null
}

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const c = await getContext(userId)
  if (!c) return NextResponse.json({ error: 'no_candidate' }, { status: 400 })

  const level = (c.raceLevel ?? '').toLowerCase()
  const geo = (() => {
    if (level === 'federal'   && c.district) return `${c.state} Congressional District ${c.district}`
    if (level === 'state'     && c.district) return `${c.state} District ${c.district}`
    if (level === 'county'    && c.county)   return `${c.county} County, ${c.state}`
    if (level === 'municipal' && c.city)     return `${c.city}, ${c.state}`
    return c.state
  })()

  // Optionally read body for a custom geo override
  let customGeo: string | null = null
  try {
    const body = await req.json()
    customGeo = body?.geo ?? null
  } catch { /* no body */ }

  const targetGeo = customGeo ?? geo

  const system = `You are a Republican political media buyer and campaign consultant. You provide accurate, practical media outlet lists for political ad placement. You know the local TV stations, radio stations, digital news sites, and print publications for every region of the country.`

  const user = `CANDIDATE: ${c.name}, running for ${c.race} in ${targetGeo}.
RACE LEVEL: ${c.raceLevel ?? 'General'}

List the key advertising outlets for this race. Organize by category:

## LOCAL TELEVISION STATIONS
List the major local TV stations/affiliates in this market (name, network affiliation, market). Include the DMA/market name. For federal and state races, list 4–6 stations. For county/municipal, note if local cable access or regional stations are more relevant.

## RADIO STATIONS
List 4–6 key radio stations in this market. Include format (Talk/News, Country, Top 40, etc.) and why it matters for a Republican candidate. Flag any conservative talk stations specifically.

## DIGITAL & STREAMING
List 4–5 key digital advertising channels relevant to this race and geography (e.g., local news sites, regional digital outlets, streaming TV platforms used in this market, geotargeted social).

## LOCAL NEWSPAPERS & PRINT
List 2–4 local newspapers or print publications that matter for this race level. Include whether they have digital ad options.

## HYPERLOCAL / COMMUNITY
For county and municipal races: list any community newsletters, local Facebook groups, NextDoor presence, or hyperlocal digital outlets worth targeting. For federal/state: note any district-specific community media.

## MEDIA BUYING TIP
One practical tip specific to this race's geography and level for getting the best ad placement value.

Be as specific as possible with real outlet names. If the exact market has many options, prioritize the most politically relevant for a Republican campaign.`

  try {
    const content = await ask(system, user, 900)
    return NextResponse.json({ content, geo: targetGeo })
  } catch {
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 500 })
  }
}
