import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { auth } from '@/auth'

export const maxDuration = 60

async function getContext(userId: string) {
  const candidate = await prisma.candidate.findFirst({
    where: { userId },
    select: { name: true, race: true, state: true, raceLevel: true, district: true, county: true, city: true, bio: true, topIssues: true, electionDate: true, fundraisingGoal: true },
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

  const system = `You are an experienced political media buyer and campaign consultant. You provide accurate, practical media outlet recommendations scaled to the candidate's race level and budget reality. You know that a school board candidate and a congressional candidate need completely different media strategies.`

  const isHyperlocal = level === 'municipal' || level === 'county'

  const user = isHyperlocal
    ? `CANDIDATE: ${c.name}, running for ${c.race} in ${targetGeo}.
RACE LEVEL: ${c.raceLevel} — This is a LOCAL race. TV and radio ads are almost certainly outside this campaign's budget and reach far too wide an audience. Focus exclusively on cost-effective, community-level channels that reach actual voters in this specific geography.

List the key outreach channels for this race. Organize by category — lead with the most important:

## COMMUNITY SOCIAL MEDIA
List the most active local Facebook groups, Nextdoor neighborhoods, and community pages for ${targetGeo}. Include specific group names if known (e.g., "[City] Community Discussion", "[County] Residents Group"). Explain how to use each — organic posts vs. paid boosting. This is the #1 channel for this race level.

## HYPERLOCAL DIGITAL
List 2–4 local news websites, community blogs, neighborhood newsletters, or local news Facebook pages that cover ${targetGeo}. Include whether they accept paid ads or only editorial coverage. Note any free listing/announcement options.

## LOCAL NEWSPAPERS & PRINT
List 1–3 local or community newspapers and shoppers that cover ${targetGeo}. Include print vs. digital options and whether they run political ads. Community weeklies and free shoppers often reach voters TV never does at this level.

## DIRECT MAIL
For a ${level} race, direct mail to registered voters in the precinct or district is often the single most effective paid channel. Note the approximate universe size for ${targetGeo} and typical cost-per-piece range.

## YARD SIGNS & PHYSICAL
Briefly note key high-traffic intersections, community bulletin boards, local events, and placement strategy for physical signage in ${targetGeo}.

## MEDIA BUYING TIP
One specific, budget-conscious tip for this ${level} race — what to spend money on first and what to skip entirely.`

    : `CANDIDATE: ${c.name}, running for ${c.race} in ${targetGeo}.
RACE LEVEL: ${c.raceLevel ?? 'General'}

List the key advertising outlets for this race. Organize by category:

## LOCAL TELEVISION STATIONS
List the major local TV stations/affiliates in this market (name, network affiliation, market). Include the DMA/market name. List 4–6 stations for federal races, 3–4 for state races.

## RADIO STATIONS
List 4–6 key radio stations in this market. Include format (Talk/News, Country, Top 40, etc.) and audience relevance. Flag any conservative talk stations specifically.

## DIGITAL & STREAMING
List 4–5 key digital advertising channels relevant to this race and geography (e.g., local news sites, regional digital outlets, streaming TV platforms, geotargeted social, programmatic).

## LOCAL NEWSPAPERS & PRINT
List 2–4 local newspapers or print publications that matter for this race level. Include whether they have digital ad options.

## COMMUNITY & HYPERLOCAL
Note any district-specific community media, neighborhood newsletters, local Facebook groups, or Nextdoor presences worth supplementing the main buy.

## MEDIA BUYING TIP
One practical tip specific to this race's geography and level for getting the best ad placement value.

Be as specific as possible with real outlet names. Prioritize the most relevant channels for this candidate's race level and geography.`

  try {
    const content = await ask(system, user, 900)
    return NextResponse.json({ content, geo: targetGeo })
  } catch {
    return NextResponse.json({ error: 'ai_unavailable' }, { status: 500 })
  }
}
