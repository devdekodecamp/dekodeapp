'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import ProgressBar from '@/components/ProgressBar'
import { Mail, User, Search } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AllUsers() {
  const { loading } = useAuth('admin')
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState([])
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return

    const loadUsers = async () => {
      try {
        // Load profiles (exclude admin users)
        const { data: profiles, error: profilesError } = await supabase
          .from('profiles')
          .select('id, name, email, role')
          .neq('role', 'admin')

        if (profilesError) {
          setError(profilesError.message || 'Failed to load users')
          return
        }

        // Load verified progress per user
        const { data: progress, error: progressError } = await supabase
          .from('user_progress')
          .select('user_id, week, verified')

        if (progressError) {
          // eslint-disable-next-line no-console
          console.error('Error loading user progress:', progressError)
        }

        const progressByUser = (progress || []).reduce((acc, row) => {
          if (row.verified) {
            acc[row.user_id] = (acc[row.user_id] || 0) + 1
          }
          return acc
        }, {})

        const mapped = (profiles || []).map((p) => ({
          id: p.id,
          name: p.name || 'User',
          email: p.email || '',
          progress: progressByUser[p.id] || 0,
          total: 6,
        }))

        setUsers(mapped)
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Unexpected error loading users:', err)
        setError('Unexpected error while loading users')
      }
    }

    loadUsers()
  }, [loading])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const filteredUsers = users.filter(
    (user) =>
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="lg:pl-64">
        <Header userName="Admin User" role="admin" />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              All Users
            </h1>
            <p className="text-gray-600">
              View and manage all user accounts and their progress
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users by name or email..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
              />
            </div>
          </div>

          {/* Users List */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center mr-3">
                            <User className="w-6 h-6 text-white" />
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {user.name}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2" />
                          {user.email}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <ProgressBar progress={user.progress} total={user.total} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            user.progress === user.total
                              ? 'bg-green-100 text-green-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {user.progress === user.total ? 'Completed' : 'In Progress'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No users found</p>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

