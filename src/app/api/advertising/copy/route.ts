import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'
import { auth } from '@/auth'
import { buildRaceContext } from '@/lib/raceContext'

export const maxDuration = 60

const FORMATS = ['tv-30', 'tv-60', 'radio-30', 'radio-60', 'digital-display', 'social-video', 'direct-mail', 'digital-preroll'] as const
type Format = typeof FORMATS[number]

const FORMAT_LABELS: Record<Format, string> = {
  'tv-30':          'TV Spot (:30)',
  'tv-60':          'TV Spot (:60)',
  'radio-30':       'Radio Spot (:30)',
  'radio-60':       'Radio Spot (:60)',
  'digital-display':'Digital Display Ad',
  'social-video':   'Social Video Script',
  'direct-mail':    'Direct Mail Piece',
  'digital-preroll':'Digital Pre-Roll (:15)',
}

async function getContext(userId: string) {
  const candidate = await prisma.candidate.findFirst({
    where: { userId },
    select: { name: true, race: true, state: true, incumbent: true, raceLevel: true, district: true, county: true, city: true },
  })
  if (!candidate) return null
  const raceCtx = buildRaceContext({ ...candidate, name: candidate.name, race: candidate.race, state: candidate.state, incumbent: candidate.incumbent ?? false })
  return { raceCtx, name: candidate.name, state: candidate.state }
}

function buildPrompt(format: Format, issue: string, raceCtx: string): [string, string] {
  const label = FORMAT_LABELS[format]

  const system = `You are a veteran Republican political ad writer with 20+ years of experience crafting winning television, radio, and digital campaign advertisements. You write emotionally resonant, persuasive scripts grounded in conservative values. Your ads are punchy, memorable, and built to move voters.`

  const formatInstructions: Record<Format, string> = {
    'tv-30': `Write a :30 second TV spot script (roughly 75 words of spoken copy). Include:
TITLE: (memorable ad name)
VISUAL: (brief scene/shot direction in brackets for each line)
VOICEOVER/DIALOGUE: (the actual spoken script, clearly labeled)
SUPER: (any on-screen text supers, e.g. candidate name, title, disclaimer)
TAG: (standard "I'm [name] and I approve this message" closing)`,

    'tv-60': `Write a :60 second TV spot script (roughly 150 words of spoken copy). Include:
TITLE: (memorable ad name)
VISUAL: (brief scene/shot direction in brackets for each line)
VOICEOVER/DIALOGUE: (the actual spoken script, clearly labeled)
SUPER: (any on-screen text supers)
TAG: (standard "I'm [name] and I approve this message" closing)`,

    'radio-30': `Write a :30 second radio spot script (roughly 75 words of spoken copy). Include:
TITLE: (memorable ad name)
SFX: (any sound effects or music notes at the top)
ANNOUNCER/VOICE 1: (clearly labeled dialogue)
TAG: (standard approval tag + station contact if applicable)`,

    'radio-60': `Write a :60 second radio spot script (roughly 150 words). Include:
TITLE: (memorable ad name)
SFX: (sound effects/music direction)
ANNOUNCER/VOICE 1 / VOICE 2: (labeled dialogue — consider two-voice format for engagement)
TAG: (approval tag)`,

    'digital-display': `Write 3 variations of digital display ad copy. For each variation include:
HEADLINE: (25 characters max — punchy and bold)
BODY COPY: (90 characters max)
CTA BUTTON: (15 characters max, e.g. "Learn More", "Join Us", "Vote [Name]")
SIZE NOTE: (which size this is best for: 728x90, 300x250, or 160x600)`,

    'social-video': `Write a :15–:30 social media video script (hook + body + CTA). Include:
TITLE: (ad name)
HOOK (first 3 seconds): (what grabs attention immediately — visual + text overlay)
BODY (seconds 4–25): (key message, visuals, any on-screen text)
CTA (final 3 seconds): (clear call to action with candidate name)
CAPTION: (90-character social caption with 3 relevant hashtags)`,

    'direct-mail': `Write a direct mail piece. Include:
HEADLINE (front of mailer): (bold, attention-grabbing — 10 words max)
SUBHEAD: (supporting line)
BODY COPY (inside/back): (3 short paragraphs — problem, solution, call to action)
CALL TO ACTION BOX: (donation ask or volunteer CTA with contact info placeholder)
RETURN ADDRESS NOTE: (committee name placeholder)`,

    'digital-preroll': `Write a :15 second non-skippable digital pre-roll script (roughly 38 words). Include:
TITLE: (ad name)
VISUAL: (shot direction)
VOICEOVER: (the full :15 spoken script — must hook in the first 5 seconds)
END CARD: (final frame — candidate name, tagline, website placeholder)`,
  }

  const user = `${raceCtx}

FOCUS ISSUE / THEME: ${issue || 'General campaign introduction and Republican values'}

${formatInstructions[format]}

Make it specific to this candidate and race level. The tone should be confident, values-driven, and built to persuade swing voters while energizing the Republican base.`

  return [system, user]
}

export async function POST(req: NextRequest) {
  const { format, issue = '' } = await req.json() as { format: Format; issue?: string }

  if (!FORMATS.includes(format)) {
    return NextResponse.json({ error: 'invalid_format' }, { status: 400 })
  }

  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  const ctx = await getContext(userId)
  if (!ctx) return NextResponse.json({ error: 'no_candidate' }, { status: 400 })

  const [system, user] = buildPrompt(format, issue, ctx.raceCtx)
  const content = await ask(system, user, 800)

  return NextResponse.json({ content })
}
