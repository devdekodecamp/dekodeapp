'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'
import { Plus, Save, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function WeeksCMS() {
  const { loading: authLoading } = useAuth('admin')
  const [weeks, setWeeks] = useState([])
  const [loading, setLoading] = useState(false)
  const [savingId, setSavingId] = useState(null)
  const [error, setError] = useState('')

  const emptyWeek = {
    id: null,
    week_number: '',
    title: '',
    video_url: '',
    module_link: '',
    thumbnail_url: '',
    is_published: true,
  }

  const fetchWeeks = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/admin/weeks')
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to load weeks')
        setLoading(false)
        return
      }
      
      // Always ensure weeks 1-6 exist with default values
      const weeksMap = new Map()
      
      // Add existing weeks to map
      if (data && data.length > 0) {
        data.forEach((week) => {
          weeksMap.set(week.week_number, week)
        })
      }
      
      // Fill in missing weeks 1-6 with defaults
      const allWeeks = []
      for (let i = 1; i <= 6; i++) {
        if (weeksMap.has(i)) {
          allWeeks.push(weeksMap.get(i))
        } else {
          allWeeks.push({
            ...emptyWeek,
            week_number: i,
            title: `Week ${i}`,
          })
        }
      }
      
      // Sort by week_number to ensure proper order
      allWeeks.sort((a, b) => a.week_number - b.week_number)
      setWeeks(allWeeks)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      setError('Unexpected error while loading weeks')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // Only load data after auth is confirmed
    if (!authLoading) {
      fetchWeeks()
    }
  }, [authLoading])

  const handleFieldChange = (index, field, value) => {
    const updated = [...weeks]
    updated[index] = { ...updated[index], [field]: value }
    setWeeks(updated)
  }

  const handleThumbnailChange = async (index, file) => {
    if (!file) return

    try {
      const week = weeks[index]
      const weekNumber = week.week_number || `temp-${index + 1}`
      const ext = file.name.split('.').pop()
      const fileName = `week_${weekNumber}_${Date.now()}.${ext}`

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('week_thumbnails')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true,
        })

      if (uploadError) {
        // eslint-disable-next-line no-console
        console.error('Thumbnail upload error:', uploadError)
        // eslint-disable-next-line no-alert
        alert(uploadError.message || 'Failed to upload thumbnail')
        return
      }

      const { data: urlData } = supabase.storage
        .from('week_thumbnails')
        .getPublicUrl(uploadData.path)

      const url = urlData?.publicUrl || null
      if (!url) return

      const updated = [...weeks]
      updated[index] = { ...updated[index], thumbnail_url: url }
      setWeeks(updated)
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Unexpected error uploading thumbnail:', err)
      // eslint-disable-next-line no-alert
      alert('Unexpected error while uploading thumbnail')
    }
  }

  const addNewRow = () => {
    setWeeks((prev) => [...prev, { ...emptyWeek }])
  }

  const saveWeek = async (week, index) => {
    setSavingId(week.id || `new-${index}`)
    setError('')
    try {
      const isNew = !week.id
      const url = isNew ? '/api/admin/weeks' : `/api/admin/weeks/${week.id}`
      const method = isNew ? 'POST' : 'PATCH'

      const payload = {
        week_number: Number(week.week_number),
        title: week.title,
        video_url: week.video_url || null,
        module_link: week.module_link || null,
        thumbnail_url: week.thumbnail_url || null,
        is_published: !!week.is_published,
      }

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to save week')
        return
      }

      // Refresh list to get latest data/order
      await fetchWeeks()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      setError('Unexpected error while saving week')
    } finally {
      setSavingId(null)
    }
  }

  const deleteWeek = async (week) => {
    if (!week.id) {
      setWeeks((prev) => prev.filter((w) => w !== week))
      return
    }

    // eslint-disable-next-line no-alert
    const confirmDelete = window.confirm('Delete this week configuration?')
    if (!confirmDelete) return

    setSavingId(week.id)
    setError('')
    try {
      const res = await fetch(`/api/admin/weeks/${week.id}`, {
        method: 'DELETE',
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to delete week')
        return
      }
      await fetchWeeks()
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
      setError('Unexpected error while deleting week')
    } finally {
      setSavingId(null)
    }
  }

  // Show loading state while checking authentication
  if (authLoading) {
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
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Weeks CMS
              </h1>
              <p className="text-gray-600">
                Manage each week&apos;s title, module link, and Google Drive video embed.
              </p>
            </div>
            <button
              type="button"
              onClick={addNewRow}
              className="inline-flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              <Plus className="w-5 h-5" />
              <span>Add Week</span>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Week #
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thumbnail
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Module Link
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Google Drive / Video URL
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Published
                  </th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && weeks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      Loading weeks...
                    </td>
                  </tr>
                )}
                {weeks.map((week, index) => (
                  <tr key={week.id || `new-${index}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 align-top">
                      <input
                        type="number"
                        className="w-20 px-2 py-1 text-sm rounded border border-gray-300 bg-white text-gray-900"
                        value={week.week_number ?? ''}
                        onChange={(e) => handleFieldChange(index, 'week_number', e.target.value)}
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="text"
                        className="w-64 px-2 py-1 text-sm rounded border border-gray-300 bg-white text-gray-900"
                        value={week.title ?? ''}
                        onChange={(e) => handleFieldChange(index, 'title', e.target.value)}
                        placeholder="Week title"
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <div className="space-y-2">
                        {week.thumbnail_url && (
                          <img
                            src={week.thumbnail_url}
                            alt={`Thumbnail for ${week.title || `Week ${week.week_number}`}`}
                            className="w-24 h-16 rounded object-cover border border-gray-200"
                          />
                        )}
                        <label className="block">
                          <span className="sr-only">Upload thumbnail</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handleThumbnailChange(index, e.target.files?.[0] || null)}
                            className="text-xs"
                          />
                        </label>
                      </div>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="url"
                        className="w-64 px-2 py-1 text-sm rounded border border-gray-300 bg-white text-gray-900"
                        value={week.module_link ?? ''}
                        onChange={(e) => handleFieldChange(index, 'module_link', e.target.value)}
                        placeholder="https://..."
                      />
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="url"
                        className="w-64 px-2 py-1 text-sm rounded border border-gray-300 bg-white text-gray-900"
                        value={week.video_url ?? ''}
                        onChange={(e) => handleFieldChange(index, 'video_url', e.target.value)}
                        placeholder="Google Drive share link or video URL"
                      />
                      <p className="mt-1 text-[11px] text-gray-500">
                        Paste the Google Drive share link or any video URL.
                      </p>
                    </td>
                    <td className="px-4 py-3 align-top">
                      <input
                        type="checkbox"
                        checked={!!week.is_published}
                        onChange={(e) => handleFieldChange(index, 'is_published', e.target.checked)}
                      />
                    </td>
                    <td className="px-4 py-3 align-top space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => saveWeek(week, index)}
                        className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={savingId !== null}
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {savingId === (week.id || `new-${index}`) ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteWeek(week)}
                        className="inline-flex items-center px-3 py-1 rounded-lg text-xs font-medium bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled={savingId !== null}
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {!loading && weeks.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-6 text-center text-gray-500">
                      No weeks configured yet. Click &quot;Add Week&quot; to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-6 text-xs text-gray-500 max-w-2xl">
          </div>
        </main>
      </div>
    </div>
  )
}

