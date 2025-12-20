'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Users, UserPlus, FileCheck, CheckCircle } from 'lucide-react'

export default function AdminDashboard() {
  const { loading } = useAuth('admin')
  const [stats, setStats] = useState([
    { label: 'Total Users', value: '—', icon: Users, color: 'bg-blue-500' },
    { label: 'Accounts Created', value: '—', icon: UserPlus, color: 'bg-green-500' },
    { label: 'Pending Verifications', value: '—', icon: FileCheck, color: 'bg-yellow-500' },
    { label: 'Verified Modules', value: '—', icon: CheckCircle, color: 'bg-indigo-500' },
  ])
  const [error, setError] = useState('')

  useEffect(() => {
    if (loading) return

    const loadStats = async () => {
      try {
        const res = await fetch('/api/admin/stats')
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to load stats')
          return
        }

        setStats([
          { label: 'Total Users', value: String(data.totalUsers ?? 0), icon: Users, color: 'bg-blue-500' },
          { label: 'Accounts Created', value: String(data.accountsCreated ?? 0), icon: UserPlus, color: 'bg-green-500' },
          { label: 'Pending Verifications', value: String(data.pendingVerifications ?? 0), icon: FileCheck, color: 'bg-yellow-500' },
          { label: 'Verified Modules', value: String(data.verifiedModules ?? 0), icon: CheckCircle, color: 'bg-indigo-500' },
        ])
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Error loading admin stats:', err)
        setError('Unexpected error while loading stats')
      }
    }

    loadStats()
  }, [loading])

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="admin" />
      <div className="lg:pl-64">
        <Header userName="Admin User" role="admin" />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Overview of your platform
            </p>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon
              return (
                <div
                  key={index}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.label}
                      </p>
                      <p className="text-3xl font-bold text-gray-900 mt-2">
                        {stat.value}
                      </p>
                    </div>
                    <div className={`${stat.color} p-3 rounded-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Quick Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="/admin/create-account"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
              >
                <UserPlus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Create New Account</p>
              </a>
              <a
                href="/admin/users"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
              >
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">View All Users</p>
              </a>
              <a
                href="/admin/verify-proofs"
                className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center"
              >
                <FileCheck className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="font-medium text-gray-900">Verify Proofs</p>
              </a>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

