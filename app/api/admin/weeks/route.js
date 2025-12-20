import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or anon key is not set in environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// GET - Fetch all weeks
export async function GET() {
  try {
    const { data, error } = await supabase
      .from('weeks')
      .select('*')
      .order('week_number', { ascending: true })

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching weeks:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch weeks' },
        { status: 500 },
      )
    }

    return NextResponse.json(data || [], { status: 200 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error fetching weeks:', err)
    return NextResponse.json(
      { error: 'Unexpected error while fetching weeks' },
      { status: 500 },
    )
  }
}

// POST - Create a new week
export async function POST(request) {
  try {
    const body = await request.json()
    const {
      week_number,
      title,
      video_url,
      module_link,
      drive_embed_url,
      thumbnail_url,
      primary_text,
      secondary_text,
      is_published,
    } = body

    if (!week_number || !title) {
      return NextResponse.json(
        { error: 'Week number and title are required' },
        { status: 400 },
      )
    }

    const { data, error } = await supabase
      .from('weeks')
      .insert({
        week_number: Number(week_number),
        title,
        video_url: video_url || null,
        module_link: module_link || null,
        drive_embed_url: drive_embed_url || null,
        thumbnail_url: thumbnail_url || null,
        primary_text: primary_text || null,
        secondary_text: secondary_text || null,
        is_published: is_published !== undefined ? Boolean(is_published) : true,
      })
      .select()
      .single()

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error creating week:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to create week' },
        { status: 400 },
      )
    }

    return NextResponse.json(data, { status: 201 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error creating week:', err)
    return NextResponse.json(
      { error: 'Unexpected error while creating week' },
      { status: 500 },
    )
  }
}
