'use client'

import { useState, useEffect } from 'react'
import { usePinAuth } from '@/lib/pin-auth-context'
import { Lock, AlertCircle, CheckCircle, Shield, Clock } from 'lucide-react'

export default function PinLogin() {
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showPin, setShowPin] = useState(false)
  const { login, isAccountLocked } = usePinAuth()

  const handlePinChange = (digit: string) => {
    if (pin.length < 6) {
      const newPin = pin + digit
      setPin(newPin)
      setError('')
      
      if (newPin.length === 6) {
        handleSubmit(newPin)
      }
    }
  }

  const handleBackspace = () => {
    setPin(pin.slice(0, -1))
    setError('')
  }

  const handleClear = () => {
    setPin('')
    setError('')
  }

  const handleSubmit = async (pinToSubmit: string) => {
    setIsSubmitting(true)
    setError('')
    
    const result = await login(pinToSubmit)
    
    if (result.success) {
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        setPin('')
      }, 1000)
    } else {
      setError(result.error || 'Login failed')
      setPin('')
    }
    
    setIsSubmitting(false)
  }

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key >= '0' && e.key <= '9') {
        handlePinChange(e.key)
      } else if (e.key === 'Backspace') {
        handleBackspace()
      } else if (e.key === 'Enter' && pin.length === 6) {
        handleSubmit(pin)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [pin])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Secure POS Access</h1>
            <p className="text-gray-600">Enter your 6-digit PIN to continue</p>
            <div className="flex items-center justify-center mt-2 text-sm text-gray-500">
              <Shield className="w-4 h-4 mr-1" />
              <span>Enhanced Security</span>
            </div>
          </div>

          {/* PIN Display */}
          <div className="mb-8">
            <div className="flex justify-center space-x-2 mb-4">
              {[0, 1, 2, 3, 4, 5].map((index) => (
                <div
                  key={index}
                  className={`w-4 h-4 rounded-full border-2 ${
                    index < pin.length
                      ? 'bg-blue-600 border-blue-600'
                      : 'border-gray-300'
                  }`}
                />
              ))}
            </div>
            
            {error && (
              <div className="flex items-center justify-center space-x-2 text-red-600 text-sm">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}
            
            {success && (
              <div className="flex items-center justify-center space-x-2 text-green-600 text-sm">
                <CheckCircle className="w-4 h-4" />
                <span>Login successful!</span>
              </div>
            )}

            {isAccountLocked && (
              <div className="flex items-center justify-center space-x-2 text-orange-600 text-sm">
                <Clock className="w-4 h-4" />
                <span>Account temporarily locked</span>
              </div>
            )}
          </div>

          {/* Number Pad */}
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
              <button
                key={number}
                onClick={() => handlePinChange(number.toString())}
                disabled={isSubmitting || isAccountLocked}
                className="w-full h-14 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-xl font-semibold text-gray-700 transition-colors disabled:opacity-50"
              >
                {number}
              </button>
            ))}
            
            <button
              onClick={handleClear}
              disabled={isSubmitting || isAccountLocked}
              className="w-full h-14 bg-red-100 hover:bg-red-200 active:bg-red-300 rounded-xl text-sm font-medium text-red-700 transition-colors disabled:opacity-50"
            >
              Clear
            </button>
            
            <button
              onClick={() => handlePinChange('0')}
              disabled={isSubmitting || isAccountLocked}
              className="w-full h-14 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-xl font-semibold text-gray-700 transition-colors disabled:opacity-50"
            >
              0
            </button>
            
            <button
              onClick={handleBackspace}
              disabled={isSubmitting || isAccountLocked}
              className="w-full h-14 bg-gray-100 hover:bg-gray-200 active:bg-gray-300 rounded-xl text-sm font-medium text-gray-700 transition-colors disabled:opacity-50"
            >
              ←
            </button>
          </div>

          {/* Security Info */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <p className="text-xs text-gray-500 text-center mb-2">Security Features:</p>
            <div className="text-xs text-gray-400 text-center space-y-1">
              <p>• 6-digit PIN required</p>
              <p>• Account locks after 5 failed attempts</p>
              <p>• 30-minute lockout period</p>
              <p>• Session persistence</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}