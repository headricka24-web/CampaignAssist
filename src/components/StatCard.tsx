interface Props {
  label: string
  value: number
  accent?: 'blue' | 'red' | 'gold' | 'green'
  icon?: string
}

const accents = {
  blue:  { bar: 'from-navy-400 to-navy',    text: 'text-navy',     bg: 'bg-navy-100/60',   icon: 'bg-navy-100 text-navy'     },
  red:   { bar: 'from-red-400 to-red-700',  text: 'text-red-600',  bg: 'bg-red-50',        icon: 'bg-red-100 text-red-600'   },
  gold:  { bar: 'from-gold-300 to-gold-500',text: 'text-gold-600', bg: 'bg-gold-50',       icon: 'bg-gold-100 text-gold-600' },
  green: { bar: 'from-green-400 to-green-600', text: 'text-green-700', bg: 'bg-green-50',  icon: 'bg-green-100 text-green-700' },
}

export default function StatCard({ label, value, accent = 'blue', icon }: Props) {
  const a = accents[accent]
  return (
    <div className="bg-white rounded-2xl shadow-patriot overflow-hidden card-lift border border-white/80">
      <div className={`h-1 bg-gradient-to-r ${a.bar}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.15em] text-gray-400 mb-2">{label}</p>
            <p className={`text-4xl font-display font-bold ${a.text} tabular-nums`}>{value.toLocaleString()}</p>
          </div>
          {icon && (
            <div className={`w-10 h-10 rounded-xl ${a.icon} flex items-center justify-center text-xl shrink-0 mt-0.5`}>
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
