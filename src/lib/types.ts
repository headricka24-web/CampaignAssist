export type Bucket = 'CandidateCoverage' | 'OpponentCoverage' | 'GeneralRace' | 'HotButtons'
export type Sentiment = 'Positive' | 'Neutral' | 'Negative'
export type SourceType = 'News' | 'Blog' | 'Social' | 'PressRelease'
export type OutletType = 'News' | 'Blog' | 'Social' | 'TV' | 'Radio' | 'Other'
export type BriefType = 'DailyDigest' | 'IssueBrief' | 'NeedToKnow' | 'Newsletter' | 'Email' | 'SocialCopy' | 'EventRequest'
export type ExportFormat = 'CSV' | 'JSON' | 'Markdown'
export type UserRole = 'Admin' | 'Editor' | 'Viewer'

export interface ClassificationResult {
  bucket: Bucket
  topics: string[]
  sentiment: Sentiment
  confidence: number
}

export interface IngestPayload {
  url: string
  rawText: string
  title: string
  author?: string
  datePublished: string
  outletId: string
  sourceType: SourceType
  language?: string
  region?: string
}

export interface DashboardStats {
  totalArticles: number
  newSinceYesterday: number
  sentimentBreakdown: Record<Sentiment, number>
  bucketBreakdown: Record<Bucket, number>
  topOutlets: { name: string; count: number }[]
  topTopics: { topic: string; count: number }[]
}
