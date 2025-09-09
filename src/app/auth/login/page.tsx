'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'
import Image from 'next/image'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrorMsg('')

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setErrorMsg(error.message)
    } else {
      router.push('/')
    }
    setLoading(false)
  }

  return (
    <div className="relative min-h-screen">
      <Image
        src="https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1974&auto=format&fit=crop"
        alt="Background"
        fill
        priority
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/40" />
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <form onSubmit={onSubmit} className="bg-white/95 backdrop-blur-sm border rounded-lg p-6 w-full max-w-md text-gray-900">
        <h1 className="text-xl font-semibold mb-4">Sign in</h1>
        <input
          type="email"
          placeholder="Email"
          className="w-full border-2 border-gray-400 rounded p-2 mb-2 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full border-2 border-gray-400 rounded p-2 mb-3 bg-white text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button
          disabled={loading}
          className="w-full bg-blue-600 text-white rounded p-2 hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
          {errorMsg && <p className="text-sm mt-3 text-red-600">{errorMsg}</p>}
          <p className="text-sm mt-3">Don't have an account? <a href="/auth/signup" className="text-blue-700 hover:text-blue-800">Sign up</a></p>
        </form>
      </div>
    </div>
  )
}


