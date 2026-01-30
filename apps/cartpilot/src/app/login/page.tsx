'use client'

import { useState, useEffect } from 'react'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const router = useRouter()
  const searchParams = useSearchParams()
  const thenConnect = searchParams.get('then') === 'connect'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMessage('')

    try {
      if (!isSupabaseConfigured() || !supabase) {
        throw new Error('Olive is not configured yet. Please check the Supabase keys.')
      }
      if (isSignUp) {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })
        if (error) throw error
        setMessage('Check your email for the confirmation link!')
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        router.push(thenConnect ? '/dashboard?connectKroger=1' : '/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-[#fdfcf9] flex items-center justify-center px-6">
      <div className="max-w-sm w-full">
        <Link href="/" className="flex items-center justify-center gap-2 mb-10">
          <div className="w-10 h-10 bg-[#9caf88] rounded-full flex items-center justify-center olive-pulse">
            <span className="text-white text-lg">🫒</span>
          </div>
          <span className="text-2xl font-medium text-[#3a4529]">Olive</span>
        </Link>

        <div className="bg-white p-8 rounded-3xl shadow-sm border border-[#eef2e6]">
          {!isSupabaseConfigured() && (
            <div className="bg-[#fff7ed] text-[#9a3412] p-3 rounded-xl text-sm mb-4">
              Olive isn&apos;t configured yet. Add Supabase keys to continue.
            </div>
          )}
          <h2 className="text-xl font-medium text-[#2d3a1f] text-center mb-2">
            {isSignUp ? 'Join the kitchen' : 'Welcome back'}
          </h2>
          <p className="text-[#87a05a] text-center text-sm mb-6">
            {isSignUp 
              ? "Let's get your pantry organized" 
              : "Olive's been keeping things tidy"}
          </p>
          {thenConnect && (
            <div className="bg-[#eef2e6] text-[#536538] text-xs rounded-xl p-3 mb-4">
              Sign in, then we&apos;ll take you straight to connect Kroger.
            </div>
          )}
          {!thenConnect && (
            <div className="bg-[#f8faf5] text-[#536538] text-xs rounded-xl p-3 mb-4">
              We&apos;ll connect your Kroger account after you sign in.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-[#536538] mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8faf5] border border-[#dce5cc] rounded-xl focus:ring-2 focus:ring-[#9caf88] focus:border-transparent outline-none transition"
                placeholder="you@example.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm text-[#536538] mb-1.5">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 bg-[#f8faf5] border border-[#dce5cc] rounded-xl focus:ring-2 focus:ring-[#9caf88] focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm">
                {error}
              </div>
            )}

            {message && (
              <div className="bg-[#eef2e6] text-[#536538] p-3 rounded-xl text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#9caf88] text-white py-3.5 rounded-xl hover:bg-[#87a05a] transition disabled:opacity-50 font-medium"
            >
              {loading ? 'One moment...' : isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-[#87a05a] hover:text-[#6b8245] text-sm"
            >
              {isSignUp
                ? 'Already have an account? Sign in'
                : "New here? Create an account"}
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-[#eef2e6] text-center">
            <Link
              href="/login?then=connect"
              className="inline-flex items-center gap-2 text-[#536538] hover:text-[#2d3a1f] text-sm"
            >
              <span>🛒</span>
              <span>Continue with Kroger</span>
              <span className="text-[#87a05a] text-xs">(sign in first)</span>
            </Link>
          </div>
        </div>
      </div>
    </main>
  )
}
