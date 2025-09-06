'use client'

import { useState, useEffect } from 'react'
import { usePinAuth } from '@/lib/pin-auth-context'
import { supabase } from '@/lib/supabase'
import { Plus, Edit, Trash2, Lock, Unlock, User, Shield } from 'lucide-react'

interface User {
  id: string
  name: string
  email?: string
  role: 'admin' | 'cashier' | 'manager'
  is_active: boolean
  login_attempts: number
  locked_until?: string
  last_login?: string
}

export default function UserManagement() {
  const { user: currentUser } = usePinAuth()
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddUser, setShowAddUser] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadUsers()
    }
  }, [currentUser])

  const loadUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('pos_users')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setUsers(data || [])
    } catch (error) {
      console.error('Error loading users:', error)
    } finally {
      setLoading(false)
    }
  }

  const unlockUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('pos_users')
        .update({ 
          login_attempts: 0,
          locked_until: null
        })
        .eq('id', userId)

      if (error) throw error
      loadUsers()
    } catch (error) {
      console.error('Error unlocking user:', error)
    }
  }

  const toggleUserStatus = async (userId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('pos_users')
        .update({ is_active: isActive })
        .eq('id', userId)

      if (error) throw error
      loadUsers()
    } catch (error) {
      console.error('Error updating user status:', error)
    }
  }

  if (currentUser?.role !== 'admin') {
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
        <button
          onClick={() => setShowAddUser(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add User
        </button>
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