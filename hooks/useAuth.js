'use client'

import { useEffect, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { useAuth as useAuthContext } from '@/contexts/AuthContext'

/**
 * Custom hook for authentication and authorization
 * Uses AuthContext for core auth state, adds role-based checks
 * @param {string} requiredRole - 'admin' or 'user' or null for any authenticated user
 * @returns {object} { user, role, loading, isAdmin }
 */
export function useAuth(requiredRole = null) {
  const { user, loading: contextLoading } = useAuthContext()
  const [role, setRole] = useState(null)
  const [roleLoading, setRoleLoading] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Wait for context to finish loading
    if (contextLoading) {
      return
    }

    // If no user and we're not on the login page, redirect to login
    if (!user) {
      setRole(null)
      setRoleLoading(false)

      if (pathname !== '/') {
        router.replace('/')
      }
      return
    }

    // User exists, check their role
    const checkRole = async () => {
      setRoleLoading(true)
      try {
        let userRole = 'user'
        let isAdmin = false

        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()

          if (profile?.role === 'admin') {
            userRole = 'admin'
            isAdmin = true
          }
        } catch {
          // eslint-disable-next-line no-console
          console.warn('Unable to read profile, using fallback logic')
        }

        // Fallback: check email for admin
        if (!isAdmin && user.email === 'dev@dekodecamp.com') {
          userRole = 'admin'
          isAdmin = true
        }

        setRole(userRole)

        // Check if user has required role
        if (requiredRole === 'admin' && !isAdmin) {
          // Admin required but user is not admin
          router.replace('/user/dashboard')
          setRoleLoading(false)
          return
        }

        if (requiredRole === 'user' && isAdmin) {
          // User role required but user is admin
          router.replace('/admin/dashboard')
          setRoleLoading(false)
          return
        }

        setRoleLoading(false)
      } catch (error) {
        // eslint-disable-next-line no-console
        console.error('Role check error:', error)
        setRole(null)
        setRoleLoading(false)
      }
    }

    checkRole()
  }, [user, contextLoading, requiredRole, router, pathname])

  // Loading is true if context is loading OR if we're checking role
  const loading = contextLoading || roleLoading

  return {
    user,
    role,
    loading,
    isAdmin: role === 'admin',
  }
}
