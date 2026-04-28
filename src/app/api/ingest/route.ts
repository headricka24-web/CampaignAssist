import { NextRequest, NextResponse } from 'next/server'
import { ingestArticle } from '@/layers/ingestion'
import type { IngestPayload } from '@/lib/types'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { payload: IngestPayload; candidateName: string; opponentName?: string }
    const article = await ingestArticle(body.payload, body.candidateName, body.opponentName)
    return NextResponse.json(article, { status: 201 })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 400 })
  }
}
