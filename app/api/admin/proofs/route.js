import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or service role key is not set for admin proofs route')
}

const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null

// GET - List all proofs with user info
export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured on the server' },
        { status: 500 },
      )
    }

    const { data, error } = await supabaseAdmin
      .from('proofs')
      .select(`
        id,
        user_id,
        week,
        module_title,
        proof_url,
        status,
        submitted_at
      `)
      .order('submitted_at', { ascending: false })

    if (error) {
      // eslint-disable-next-line no-console
      console.error('Error fetching proofs:', error)
      return NextResponse.json(
        { error: error.message || 'Failed to fetch proofs' },
        { status: 400 },
      )
    }

    const proofs = data || []

    // Load profile info separately since there is no direct FK relationship
    const userIds = [...new Set(proofs.map((p) => p.user_id).filter(Boolean))]
    let profilesMap = {}

    if (userIds.length > 0) {
      const { data: profiles, error: profilesError } = await supabaseAdmin
        .from('profiles')
        .select('id, name, email')
        .in('id', userIds)

      if (profilesError) {
        // eslint-disable-next-line no-console
        console.error('Error fetching profiles for proofs:', profilesError)
      } else if (profiles) {
        profilesMap = profiles.reduce((acc, profile) => {
          acc[profile.id] = profile
          return acc
        }, {})
      }
    }

    const mapped = proofs.map((p) => {
      const profile = profilesMap[p.user_id] || {}
      return {
        id: p.id,
        userId: p.user_id,
        userName: profile.name || 'User',
        userEmail: profile.email || '',
        week: p.week,
        moduleTitle: p.module_title || `Week ${p.week}`,
        proofUrl: p.proof_url,
        status: p.status || 'pending',
        submittedAt: p.submitted_at,
      }
    })

    return NextResponse.json(mapped, { status: 200 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error fetching proofs:', err)
    return NextResponse.json(
      { error: 'Unexpected error while fetching proofs' },
      { status: 500 },
    )
  }
}


