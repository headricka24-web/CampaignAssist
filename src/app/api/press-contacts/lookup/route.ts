import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { auth } from '@/auth'

export const maxDuration = 30

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const { outlet } = await req.json() as { outlet: string }
  if (!outlet?.trim()) return NextResponse.json({ error: 'outlet required' }, { status: 400 })

  // Get candidate geography to improve lookup accuracy
  const candidate = await prisma.candidate.findFirst({
    where:  { userId },
    select: { state: true, city: true, county: true, raceLevel: true, district: true },
  })

  const level = (candidate?.raceLevel ?? '').toLowerCase()
  const geo = (() => {
    if (level === 'municipal' && candidate?.city)   return `${candidate.city}, ${candidate.state}`
    if (level === 'county'    && candidate?.county) return `${candidate.county} County, ${candidate.state}`
    if (level === 'state'     && candidate?.state)  return candidate.state
    return candidate?.state ?? ''
  })()

  const raw = await ask(
    `You are a media research expert with deep knowledge of journalists, reporters, editors, and media contacts across the United States. You know who covers politics and local government at outlets of every size. Return ONLY valid JSON — no markdown, no explanation.`,
    `Find the best political/government reporter or editorial contact at this media outlet.

OUTLET: ${outlet.trim()}
${geo ? `GEOGRAPHY: ${geo}` : ''}

Return a JSON object with this exact structure:
{
  "found": true,
  "contacts": [
    {
      "name": "Full Name",
      "role": "Reporter",
      "beat": "Politics",
      "email": "email@outlet.com",
      "phone": "555-000-0000",
      "twitter": "@handle",
      "notes": "One sentence about their coverage focus and how to approach them"
    }
  ],
  "newsroomEmail": "news@outlet.com",
  "newsroomPhone": "555-000-0000",
  "confidence": "high | medium | low",
  "disclaimer": "one sentence about data freshness"
}

Rules:
- List 1–3 contacts maximum, ordered by relevance to political campaign outreach
- For "role" use one of: Reporter, Editor, Producer, Anchor, Columnist, Blogger, News Director, Assignment Editor
- For "beat" use one of: Politics, Local Government, Business, Education, Crime, Health, Agriculture, Veterans, Environment, General
- If you know a specific reporter who covers politics or local government at this outlet, include them
- Always include the newsroom/general assignment email if known (usually news@, politics@, tips@, or editor@)
- For email: use the reporter's known email if available; otherwise use the outlet's likely email format based on their domain
- For twitter: include the @ handle if known, otherwise omit (null)
- If this outlet is very obscure and you have no information, return { "found": false }
- Confidence: "high" = you know specific reporters, "medium" = you know the outlet but not specific reporters, "low" = educated guess on email format only
- Return ONLY the JSON object`,
    600,
  )

  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const data = JSON.parse(cleaned)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ found: false })
  }
}
