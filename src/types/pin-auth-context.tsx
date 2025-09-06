'use client'

import { createContext, useContext, useEffect, useState } from 'react'

interface User {
  id: string
  name: string
  role: 'admin' | 'cashier' | 'manager'
  pin: string
}

interface PinAuthContextType {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  login: (pin: string) => Promise<{ success: boolean; error?: string }>
  logout: () => void
  changePin: (oldPin: string, newPin: string) => Promise<{ success: boolean; error?: string }>
}

const PinAuthContext = createContext<PinAuthContextType | undefined>(undefined)

// Sample users - in production, this would come from your database
const SAMPLE_USERS: User[] = [
  { id: '1', name: 'Admin User', role: 'admin', pin: '1234' },
  { id: '2', name: 'Cashier 1', role: 'cashier', pin: '5678' },
  { id: '3', name: 'Manager', role: 'manager', pin: '9999' },
]

export function PinAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check for existing session in localStorage
    const savedUser = localStorage.getItem('pos_user')
    if (savedUser) {
      try {
        const userData = JSON.parse(savedUser)
        setUser(userData)
      } catch (error) {
        localStorage.removeItem('pos_user')
      }
    }
    setLoading(false)
  }, [])

  const login = async (pin: string): Promise<{ success: boolean; error?: string }> => {
    const foundUser = SAMPLE_USERS.find(u => u.pin === pin)
    
    if (foundUser) {
      setUser(foundUser)
      localStorage.setItem('pos_user', JSON.stringify(foundUser))
      return { success: true }
    } else {
      return { success: false, error: 'Invalid PIN code' }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('pos_user')
  }

  const changePin = async (oldPin: string, newPin: string): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'No user logged in' }
    }

    if (user.pin !== oldPin) {
      return { success: false, error: 'Current PIN is incorrect' }
    }

    if (newPin.length !== 4 || !/^\d+$/.test(newPin)) {
      return { success: false, error: 'PIN must be 4 digits' }
    }

    // In a real app, you'd update this in the database
    const updatedUser = { ...user, pin: newPin }
    setUser(updatedUser)
    localStorage.setItem('pos_user', JSON.stringify(updatedUser))
    
    return { success: true }
  }

  const value = {
    user,
    isAuthenticated: !!user,
    loading,
    login,
    logout,
    changePin,
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