import { NextResponse } from 'next/server'
import { NextRequest } from 'next/server'
import * as XLSX from 'xlsx'
import Anthropic from '@anthropic-ai/sdk'

const EXTRACTION_SYSTEM = `You are a campaign data extraction assistant. Extract donor, volunteer, voter contact, and event information from the provided document. Return ONLY a valid JSON object with this exact structure:
{
  "donors": [{"name": "string", "amount": number_or_null, "email": "string_or_null", "phone": "string_or_null", "method": "string_or_null", "notes": "string_or_null"}],
  "volunteers": [{"name": "string", "email": "string_or_null", "phone": "string_or_null", "role": "string_or_null", "shiftDate": "string_or_null", "notes": "string_or_null"}],
  "contacts": [{"name": "string", "phone": "string_or_null", "email": "string_or_null", "method": "string_or_null", "notes": "string_or_null"}],
  "events": [{"title": "string", "type": "string_or_null", "eventDate": "string_or_null", "location": "string_or_null", "description": "string_or_null"}]
}
Rules:
- Only include records you are confident about. Use ISO date strings (YYYY-MM-DD) for dates.
- Infer record type from context: amounts → donors, shifts/roles → volunteers, voter outreach → contacts, meetings/rallies → events.
- For method on donors: online | check | cash | card. For method on contacts: door | phone | text | email.
- For event type: rally | townhall | fundraiser | canvass | debate | meeting | event.
- Return empty arrays [] if no records of that type are found.
- Do NOT wrap the JSON in markdown code fences.`

export async function POST(req: NextRequest) {
  const formData = await req.formData()
  const file = formData.get('file') as File | null

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return NextResponse.json({ error: 'AI service not configured' }, { status: 500 })
  }

  const client = new Anthropic({ apiKey })
  const name   = file.name.toLowerCase()

  let textContent  = ''
  let pdfBase64    = ''
  let isPdf        = false

  if (name.endsWith('.csv') || name.endsWith('.xlsx') || name.endsWith('.xls')) {
    const buffer   = await file.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })
    const sheets: string[] = []
    for (const sheetName of workbook.SheetNames) {
      const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName])
      sheets.push(`=== Sheet: ${sheetName} ===\n${csv}`)
    }
    textContent = sheets.join('\n\n')
  } else if (name.endsWith('.pdf')) {
    const buffer = await file.arrayBuffer()
    pdfBase64    = Buffer.from(buffer).toString('base64')
    isPdf        = true
  } else if (name.endsWith('.txt')) {
    textContent = await file.text()
  } else {
    return NextResponse.json({ error: 'Unsupported file type. Please upload a CSV, XLSX, PDF, or TXT file.' }, { status: 400 })
  }

  const response = isPdf
    ? await client.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 4096,
        system:     EXTRACTION_SYSTEM,
        messages: [{
          role: 'user',
          content: [
            { type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: pdfBase64 } },
            { type: 'text', text: 'Extract all campaign-relevant data from this document and return the JSON.' },
          ],
        }],
      })
    : await client.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 4096,
        system:     EXTRACTION_SYSTEM,
        messages: [{
          role: 'user',
          content: `Extract all campaign-relevant data from this document and return the JSON.\n\n${textContent}`,
        }],
      })

  const raw = response.content[0].type === 'text' ? response.content[0].text : ''
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) {
    return NextResponse.json({ error: 'Could not extract structured data from the document. Try a more structured file.' }, { status: 422 })
  }

  try {
    const extracted = JSON.parse(jsonMatch[0])
    return NextResponse.json({
      donors:     Array.isArray(extracted.donors)     ? extracted.donors     : [],
      volunteers: Array.isArray(extracted.volunteers) ? extracted.volunteers : [],
      contacts:   Array.isArray(extracted.contacts)   ? extracted.contacts   : [],
      events:     Array.isArray(extracted.events)     ? extracted.events     : [],
    })
  } catch {
    return NextResponse.json({ error: 'Failed to parse extracted data. Please try a different file.' }, { status: 422 })
  }
}
