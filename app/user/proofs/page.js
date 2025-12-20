'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { CheckCircle, Clock, XCircle, Eye, Calendar } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function UserProofs() {
  const { user, loading: authLoading } = useAuth('user')
  const [proofs, setProofs] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedProof, setSelectedProof] = useState(null)
  const [userName, setUserName] = useState('User')

  useEffect(() => {
    if (authLoading) return

    // Load user name from profile
    const loadUserName = async () => {
      if (user) {
        try {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', user.id)
            .maybeSingle()

          if (profile?.name) {
            setUserName(profile.name)
          } else if (user.user_metadata?.name) {
            setUserName(user.user_metadata.name)
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Error loading user name:', err)
        }
      }
    }

    const loadProofs = async () => {
      setLoading(true)
      setError('')
      
      try {
        // Get the session token
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          setError('Not authenticated')
          setLoading(false)
          return
        }

        const res = await fetch('/api/user/proofs', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
          },
        })

        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Failed to load proofs')
          setLoading(false)
          return
        }

        setProofs(data || [])
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(err)
        setError('Unexpected error while loading proofs')
      } finally {
        setLoading(false)
      }
    }

    loadUserName()
    loadProofs()
  }, [authLoading, user])

  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (selectedProof) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [selectedProof]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 font-sans">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'verified':
        return (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 flex items-center space-x-1">
            <CheckCircle className="w-3 h-3" />
            <span>Verified</span>
          </span>
        )
      case 'rejected':
        return (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 flex items-center space-x-1">
            <XCircle className="w-3 h-3" />
            <span>Rejected</span>
          </span>
        )
      default:
        return (
          <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 flex items-center space-x-1">
            <Clock className="w-3 h-3" />
            <span>Pending Review</span>
          </span>
        )
    }
  }

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role="user" />
      <div className="lg:pl-64">
        <Header userName={userName} role="user" />
        <main className="p-6">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              My Proof Submissions
            </h1>
            <p className="text-gray-600">
              Track the status of your proof submissions
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-gray-600">Loading proofs...</div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
              {error}
            </div>
          ) : proofs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm p-12 border border-gray-200 text-center">
              <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Proofs Submitted Yet
              </h3>
              <p className="text-gray-600 mb-6">
                Submit proofs for your completed modules to see them here.
              </p>
              <a
                href="/user/dashboard"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Go to My Modules
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {proofs.map((proof) => (
                <div
                  key={proof.id}
                  className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-1">
                        {proof.weekTitle}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2">
                        Week {proof.weekNumber}
                      </p>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Submitted: {formatDate(proof.submittedAt)}</span>
                        </div>
                        {proof.reviewedAt && (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="w-4 h-4" />
                            <span>Reviewed: {formatDate(proof.reviewedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {getStatusBadge(proof.status)}
                  </div>

                  {proof.proofUrl && (
                    <div className="mt-4">
                      <button
                        onClick={() => setSelectedProof(proof)}
                        className="flex items-center space-x-2 text-indigo-600 hover:text-indigo-700 transition-colors"
                      >
                        <Eye className="w-5 h-5" />
                        <span className="font-medium">View Proof</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Proof View Modal */}
          {selectedProof && (
            <div
              className="fixed inset-0 bg-gray-950/70 flex items-center justify-center z-50 p-4"
              onClick={() => setSelectedProof(null)}
            >
              <div
                className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-gray-900">
                      {selectedProof.weekTitle} - Proof Submission
                    </h3>
                    <button
                      onClick={() => setSelectedProof(null)}
                      className="text-gray-400 hover:text-gray-600"
                    >
                      <XCircle className="w-6 h-6" />
                    </button>
                  </div>

                  <div className="mb-4">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Submitted: {formatDate(selectedProof.submittedAt)}</span>
                      </div>
                      {selectedProof.reviewedAt && (
                        <div className="flex items-center space-x-1">
                          <CheckCircle className="w-4 h-4" />
                          <span>Reviewed: {formatDate(selectedProof.reviewedAt)}</span>
                        </div>
                      )}
                    </div>
                    <div className="mb-4">
                      {getStatusBadge(selectedProof.status)}
                    </div>
                  </div>

                  {selectedProof.proofUrl && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={selectedProof.proofUrl}
                        alt="Proof submission"
                        className="w-full h-auto"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

