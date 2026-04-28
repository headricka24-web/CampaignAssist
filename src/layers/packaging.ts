import type { Article, Bin, Outlet } from '@prisma/client'
import type { ExportFormat } from '@/lib/types'

type ArticleWithOutlet = Article & { outlet: Outlet }

export function exportBin(
  bin: Bin & { items: { article: ArticleWithOutlet }[] },
  format: ExportFormat,
): string {
  const articles = bin.items.map((i) => i.article)

  if (format === 'JSON') {
    return JSON.stringify(
      {
        bin: { id: bin.id, name: bin.name, date: bin.dateCreated, digest: bin.digest },
        articles: articles.map((a) => ({
          title: a.title,
          url: a.url,
          outlet: a.outlet.name,
          date: a.datePublished,
          bucket: a.bucket,
          sentiment: a.sentiment,
          topics: JSON.parse(a.topics),
          summary: a.summary,
        })),
      },
      null,
      2,
    )
  }

  if (format === 'CSV') {
    const header = 'title,url,outlet,date,bucket,sentiment,topics,summary'
    const rows = articles.map((a) =>
      [
        `"${a.title.replace(/"/g, '""')}"`,
        a.url,
        a.outlet.name,
        a.datePublished.toISOString().slice(0, 10),
        a.bucket ?? '',
        a.sentiment ?? '',
        JSON.parse(a.topics).join(';'),
        `"${(a.summary ?? '').replace(/"/g, '""')}"`,
      ].join(','),
    )
    return [header, ...rows].join('\n')
  }

  // Markdown
  const lines: string[] = [
    `# ${bin.name}`,
    `**Date:** ${new Date(bin.dateCreated).toLocaleDateString()}`,
    '',
    '## Digest',
    bin.digest ?? '_No digest yet._',
    '',
    '## Articles',
  ]
  for (const a of articles) {
    lines.push(`### ${a.title}`)
    lines.push(`- **Outlet:** ${a.outlet.name}  **Date:** ${a.datePublished.toISOString().slice(0, 10)}`)
    lines.push(`- **Bucket:** ${a.bucket}  **Sentiment:** ${a.sentiment}`)
    lines.push(`- **URL:** ${a.url}`)
    lines.push('')
    if (a.summary) lines.push(a.summary, '')
  }
  return lines.join('\n')
}
