import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or anon key is not set in environment variables')
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// GET - Fetch proofs for the authenticated user
export async function GET(request) {
  try {
    // Get the authorization header
    const authHeader = request.headers.get('authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized - No token provided' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    
    // Create a Supabase client with the user's token for RLS
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })
    
    // Verify the token and get the user
    const { data: { user }, error: authError } = await supabaseWithAuth.auth.getUser()
    
    if (authError || !user) {
      // eslint-disable-next-line no-console
      console.error('Auth error:', authError)
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }

    // Fetch proofs for this user - using correct column names (week, not week_number)
    const { data: proofs, error: proofError } = await supabaseWithAuth
      .from('proofs')
      .select(`
        id,
        week,
        proof_url,
        status,
        submitted_at,
        module_title
      `)
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })

    if (proofError) {
      // If table doesn't exist, return empty array instead of error
      if (proofError.code === '42P01' || proofError.code === 'PGRST116') {
        return NextResponse.json([], { status: 200 })
      }
      
      // eslint-disable-next-line no-console
      console.error('Error fetching proofs:', proofError)
      return NextResponse.json(
        { error: proofError.message || 'Failed to fetch proofs' },
        { status: 500 }
      )
    }

    // Fetch week titles separately
    const weekNumbers = [...new Set((proofs || []).map(p => p.week))]
    let weekTitlesMap = {}
    
    if (weekNumbers.length > 0) {
      const { data: weeks } = await supabaseWithAuth
        .from('weeks')
        .select('week_number, title')
        .in('week_number', weekNumbers)
      
      if (weeks) {
        weekTitlesMap = weeks.reduce((acc, week) => {
          acc[week.week_number] = week.title
          return acc
        }, {})
      }
    }

    // Map the data to a cleaner structure
    const mappedProofs = (proofs || []).map(proof => ({
      id: proof.id,
      weekNumber: proof.week,
      weekTitle: weekTitlesMap[proof.week] || proof.module_title || `Week ${proof.week}`,
      proofUrl: proof.proof_url,
      status: proof.status || 'pending',
      submittedAt: proof.submitted_at,
      reviewedAt: null, // This column doesn't exist in the schema
    }))

    return NextResponse.json(mappedProofs, { status: 200 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error fetching proofs:', err)
    return NextResponse.json(
      { error: 'Unexpected error while fetching proofs' },
      { status: 500 }
    )
  }
}

