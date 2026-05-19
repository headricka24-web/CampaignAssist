'use client'
import { useState } from 'react'

export default function CopyButton({ text, label = 'Copy', className = '' }: { text: string; label?: string; className?: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${copied ? 'bg-emerald-500 text-white' : 'bg-navy text-white hover:bg-navy-700'} ${className}`}
    >
      {copied ? '✓ Copied' : label}
    </button>
  )
}
