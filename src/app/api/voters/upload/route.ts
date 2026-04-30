import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'
import Anthropic from '@anthropic-ai/sdk'
import { prisma } from '@/lib/db'

// ── Normalization ─────────────────────────────────────────────────────────────

function normalizeParty(raw?: string): string {
  if (!raw?.trim()) return 'Unknown'
  const v = raw.toLowerCase().trim()
  if (v === 'r' || v === 'rep' || v === 'gop' || v.startsWith('repub')) return 'Republican'
  if (v === 'd' || v === 'dem' || v.startsWith('demo')) return 'Democrat'
  if (v === 'i' || v === 'ind' || v === 'npa' || v.startsWith('indep') || v === 'unaffiliated' || v === 'no party') return 'Independent'
  return 'Unknown'
}

function normalizeSupportLevel(raw?: string): string {
  if (!raw?.trim()) return 'Unknown'
  const v = raw.toLowerCase().trim()
  if (v === '5' || v === 'ss' || v === 'strong' || v.includes('strong support')) return 'Strong Support'
  if (v === '4' || v === 'ls' || v === 'lean' || v.includes('lean support')) return 'Lean Support'
  if (v === '3' || v.includes('persuad') || v === 'swing' || v === 'undecided') return 'Persuadable'
  if (v === '1' || v === '2' || v.includes('oppos')) return 'Opposed'
  return 'Unknown'
}

// ── Heuristic Segmentation ────────────────────────────────────────────────────

function heuristicTags(party: string, support: string, turnout: number | null, address?: string | null): string[] {
  const tags = new Set<string>()
  const isGOP  = party === 'Republican'
  const isInd  = party === 'Independent'
  const isStrong = support === 'Strong Support'
  const isLean   = support === 'Lean Support'
  const isPersuadable = support === 'Persuadable' || isInd
  const lowTurnout  = turnout !== null && turnout < 40
  const highTurnout = turnout !== null && turnout >= 70

  if (isGOP && (isStrong || highTurnout)) tags.add('Strong Republican')
  if (isGOP && isLean)                   tags.add('Lean Support')
  if (isPersuadable)                     tags.add('Persuadable')
  if (isGOP && lowTurnout)               tags.add('GOTV Target')
  if ((isGOP || isPersuadable) && address) tags.add('Door Knock Priority')

  return Array.from(tags)
}

// ── AI Issue Tagging ──────────────────────────────────────────────────────────

const ISSUE_TAGS = ['economy', 'schools', 'public safety', 'taxes', 'immigration', 'energy']

const AI_TAG_SYSTEM = `You are a political campaign assistant. Analyze voter notes and assign issue interest tags.
Available tags: economy, schools, public safety, taxes, immigration, energy
Return ONLY a JSON array like: [{"index": 0, "tags": ["economy","taxes"]}, {"index": 2, "tags": ["schools"]}]
Only include entries where you are confident about issue interest. Omit voters with no clear issue signals.`

async function aiIssueTags(
  voters: Array<{ index: number; notes: string }>,
  apiKey: string,
): Promise<Map<number, string[]>> {
  const map = new Map<number, string[]>()
  if (voters.length === 0) return map

  const client  = new Anthropic({ apiKey })
  const prompt  = voters.map(v => `${v.index}: "${v.notes}"`).join('\n')
  const response = await client.messages.create({
    model: 'claude-sonnet-4-6', max_tokens: 1024, system: AI_TAG_SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })
  const text      = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = text.match(/\[[\s\S]*\]/)
  if (!jsonMatch) return map

  try {
    const parsed = JSON.parse(jsonMatch[0]) as Array<{ index: number; tags: string[] }>
    for (const entry of parsed) {
      const valid = (entry.tags ?? []).filter(t => ISSUE_TAGS.includes(t.toLowerCase()))
      if (valid.length) map.set(entry.index, valid)
    }
  } catch { /* skip AI tags on parse error */ }

  return map
}

// ── Upload Handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file     = formData.get('file') as File | null
  const mappings = JSON.parse((formData.get('mappings') as string | null) ?? '{}') as Record<string, string>

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Parse CSV/XLSX
  const buffer   = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheet    = workbook.Sheets[workbook.SheetNames[0]]
  const rows     = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { defval: '' })

  if (rows.length === 0) return NextResponse.json({ error: 'File appears to be empty' }, { status: 400 })

  const candidate = await prisma.candidate.findFirst()
  const candidateId = candidate?.id ?? null

  type VoterRow = {
    index:        number
    firstName:    string
    lastName:     string
    address?:     string
    city?:        string
    zip?:         string
    phone?:       string
    email?:       string
    party:        string
    supportLevel: string
    turnoutScore: number | null
    precinct?:    string
    notes?:       string
    rawTags?:     string
  }

  const parsed: VoterRow[] = rows.map((row, index) => {
    const get = (field: string) => {
      const col = mappings[field]
      return col ? (row[col] ?? '').toString().trim() : ''
    }
    const turnoutRaw = parseFloat(get('turnoutScore'))
    return {
      index,
      firstName:    get('firstName'),
      lastName:     get('lastName'),
      address:      get('address') || undefined,
      city:         get('city')    || undefined,
      zip:          get('zip')     || undefined,
      phone:        get('phone')   || undefined,
      email:        get('email')   || undefined,
      party:        normalizeParty(get('party')),
      supportLevel: normalizeSupportLevel(get('supportLevel')),
      turnoutScore: isNaN(turnoutRaw) ? null : Math.min(100, Math.max(0, turnoutRaw)),
      precinct:     get('precinct') || undefined,
      notes:        get('notes')    || undefined,
      rawTags:      get('tags')     || undefined,
    }
  }).filter(v => v.firstName || v.lastName)  // skip fully blank rows

  if (parsed.length === 0) {
    return NextResponse.json({ error: 'No valid voter records found — check your column mappings.' }, { status: 400 })
  }

  // AI issue tags (first 100 voters that have notes)
  const apiKey    = process.env.ANTHROPIC_API_KEY ?? ''
  const withNotes = parsed
    .filter(v => v.notes && v.notes.length > 10)
    .slice(0, 100)
    .map(v => ({ index: v.index, notes: v.notes! }))
  const issueTagMap = apiKey.startsWith('sk-') ? await aiIssueTags(withNotes, apiKey) : new Map<number, string[]>()

  // Build final tag lists & segment counts
  const segmentCounts: Record<string, number> = {}
  const toInsert = parsed.map(v => {
    const tags = new Set<string>()

    // Heuristic tags
    for (const t of heuristicTags(v.party, v.supportLevel, v.turnoutScore, v.address)) tags.add(t)

    // AI issue tags
    const aiTags = issueTagMap.get(v.index) ?? []
    for (const t of aiTags) tags.add(t)

    // Raw tags from the CSV (comma-separated)
    if (v.rawTags) {
      for (const t of v.rawTags.split(',').map(s => s.trim()).filter(Boolean)) tags.add(t)
    }

    const tagArray = Array.from(tags)
    for (const t of tagArray) segmentCounts[t] = (segmentCounts[t] ?? 0) + 1

    return {
      candidateId,
      firstName:    v.firstName || 'Unknown',
      lastName:     v.lastName  || '',
      address:      v.address   ?? null,
      city:         v.city      ?? null,
      zip:          v.zip       ?? null,
      phone:        v.phone     ?? null,
      email:        v.email     ?? null,
      party:        v.party     !== 'Unknown' ? v.party     : null,
      supportLevel: v.supportLevel !== 'Unknown' ? v.supportLevel : null,
      turnoutScore: v.turnoutScore,
      precinct:     v.precinct  ?? null,
      tags:         JSON.stringify(tagArray),
      notes:        v.notes     ?? null,
      contactStatus: 'Not Contacted',
    }
  })

  // Batch insert in chunks of 500
  const CHUNK = 500
  for (let i = 0; i < toInsert.length; i += CHUNK) {
    await prisma.voter.createMany({ data: toInsert.slice(i, i + CHUNK), skipDuplicates: false })
  }

  const withPhone = toInsert.filter(v => v.phone).length
  const withEmail = toInsert.filter(v => v.email).length

  // Top segments sorted by count
  const topSegments = Object.entries(segmentCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([name, count]) => ({ name, count }))

  // Suggested first action based on top segment
  const topTag = topSegments[0]?.name ?? ''
  const suggestedAction =
    topTag === 'GOTV Target'         ? 'Start with GOTV Targets — call Republicans with low turnout scores to maximize Election Day turnout.' :
    topTag === 'Persuadable'         ? 'Focus on Persuadable voters first — these are winnable conversations. Prioritize those with phones.' :
    topTag === 'Strong Republican'   ? 'Engage Strong Republicans to volunteer and donate — they\'re ready to help the campaign.' :
    topTag === 'Door Knock Priority' ? 'Send canvassers to Door Knock Priority voters this weekend while the weather is good.' :
    withPhone > 0                    ? 'Start phone banking — your list has voters with phone numbers ready to contact.' :
    'Upload complete. Begin reviewing voter profiles and assigning contact tasks.'

  return NextResponse.json({
    total:           toInsert.length,
    withPhone,
    withEmail,
    topSegments,
    suggestedAction,
  })
}
