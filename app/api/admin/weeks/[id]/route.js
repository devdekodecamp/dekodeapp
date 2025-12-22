import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or anon key is not set in environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// PATCH - Update a week
export async function PATCH(request, { params }) {
  try {
    const { id } = await params
    const body = await request.json()
    const {
      week_number,
      title,
      start_date,
      video_url,
      module_link,
      drive_embed_url,
      thumbnail_url,
      primary_text,
      secondary_text,
      is_published,
    } = body

    const updateData = {}

    if (week_number !== undefined) updateData.week_number = Number(week_number)
    if (title !== undefined) updateData.title = title
    if (start_date !== undefined) updateData.start_date = start_date || null
    if (video_url !== undefined) updateData.video_url = video_url || null
    if (module_link !== undefined) updateData.module_link = module_link || null
    if (drive_embed_url !== undefined) updateData.drive_embed_url = drive_embed_url || null
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url || null
    if (primary_text !== undefined) updateData.primary_text = primary_text || null
    if (secondary_text !== undefined) updateData.secondary_text = secondary_text || null
    if (is_published !== undefined) updateData.is_published = Boolean(is_published)

    const { data, error } = await supabase
      .from('weeks')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error updating week:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to update week' },
        { status: 400 },
      )
    }

    return NextResponse.json(data, { status: 200 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error updating week:', err)
    return NextResponse.json(
      { error: 'Unexpected error while updating week' },
      { status: 500 },
    )
  }
}

// DELETE - Delete a week
export async function DELETE(request, { params }) {
  try {
    const { id } = await params

    const { error } = await supabase
      .from('weeks')
      .delete()
      .eq('id', id)

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error deleting week:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to delete week' },
        { status: 400 },
      )
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error deleting week:', err)
    return NextResponse.json(
      { error: 'Unexpected error while deleting week' },
      { status: 500 },
    )
  }
}
