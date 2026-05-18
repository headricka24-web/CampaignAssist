import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

export const maxDuration = 45

// Full state name AND abbreviation → FIPS code
const STATE_FIPS: Record<string, string> = {
  // Abbreviations
  AL:'01', AK:'02', AZ:'04', AR:'05', CA:'06', CO:'08', CT:'09', DE:'10',
  FL:'12', GA:'13', HI:'15', ID:'16', IL:'17', IN:'18', IA:'19', KS:'20',
  KY:'21', LA:'22', ME:'23', MD:'24', MA:'25', MI:'26', MN:'27', MS:'28',
  MO:'29', MT:'30', NE:'31', NV:'32', NH:'33', NJ:'34', NM:'35', NY:'36',
  NC:'37', ND:'38', OH:'39', OK:'40', OR:'41', PA:'42', RI:'44', SC:'45',
  SD:'46', TN:'47', TX:'48', UT:'49', VT:'50', VA:'51', WA:'53', WV:'54',
  WI:'55', WY:'56', DC:'11',
  // Full names
  'ALABAMA':'01','ALASKA':'02','ARIZONA':'04','ARKANSAS':'05','CALIFORNIA':'06',
  'COLORADO':'08','CONNECTICUT':'09','DELAWARE':'10','FLORIDA':'12','GEORGIA':'13',
  'HAWAII':'15','IDAHO':'16','ILLINOIS':'17','INDIANA':'18','IOWA':'19',
  'KANSAS':'20','KENTUCKY':'21','LOUISIANA':'22','MAINE':'23','MARYLAND':'24',
  'MASSACHUSETTS':'25','MICHIGAN':'26','MINNESOTA':'27','MISSISSIPPI':'28',
  'MISSOURI':'29','MONTANA':'30','NEBRASKA':'31','NEVADA':'32',
  'NEW HAMPSHIRE':'33','NEW JERSEY':'34','NEW MEXICO':'35','NEW YORK':'36',
  'NORTH CAROLINA':'37','NORTH DAKOTA':'38','OHIO':'39','OKLAHOMA':'40',
  'OREGON':'41','PENNSYLVANIA':'42','RHODE ISLAND':'44','SOUTH CAROLINA':'45',
  'SOUTH DAKOTA':'46','TENNESSEE':'47','TEXAS':'48','UTAH':'49','VERMONT':'50',
  'VIRGINIA':'51','WASHINGTON':'53','WEST VIRGINIA':'54','WISCONSIN':'55',
  'WYOMING':'56','DISTRICT OF COLUMBIA':'11',
}

const CENSUS_KEY = process.env.CENSUS_API_KEY!
const ACS = 'https://api.census.gov/data/2023/acs/acs5'

function stateFips(state: string): string | null {
  return STATE_FIPS[state.trim().toUpperCase()] ?? null
}

// Parse district to a zero-padded 2-digit string.
// Returns "00" for at-large (0, "AL", "at-large"). Returns null only when no district is provided.
function parseDistrict(d: string | null): string | null {
  if (!d) return null
  const trimmed = d.trim().toLowerCase()
  if (trimmed === 'al' || trimmed === 'at-large' || trimmed === 'at large') return '00'
  const n = parseInt(d.replace(/\D/g, ''), 10)
  if (isNaN(n) || n < 0) return null
  return String(n).padStart(2, '0')
}

async function censusGet(url: string): Promise<string[][] | null> {
  try {
    const res = await fetch(url)
    if (!res.ok) return null
    const data = await res.json()
    return Array.isArray(data) ? data as string[][] : null
  } catch {
    return null
  }
}

async function fetchCVAP(
  fips: string,
  level: string,
  district: string | null,
  county: string | null,
  city: string | null,
): Promise<number | null> {
  const dist = parseDistrict(district)

  // ── Federal: congressional district ─────────────────────────────────────
  if (level === 'federal' && dist) {
    const rows = await censusGet(
      `${ACS}?get=B29001_001E&for=congressional%20district:${dist}&in=state:${fips}&key=${CENSUS_KEY}`
    )
    const cvap = parseInt(rows?.[1]?.[0] ?? '')
    if (cvap > 0) return Math.round(cvap * 0.75)
  }

  // ── Federal without district number = Senate (statewide) ────────────────
  if (level === 'federal' && !dist) {
    const rows = await censusGet(
      `${ACS}?get=B29001_001E&for=state:${fips}&key=${CENSUS_KEY}`
    )
    const cvap = parseInt(rows?.[1]?.[0] ?? '')
    if (cvap > 0) return Math.round(cvap * 0.75)
  }

  // ── State: governor (no district) = statewide ────────────────────────────
  if (level === 'state' && !dist) {
    const rows = await censusGet(
      `${ACS}?get=B29001_001E&for=state:${fips}&key=${CENSUS_KEY}`
    )
    const cvap = parseInt(rows?.[1]?.[0] ?? '')
    if (cvap > 0) return Math.round(cvap * 0.75)
  }

  // ── State legislative district (upper chamber, then lower) ───────────────
  if (level === 'state' && dist) {
    for (const chamber of [
      `state%20legislative%20district%20(upper%20chamber)`,
      `state%20legislative%20district%20(lower%20chamber)`,
    ]) {
      const rows = await censusGet(
        `${ACS}?get=B29001_001E&for=${chamber}:${dist}&in=state:${fips}&key=${CENSUS_KEY}`
      )
      const cvap = parseInt(rows?.[1]?.[0] ?? '')
      if (cvap > 0) return Math.round(cvap * 0.75)
    }
    // Fallback: statewide CVAP ÷ actual number of districts (fetched from Census)
    const [stateRows, distRows] = await Promise.all([
      censusGet(`${ACS}?get=B29001_001E&for=state:${fips}&key=${CENSUS_KEY}`),
      censusGet(`${ACS}?get=B29001_001E&for=state%20legislative%20district%20(upper%20chamber):*&in=state:${fips}&key=${CENSUS_KEY}`),
    ])
    const stateCvap  = parseInt(stateRows?.[1]?.[0] ?? '')
    const distCount  = distRows ? Math.max(1, distRows.length - 1) : 50
    if (stateCvap > 0) return Math.round((stateCvap / distCount) * 0.75)
  }

  // ── County ───────────────────────────────────────────────────────────────
  if (level === 'county' && county) {
    const rows = await censusGet(
      `${ACS}?get=NAME,B29001_001E&for=county:*&in=state:${fips}&key=${CENSUS_KEY}`
    )
    if (rows) {
      const cleaned = county.replace(/\s*county\s*/i, '').trim().toLowerCase()
      const match   = rows.slice(1).find(r => r[0].toLowerCase().includes(cleaned))
      const cvap    = parseInt(match?.[1] ?? '')
      if (cvap > 0) return Math.round(cvap * 0.75)
    }
  }

  // ── Municipal: use county CVAP if county set, else place-level fallback ──
  if (level === 'municipal') {
    // Try county first (more reliable)
    if (county) {
      const rows = await censusGet(
        `${ACS}?get=NAME,B29001_001E&for=county:*&in=state:${fips}&key=${CENSUS_KEY}`
      )
      if (rows) {
        const cleaned = county.replace(/\s*county\s*/i, '').trim().toLowerCase()
        const match   = rows.slice(1).find(r => r[0].toLowerCase().includes(cleaned))
        const cvap    = parseInt(match?.[1] ?? '')
        if (cvap > 0) {
          // A city is typically 30–60% of its county's voting population
          return Math.round(cvap * 0.40 * 0.75)
        }
      }
    }
    // Try Census place (city) level
    if (city) {
      const rows = await censusGet(
        `${ACS}?get=NAME,B29001_001E&for=place:*&in=state:${fips}&key=${CENSUS_KEY}`
      )
      if (rows) {
        const cleaned = city.trim().toLowerCase()
        const match   = rows.slice(1).find(r => r[0].toLowerCase().includes(cleaned))
        const cvap    = parseInt(match?.[1] ?? '')
        if (cvap > 0) return Math.round(cvap * 0.75)
      }
    }
  }

  return null
}

async function fetchVotingPatterns(candidate: {
  name: string; race: string; state: string; raceLevel: string | null
  district: string | null; county: string | null; city: string | null
  party: string | null
}): Promise<{ turnout: number; gopBase: number; analysis: string }> {
  const geo = (() => {
    const l = (candidate.raceLevel ?? '').toLowerCase()
    if (l === 'federal'   && candidate.district) return `${candidate.state} Congressional District ${candidate.district}`
    if (l === 'federal'   && !candidate.district) return `${candidate.state} (U.S. Senate, statewide)`
    if (l === 'state'     && candidate.district) return `${candidate.state} State Legislative District ${candidate.district}`
    if (l === 'county'    && candidate.county)   return `${candidate.county}, ${candidate.state}`
    if (l === 'municipal' && candidate.city)     return `${candidate.city}, ${candidate.state}`
    return `${candidate.state} (statewide)`
  })()

  const system = `You are a political data analyst specializing in election modeling. Respond with valid JSON only — no markdown, no commentary.`

  const user = `Provide election modeling estimates for this race using historical data from your training:

CANDIDATE: ${candidate.name}
RACE: ${candidate.race}
GEOGRAPHY: ${geo}
RACE LEVEL: ${candidate.raceLevel ?? 'state'}
PARTY: ${candidate.party ?? 'Republican'}

Provide:
1. TURNOUT — % of registered voters who typically vote in this type of race at this level in this geography (lower for local/off-year, higher for federal/presidential-year)
2. GOP BASE — % of total expected votes the ${candidate.party ?? 'Republican'} candidate can count on based on recent results in this specific geography
3. ANALYSIS — one sentence describing the political lean and recent trend

Return ONLY this JSON:
{
  "turnout": <integer 15-90>,
  "gopBase": <integer 20-70>,
  "analysis": "<one sentence>"
}`

  const raw = await ask(system, user, 200)

  try {
    const cleaned = raw.replace(/```json\n?|```/g, '').trim()
    const parsed  = JSON.parse(cleaned)
    return {
      turnout:  Math.max(15, Math.min(90, parseInt(parsed.turnout) || 45)),
      gopBase:  Math.max(20, Math.min(70, parseInt(parsed.gopBase) || 46)),
      analysis: String(parsed.analysis ?? ''),
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

  const fips      = stateFips(candidate.state)
  const raceLevel = (candidate.raceLevel ?? 'state').toLowerCase()

  const [censusVoters, patterns] = await Promise.all([
    fips
      ? fetchCVAP(fips, raceLevel, candidate.district, candidate.county, candidate.city)
      : Promise.resolve(null),
    fetchVotingPatterns(candidate),
  ])

  return NextResponse.json({
    registeredVoters: censusVoters,
    turnout:          patterns.turnout,
    gopBase:          patterns.gopBase,
    analysis:         patterns.analysis,
    source:           censusVoters
      ? 'Registered voters estimated from 2023 Census ACS citizen voting-age population. Turnout & party lean from 2018–2024 historical results.'
      : 'Census lookup unavailable for this geography — turnout & party lean from 2018–2024 historical results.',
  })
}
