export interface ScrapedArticle {
  title: string
  url: string
  outletName: string
  datePublished: string
  snippet: string
}

function decodeHtmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\/${tag}>`, 'i'))
  return match ? decodeHtmlEntities(match[1].trim()) : ''
}

function cleanGoogleUrl(url: string): string {
  const match = url.match(/url=([^&]+)/)
  if (match) return decodeURIComponent(match[1])
  return url
}

async function fetchRSS(query: string): Promise<ScrapedArticle[]> {
  const encoded = encodeURIComponent(query)
  const feedUrl = `https://news.google.com/rss/search?q=${encoded}&hl=en-US&gl=US&ceid=US:en`

  const res = await fetch(feedUrl, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; CampaignAssist/1.0)' },
    next: { revalidate: 0 },
  })

  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`)

  const xml = await res.text()
  const items: ScrapedArticle[] = []
  const itemMatches = xml.match(/<item>[\s\S]*?<\/item>/g) ?? []

  for (const item of itemMatches.slice(0, 15)) {
    const title     = extractTag(item, 'title')
    const link      = cleanGoogleUrl(extractTag(item, 'link').replace(/<!\[CDATA\[|\]\]>/g, '').trim())
    const pubDate   = extractTag(item, 'pubDate')
    const source    = extractTag(item, 'source')
    const desc      = extractTag(item, 'description').replace(/<[^>]+>/g, '').trim()

    if (!title || !link) continue

    items.push({
      title,
      url: link,
      outletName: source || 'Unknown',
      datePublished: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      snippet: desc.slice(0, 500),
    })
  }

  return items
}

// titleOnly=true: only check the title (prevents snippet false-positives like "New Hampshire University")
function filterRelevant(articles: ScrapedArticle[], keywords: string[], titleOnly = false): ScrapedArticle[] {
  const terms = keywords.filter(Boolean).map(k => k.toLowerCase())
  return articles.filter(a => {
    const hay = titleOnly ? a.title.toLowerCase() : (a.title + ' ' + a.snippet).toLowerCase()
    return terms.some(t => hay.includes(t))
  })
}

export async function scrapeForCandidate(candidateName: string, state: string, _race: string) {
  const results = await fetchRSS(`"${candidateName}" ${state}`)
  // Candidate name in title or snippet is fine; state check is title-only to avoid false positives
  return results.filter(a => {
    const title   = a.title.toLowerCase()
    const full    = (a.title + ' ' + a.snippet).toLowerCase()
    return full.includes(candidateName.toLowerCase()) || title.includes(state.toLowerCase())
  })
}

export async function scrapeForOpponent(opponentName: string, state: string, _race: string) {
  const results = await fetchRSS(`"${opponentName}" ${state}`)
  return results.filter(a => {
    const title = a.title.toLowerCase()
    const full  = (a.title + ' ' + a.snippet).toLowerCase()
    return full.includes(opponentName.toLowerCase()) || title.includes(state.toLowerCase())
  })
}

export async function scrapeGeneralRace(race: string, state: string) {
  const results = await fetchRSS(`"${state}" ${race} election 2026`)
  // Title must mention the state — prevents articles about other states slipping in via snippet
  return filterRelevant(results, [state], true)
}

export async function scrapeHotButtons(topics: string[], state: string) {
  const query = topics.map(t => `"${t}"`).join(' OR ') + ` "${state}"`
  const results = await fetchRSS(query)
  return filterRelevant(results, [state], true)
}
