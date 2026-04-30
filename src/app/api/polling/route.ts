import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { ask } from '@/lib/claude'

export const maxDuration = 60

export async function POST() {
  const candidate = await prisma.candidate.findFirst()
  const name  = candidate?.name  ?? 'the candidate'
  const state = candidate?.state ?? 'the state'
  const race  = candidate?.race  ?? 'this race'

  // Find articles that likely contain polling data
  const articles = await prisma.article.findMany({
    where: {
      OR: [
        { title: { contains: 'poll' } },
        { title: { contains: 'Poll' } },
        { title: { contains: 'survey' } },
        { title: { contains: 'Survey' } },
        { title: { contains: 'approval' } },
        { title: { contains: 'Approval' } },
        { title: { contains: 'ahead' } },
        { title: { contains: 'Ahead' } },
        { title: { contains: '%' } },
        { rawText: { contains: 'poll' } },
        { rawText: { contains: '%' } },
      ]
    },
    orderBy: { datePublished: 'desc' },
    take: 30,
  })

  if (articles.length === 0) {
    return NextResponse.json({ error: 'no_polling_data' }, { status: 400 })
  }

  const articleList = articles
    .map(a => `TITLE: ${a.title}\nSOURCE: ${a.outletId ?? 'Unknown'}\nDATE: ${new Date(a.datePublished).toLocaleDateString()}\nSNIPPET: ${a.rawText?.slice(0, 300) ?? ''}`)
    .join('\n\n---\n\n')

  const raw = await ask(
    `You are a political data analyst. Extract and synthesize polling data from news articles. Return ONLY valid JSON, no markdown, no explanation.`,
    `Candidate: ${name} (Republican), running for ${race} in ${state}.

News articles that may contain polling data:
${articleList}

Extract all polling data mentioned. Return a JSON object with this exact structure:
{
  "polls": [
    {
      "title": "poll title or description",
      "date": "date of poll",
      "source": "pollster or news outlet",
      "entries": [
        { "label": "candidate name", "value": 45, "isOurs": true },
        { "label": "opponent name", "value": 42, "isOurs": false }
      ]
    }
  ],
  "summary": "2-3 sentence synthesis of what the polling shows overall for the Republican candidate"
}

Rules:
- Only include polls with actual percentage numbers
- isOurs = true for ${name} or the Republican candidate
- If no real polling numbers exist in the articles, return { "polls": [], "summary": "No specific polling data found in current news coverage." }
- Return ONLY the JSON object, nothing else`,
    800,
  )

  try {
    const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim()
    const data = JSON.parse(cleaned)
    return NextResponse.json(data)
  } catch {
    return NextResponse.json({ polls: [], summary: 'Could not parse polling data from current articles.' })
  }
}
