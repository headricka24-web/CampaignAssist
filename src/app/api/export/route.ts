import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { exportBin } from '@/layers/packaging'
import type { ExportFormat } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { binId, format } = await req.json() as { binId: string; format: ExportFormat }

  const bin = await prisma.bin.findUnique({
    where: { id: binId },
    include: { items: { include: { article: { include: { outlet: true } } }, orderBy: { sortOrder: 'asc' } } },
  })
  if (!bin) return NextResponse.json({ error: 'Bin not found' }, { status: 404 })

  const content = exportBin(bin, format)

  const record = await prisma.export.create({ data: { binId, format, content } })

  const contentType =
    format === 'CSV' ? 'text/csv' : format === 'JSON' ? 'application/json' : 'text/markdown'

  return new NextResponse(content, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${bin.name}-${format.toLowerCase()}.${format === 'CSV' ? 'csv' : format === 'JSON' ? 'json' : 'md'}"`,
      'X-Export-Id': record.id,
    },
  })
}
