'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'

interface User {
  id: string
  name: string
  role: 'admin' | 'cashier' | 'manager'
  pin: string
  email?: string
  is_active: boolean
  last_login?: string
  login_attempts: number
  locked_until?: string
}

interface PinAuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (pin: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  changePin: (oldPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>
  resetLoginAttempts: () => Promise<void>
  isAccountLocked: boolean
}

const PinAuthContext = createContext<PinAuthContextType | undefined>(undefined)

export function PinAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [isAccountLocked, setIsAccountLocked] = useState(false)

  useEffect(() => {
    checkSession()
  }, [])

  const checkSession = async () => {
    try {
      const savedUser = localStorage.getItem('pos_user')
      if (savedUser) {
        const userData = JSON.parse(savedUser)
        
        // Verify user is still active in database
        const { data: currentUser, error } = await supabase
          .from('pos_users')
          .select('*')
          .eq('id', userData.id)
          .eq('is_active', true)
          .single()

        if (error || !currentUser) {
          localStorage.removeItem('pos_user')
          setUser(null)
        } else {
          setUser(currentUser)
        }
      }
    } catch (error) {
      localStorage.removeItem('pos_user')
      setUser(null)
    } finally {
      setLoading(false)
    }
  }

  const login = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Check if account is locked
      const { data: lockedUser } = await supabase
        .from('pos_users')
        .select('locked_until, login_attempts')
        .eq('pin', pin)
        .single()

      if (lockedUser?.locked_until) {
        const lockTime = new Date(lockedUser.locked_until)
        const now = new Date()
        
        if (lockTime > now) {
          const remainingMinutes = Math.ceil((lockTime.getTime() - now.getTime()) / (1000 * 60))
          return { 
            success: false, 
            error: `Account locked. Try again in ${remainingMinutes} minutes.` 
          }
        } else {
          // Unlock account if lock time has passed
          await supabase
            .from('pos_users')
            .update({ 
              locked_until: null, 
              login_attempts: 0 
            })
            .eq('pin', pin)
        }
      }

      // Attempt login
      const { data: user, error } = await supabase
        .from('pos_users')
        .select('*')
        .eq('pin', pin)
        .eq('is_active', true)
        .single()

      if (error || !user) {
        // Increment login attempts
        await incrementLoginAttempts(pin)
        return { success: false, error: 'Invalid PIN code' }
      }

      // Reset login attempts on successful login
      await supabase
        .from('pos_users')
        .update({ 
          login_attempts: 0,
          last_login: new Date().toISOString(),
          locked_until: null
        })
        .eq('id', user.id)

      setUser(user)
      localStorage.setItem('pos_user', JSON.stringify(user))
      setIsAccountLocked(false)
      
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Login failed. Please try again.' }
    }
  }

  const incrementLoginAttempts = async (pin: string) => {
    try {
      const { data: user } = await supabase
        .from('pos_users')
        .select('login_attempts')
        .eq('pin', pin)
        .single()

      if (user) {
        const newAttempts = (user.login_attempts || 0) + 1
        let lockedUntil = null

        // Lock account after 5 failed attempts
        if (newAttempts >= 5) {
          lockedUntil = new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
          setIsAccountLocked(true)
        }

        await supabase
          .from('pos_users')
          .update({ 
            login_attempts: newAttempts,
            locked_until: lockedUntil
          })
          .eq('pin', pin)
      }
    } catch (error) {
      console.error('Error incrementing login attempts:', error)
    }
  }

  const logout = async () => {
    setUser(null)
    localStorage.removeItem('pos_user')
    setIsAccountLocked(false)
  }

  const changePin = async (oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' }
    }

    if (user.pin !== oldPin) {
      return { success: false, error: 'Current PIN is incorrect' }
    }

    if (newPin.length !== 6 || !/^\d+$/.test(newPin)) {
      return { success: false, error: 'PIN must be 6 digits' }
    }

    // Check if new PIN is already in use
    const { data: existingUser } = await supabase
      .from('pos_users')
      .select('id')
      .eq('pin', newPin)
      .neq('id', user.id)
      .single()

    if (existingUser) {
      return { success: false, error: 'PIN is already in use by another user' }
    }

    try {
      const { error } = await supabase
        .from('pos_users')
        .update({ pin: newPin })
        .eq('id', user.id)

      if (error) {
        return { success: false, error: 'Failed to update PIN' }
      }

      const updatedUser = { ...user, pin: newPin }
      setUser(updatedUser)
      localStorage.setItem('pos_user', JSON.stringify(updatedUser))
      
      return { success: true }
    } catch (error) {
      return { success: false, error: 'Failed to update PIN' }
    }
  }

  const resetLoginAttempts = async () => {
    if (!user) return

    try {
      await supabase
        .from('pos_users')
        .update({ 
          login_attempts: 0,
          locked_until: null
        })
        .eq('id', user.id)
      
      setIsAccountLocked(false)
    } catch (error) {
      console.error('Error resetting login attempts:', error)
    }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    changePin,
    resetLoginAttempts,
    isAccountLocked,
  }

  return <PinAuthContext.Provider value={value}>{children}</PinAuthContext.Provider>
}

export function usePinAuth() {
  const context = useContext(PinAuthContext)
  if (context === undefined) {
    throw new Error('usePinAuth must be used within a PinAuthProvider')
  }
  return context
}
