'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Lock, User, CheckCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function UserSettings() {
  const { user, loading: authLoading } = useAuth('user')
  const [profileLoading, setProfileLoading] = useState(false)
  const [passwordLoading, setPasswordLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [passwordSuccess, setPasswordSuccess] = useState(false)
  const [error, setError] = useState('')

  const [profileData, setProfileData] = useState({
    name: 'User Name',
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    // Load user profile data after auth is confirmed
    if (!authLoading && user) {
      const loadProfile = async () => {
        const { data: profile } = await supabase
          .from('profiles')
          .select('name, email, role')
          .eq('id', user.id)
          .maybeSingle()

        setProfileData({
          name: profile?.name || user.user_metadata?.name || 'User',
        })
      }

      loadProfile()
    }
  }, [authLoading, user])

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const handleProfileUpdate = async (e) => {
    e.preventDefault()
    setProfileLoading(true)
    setError('')
    setProfileSuccess(false)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        setError(userError?.message || 'You must be logged in to update your profile')
        setProfileLoading(false)
        return
      }

      // Update name in auth metadata
      const { error: nameError } = await supabase.auth.updateUser({
        data: { name: profileData.name },
      })

      if (nameError) {
        setError(nameError.message)
        setProfileLoading(false)
        return
      }

      // Update profiles table with name
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ name: profileData.name })
        .eq('id', userData.user.id)

      if (profileError) {
        setError(profileError.message)
        setProfileLoading(false)
        return
      }

      setProfileSuccess(true)
      setError('')
      setTimeout(() => setProfileSuccess(false), 3000)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      setError('Unexpected error while updating profile')
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordUpdate = async (e) => {
    e.preventDefault()
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setPasswordLoading(true)
    setError('')
    setPasswordSuccess(false)

    try {
      const { data: userData, error: userError } = await supabase.auth.getUser()
      if (userError || !userData?.user) {
        setError(userError?.message || 'You must be logged in to update your password')
        setPasswordLoading(false)
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      })

      if (updateError) {
        setError(updateError.message)
        setPasswordLoading(false)
        return
      }

      setPasswordSuccess(true)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setError('')
      setTimeout(() => setPasswordSuccess(false), 3000)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      setError('Unexpected error while updating password')
    } finally {
      setPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="user" />
      <div className="lg:pl-64">
        <Header userName={profileData.name} role="user" />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Settings
            </h1>
            <p className="text-gray-600">
              Manage your account settings
            </p>
          </div>

          <div className="max-w-2xl space-y-6">
            {/* Profile Section */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
              
              {profileSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">
                    Profile updated successfully!
                  </p>
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800 font-medium">
                    {error}
                  </p>
                </div>
              )}

              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="name"
                      type="text"
                      value={profileData.name}
                      onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                      placeholder="Your name"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={profileLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {profileLoading ? 'Updating...' : 'Update Profile'}
                </button>
              </form>
            </div>

            {/* Password Section */}
            <div className="bg-white rounded-xl shadow-sm p-8 border border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">Change Password</h2>
              
              {passwordSuccess && (
                <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <p className="text-green-800 font-medium">
                    Password updated successfully!
                  </p>
                </div>
              )}

              <form onSubmit={handlePasswordUpdate} className="space-y-6">
                <div>
                  <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Current Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                      placeholder="Enter current password"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                      placeholder="Enter new password"
                    />
                  </div>
                  <p className="mt-2 text-sm text-gray-500">
                    Password must be at least 6 characters long
                  </p>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirm New Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                      required
                      minLength={6}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-900"
                      placeholder="Confirm new password"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {passwordLoading ? 'Updating...' : 'Update Password'}
                </button>
              </form>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

