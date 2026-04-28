const styles: Record<string, string> = {
  Positive: 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200',
  Neutral:  'bg-sky-50 text-sky-700 ring-1 ring-sky-200',
  Negative: 'bg-rose-50 text-rose-700 ring-1 ring-rose-200',
}

const dots: Record<string, string> = {
  Positive: 'bg-emerald-500',
  Neutral:  'bg-sky-500',
  Negative: 'bg-rose-500',
}

export default function SentimentBadge({ sentiment }: { sentiment: string | null }) {
  const label = sentiment ?? 'Unknown'
  return (
    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full whitespace-nowrap ${styles[label] ?? 'bg-gray-100 text-gray-500 ring-1 ring-gray-200'}`}
      aria-label={`Sentiment: ${label}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dots[label] ?? 'bg-gray-400'}`} aria-hidden="true" />
      {label}
    </span>
  )
}
