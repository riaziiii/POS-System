'use client'

import { usePinAuth } from '@/lib/pin-auth-context'
import PinLogin from './pin_login'
import { Loader2, Shield } from 'lucide-react'

interface PinAuthGuardProps {
  children: React.ReactNode
}

export default function PinAuthGuard({ children }: PinAuthGuardProps) {
  const { isAuthenticated, loading } = usePinAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Shield className="w-8 h-8 text-blue-600" />
          </div>
          <Loader2 className="animate-spin h-8 w-8 text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Verifying security...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <PinLogin />
  }

  return <>{children}</>
}