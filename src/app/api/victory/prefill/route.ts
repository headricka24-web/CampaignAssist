import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

export const maxDuration = 45

// State abbreviation → FIPS code
const STATE_FIPS: Record<string, string> = {
  AL:'01', AK:'02', AZ:'04', AR:'05', CA:'06', CO:'08', CT:'09', DE:'10',
  FL:'12', GA:'13', HI:'15', ID:'16', IL:'17', IN:'18', IA:'19', KS:'20',
  KY:'21', LA:'22', ME:'23', MD:'24', MA:'25', MI:'26', MN:'27', MS:'28',
  MO:'29', MT:'30', NE:'31', NV:'32', NH:'33', NJ:'34', NM:'35', NY:'36',
  NC:'37', ND:'38', OH:'39', OK:'40', OR:'41', PA:'42', RI:'44', SC:'45',
  SD:'46', TN:'47', TX:'48', UT:'49', VT:'50', VA:'51', WA:'53', WV:'54',
  WI:'55', WY:'56', DC:'11',
}

const CENSUS_KEY = process.env.CENSUS_API_KEY!
const ACS = 'https://api.census.gov/data/2023/acs/acs5'

async function fetchCVAP(stateFips: string, level: string, district: string | null, county: string | null): Promise<number | null> {
  try {
    let url: string

    if (level === 'federal' && district) {
      // Congressional district
      url = `${ACS}?get=B29001_001E&for=congressional%20district:${district.padStart(2,'0')}&in=state:${stateFips}&key=${CENSUS_KEY}`
    } else if (level === 'county' && county) {
      // All counties in state, then match by name
      url = `${ACS}?get=NAME,B29001_001E&for=county:*&in=state:${stateFips}&key=${CENSUS_KEY}`
      const res  = await fetch(url)
      const rows = await res.json() as string[][]
      // rows[0] is header, find matching county
      const match = rows.slice(1).find(r =>
        r[0].toLowerCase().includes(county.toLowerCase())
      )
      return match ? Math.round(parseInt(match[1]) * 0.75) : null
    } else {
      // State-level (covers statewide, state legislative, and municipal fallback)
      url = `${ACS}?get=B29001_001E&for=state:${stateFips}&key=${CENSUS_KEY}`
    }

    const res  = await fetch(url)
    const rows = await res.json() as string[][]
    const cvap = parseInt(rows[1]?.[0] ?? '0')
    if (!cvap || isNaN(cvap)) return null
    // CVAP → estimated registered voters (~75% registration rate)
    return Math.round(cvap * 0.75)
  } catch {
    return null
  }
}

async function fetchVotingPatterns(candidate: {
  name: string; race: string; state: string; raceLevel: string | null
  district: string | null; county: string | null; city: string | null
  party: string | null
}): Promise<{ turnout: number; gopBase: number; analysis: string }> {
  const geo = (() => {
    const l = (candidate.raceLevel ?? '').toLowerCase()
    if (l === 'federal'   && candidate.district) return `${candidate.state} Congressional District ${candidate.district}`
    if (l === 'state'     && candidate.district) return `${candidate.state} State District ${candidate.district}`
    if (l === 'county'    && candidate.county)   return `${candidate.county} County, ${candidate.state}`
    if (l === 'municipal' && candidate.city)     return `${candidate.city}, ${candidate.state}`
    return `${candidate.state} (statewide)`
  })()

  const system = `You are a political data analyst who specializes in election modeling. You respond with precise JSON only — no commentary, no markdown.`

  const user = `Based on historical voting data you know from your training, provide election modeling estimates for this race:

CANDIDATE: ${candidate.name}
RACE: ${candidate.race}
GEOGRAPHY: ${geo}
RACE LEVEL: ${candidate.raceLevel ?? 'state'}
PARTY: ${candidate.party ?? 'Republican'}

Using actual historical results from 2018–2024 elections in this geography, provide:
1. Expected TURNOUT RATE (%) — what % of registered voters typically cast ballots in this type of race at this level in this geography
2. GOP BASE PERFORMANCE (%) — what % of total expected votes the Republican candidate can count on from base voters, based on recent presidential/statewide results
3. A 1-sentence analysis of the political lean and trend

Respond with ONLY valid JSON in this exact format:
{
  "turnout": <integer 15-90>,
  "gopBase": <integer 20-70>,
  "analysis": "<one sentence on lean and trend>"
}`

  const raw = await ask(system, user, 200)

  try {
    const cleaned = raw.replace(/```json\n?|```/g, '').trim()
    const parsed  = JSON.parse(cleaned)
    return {
      turnout:  Math.max(15, Math.min(90, parseInt(parsed.turnout)  || 45)),
      gopBase:  Math.max(20, Math.min(70, parseInt(parsed.gopBase)  || 46)),
      analysis: parsed.analysis ?? '',
    }
  } catch {
    return { turnout: 45, gopBase: 46, analysis: '' }
  }
}

export async function GET() {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const candidate = await prisma.candidate.findFirst({
    where: { userId },
    select: { name: true, race: true, state: true, raceLevel: true, district: true, county: true, city: true, party: true },
  })
  if (!candidate) return NextResponse.json({ error: 'no_candidate' }, { status: 400 })

  const stateFips  = STATE_FIPS[candidate.state.toUpperCase()] ?? null
  const raceLevel  = (candidate.raceLevel ?? 'state').toLowerCase()

  // Fetch Census + Claude in parallel
  const [censusVoters, patterns] = await Promise.all([
    stateFips ? fetchCVAP(stateFips, raceLevel, candidate.district, candidate.county) : Promise.resolve(null),
    fetchVotingPatterns(candidate),
  ])

  return NextResponse.json({
    registeredVoters: censusVoters,
    turnout:          patterns.turnout,
    gopBase:          patterns.gopBase,
    analysis:         patterns.analysis,
    source:           censusVoters
      ? 'Registered voters estimated from 2023 Census ACS citizen voting-age population. Turnout & party lean from 2018–2024 historical results.'
      : 'Census data unavailable for this geography. Turnout & party lean from 2018–2024 historical results.',
  })
}
