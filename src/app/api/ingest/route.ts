import { NextRequest, NextResponse } from 'next/server'
import { ingestArticle } from '@/layers/ingestion'
import { auth } from '@/auth'
import type { IngestPayload } from '@/lib/types'

export async function POST(req: NextRequest) {
  const session = await auth()
  const userId  = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  try {
    const body = await req.json() as { payload: IngestPayload; candidateName: string; opponentName?: string }
    const article = await ingestArticle(body.payload, body.candidateName, body.opponentName, userId)
    return NextResponse.json(article, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
