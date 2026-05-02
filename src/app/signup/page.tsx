'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const router = useRouter()

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm,  setConfirm]  = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }

    setLoading(true)

    const res = await fetch('/api/auth/signup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Something went wrong.')
      setLoading(false)
      return
    }

    // Auto sign-in after registration
    const result = await signIn('credentials', { username, password, redirect: false })
    setLoading(false)

    if (result?.error) {
      router.push('/login')
    } else {
      router.push('/settings')
      router.refresh()
    }
  }

  return (
    <div className="min-h-screen bg-hero-gradient flex flex-col">
      <div className="absolute inset-0 bg-stripe-pattern opacity-20 pointer-events-none" />

      {/* Logo */}
      <div className="relative flex justify-center pt-10">
        <Link href="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-gradient flex items-center justify-center text-xl font-bold text-white select-none">★</div>
          <span className="font-display font-bold text-2xl tracking-widest uppercase text-white">
            Campaign<span className="text-gold-400">Assist</span>
          </span>
        </Link>
      </div>

      {/* Card */}
      <div className="relative flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            <div className="h-1.5 bg-gold-gradient" />
            <div className="p-8">
              <h1 className="font-display text-2xl font-black text-navy mb-1">Create your account.</h1>
              <p className="text-gray-400 text-sm mb-8">Pick a username and password to get started.</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Username *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={username}
                    onChange={e => setUsername(e.target.value)}
                    placeholder="smithfor2026"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                  <p className="text-[10px] text-gray-400 mt-1">Letters, numbers, underscores, and hyphens only.</p>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Password *</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1.5">Confirm Password *</label>
                  <input
                    type="password"
                    required
                    autoComplete="new-password"
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2.5 text-navy placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-gold-400"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500 font-semibold">{error}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gold-400 hover:bg-gold-500 disabled:opacity-50 text-navy font-black uppercase tracking-widest px-6 py-3 rounded-xl text-sm transition-all mt-2"
                >
                  {loading ? 'Creating account…' : '★ Create Account'}
                </button>
              </form>

              <p className="text-center text-sm text-gray-400 mt-6">
                Already have an account?{' '}
                <Link href="/login" className="text-navy font-bold hover:text-gold-500 transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
