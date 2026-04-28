interface Props { text: string; className?: string }

export default function RichText({ text, className = '' }: Props) {
  const lines = text.split('\n')

  return (
    <div className={`space-y-1.5 text-sm leading-relaxed ${className}`}>
      {lines.map((line, i) => {
        const trimmed = line.trim()
        if (!trimmed) return <div key={i} className="h-2" />

        // Section headers: ALL CAPS label with colon, or ## heading
        if (/^#{1,3}\s/.test(trimmed)) {
          const content = trimmed.replace(/^#+\s*/, '')
          return <h3 key={i} className="font-display font-black text-navy text-xs uppercase tracking-widest mt-4 mb-1 first:mt-0">{content}</h3>
        }
        if (/^[A-Z][A-Z\s&'./-]{3,}:\s/.test(trimmed)) {
          const [label, ...rest] = trimmed.split(': ')
          return (
            <div key={i} className="mt-3 first:mt-0">
              <span className="block text-[10px] font-black uppercase tracking-widest text-navy-400 mb-0.5">{label}</span>
              <span className="text-gray-700">{renderInline(rest.join(': '))}</span>
            </div>
          )
        }
        // Bullet points
        if (/^[-•*]\s/.test(trimmed)) {
          return (
            <div key={i} className="flex gap-2 items-start">
              <span className="text-gold-500 mt-0.5 shrink-0 text-xs">★</span>
              <span className="text-gray-700">{renderInline(trimmed.replace(/^[-•*]\s/, ''))}</span>
            </div>
          )
        }
        // Numbered list
        if (/^\d+\.\s/.test(trimmed)) {
          const num   = trimmed.match(/^(\d+)\./)?.[1]
          const content = trimmed.replace(/^\d+\.\s/, '')
          return (
            <div key={i} className="flex gap-2.5 items-start">
              <span className="shrink-0 w-5 h-5 rounded-full bg-navy text-white text-[10px] font-black flex items-center justify-center mt-0.5">{num}</span>
              <span className="text-gray-700">{renderInline(content)}</span>
            </div>
          )
        }
        // Divider
        if (/^---+$/.test(trimmed)) {
          return <hr key={i} className="border-gray-200 my-3" />
        }
        // Normal paragraph
        return <p key={i} className="text-gray-700">{renderInline(trimmed)}</p>
      })}
    </div>
  )
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*.*?\*\*)/g)
  return parts.map((part, i) =>
    part.startsWith('**') && part.endsWith('**')
      ? <strong key={i} className="font-bold text-navy">{part.slice(2, -2)}</strong>
      : part
  )
}
