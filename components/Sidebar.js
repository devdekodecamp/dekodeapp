'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  LayoutDashboard,
  Users,
  UserPlus,
  FileCheck,
  Calendar,
  LogOut,
  Menu,
  X,
  User,
  BookOpen,
  FileText
} from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function Sidebar({ role = 'user' }) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      // Sign out and immediately redirect
      await supabase.auth.signOut()
      // Use router for immediate redirect, fallback to window.location
      router.push('/')
      window.location.href = '/'
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Error during logout:', err)
      // Redirect anyway
      router.push('/')
      window.location.href = '/'
    }
  }

  const adminMenuItems = [
    { href: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/admin/create-account', icon: UserPlus, label: 'Create Account' },
    { href: '/admin/users', icon: Users, label: 'All Users' },
    { href: '/admin/verify-proofs', icon: FileCheck, label: 'Verify Proofs' },
    { href: '/admin/weeks', icon: BookOpen, label: 'Weeks CMS' },
  ]

  const userMenuItems = [
    { href: '/user/dashboard', icon: Calendar, label: 'My Modules' },
    { href: '/user/proofs', icon: FileText, label: 'My Proofs' },
    { href: '/user/settings', icon: User, label: 'Settings' },
  ]

  const menuItems = role === 'admin' ? adminMenuItems : userMenuItems

  const isActive = (href) => pathname === href

  return (
    <>
      {/* Mobile menu button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gradient-to-r from-[#e01414] via-[#760da3] to-[#008cff] text-white hover:opacity-90"
      >
        {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white text-gray-900 border-r border-gray-200 transform transition-transform duration-300 ease-in-out z-40 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="p-6 border-b border-gray-200">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-[#e01414] via-[#760da3] to-[#008cff] bg-clip-text text-transparent">
              {role === 'admin' ? 'Admin' : 'User'} Dashboard
            </h1>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.href)
                      ? 'bg-gradient-to-r from-[#e01414] via-[#760da3] to-[#008cff] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-medium">{item.label}</span>
                </Link>
              )
            })}
          </nav>

          {/* Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-medium">Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  )
}

