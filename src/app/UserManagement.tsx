'use client'

import { useState, useEffect } from 'react'

import { supabase } from '@/lib/supabase'
import { Lock, Unlock, User, Shield } from 'lucide-react'



interface UserRow {
  id: string
  name: string | null
  role: 'admin' | 'cashier' | 'manager'
  is_active: boolean
  email?: string | null
  login_attempts?: number
  last_login?: string | null
  locked_until?: string | null
}

export default function UserManagement() {
  const [role, setRole] = useState<'admin' | 'manager' | 'cashier' | null>(null)
  const [users, setUsers] = useState<UserRow[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const init = async () => {
      const { data: u } = await supabase.auth.getUser()
      if (!u.user) { setRole(null); setLoading(false); return }
      const { data: prof } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', u.user.id)
        .single()
      const r = prof?.role as ('admin' | 'manager' | 'cashier') | undefined
      setRole(r ?? null)
      await loadUsers()
    }
    init()
    const sub = supabase.auth.onAuthStateChange((_e, session) => {
      if (!session?.user) setRole(null)
    })
    return () => sub.data.subscription.unsubscribe()
  }, [])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, name, role, is_active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  // no unlock flow in email/password + profiles setup
  const unlockUser = async (_userId: string) => {
    // Unlock flow not implemented in this setup
    return
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId)

      if (error) throw error
      loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  if (role !== 'admin') {
    return (
      <div className="text-center py-8">
        <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">Access denied. Admin privileges required.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Login Attempts</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <User className="w-5 h-5 text-gray-400 mr-2" />
                      <div>
                        <div className="font-medium text-gray-900">{user.name}</div>
                        {user.email && (
                          <div className="text-sm text-gray-500">{user.email}</div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'admin' ? 'bg-red-100 text-red-800' :
                      user.role === 'manager' ? 'bg-blue-100 text-blue-800' :
                      'bg-green-100 text-green-800'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {user.login_attempts}/5
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {user.last_login ? new Date(user.last_login).toLocaleDateString() : 'Never'}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex space-x-2">
                      {user.locked_until && (
                        <button
                          onClick={() => unlockUser(user.id)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Unlock user"
                        >
                          <Unlock className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => toggleUserStatus(user.id, !user.is_active)}
                        className={`${
                          user.is_active ? 'text-red-600 hover:text-red-800' : 'text-green-600 hover:text-green-800'
                        }`}
                        title={user.is_active ? 'Deactivate user' : 'Activate user'}
                      >
                        {user.is_active ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}