'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()
  const search = useSearchParams()
  const [status, setStatus] = useState('Finalizing verification...')

  useEffect(() => {
    const exchange = async () => {
      const code = search.get('code')
      if (!code) {
        setStatus('Missing verification code.')
        return
      }
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        setStatus(error.message)
      } else {
        setStatus('Email verified. Redirecting...')
        setTimeout(() => router.replace('/'), 800)
      }
    }
    exchange()
  }, [router, search])

  return (
    <div className="min-h-screen grid place-items-center bg-gray-50">
      <div className="bg-white border rounded p-6">
        <p>{status}</p>
      </div>
    </div>
  )
}


