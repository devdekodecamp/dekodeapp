import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or service role key is not set for admin stats route')
}

const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured on the server' },
        { status: 500 },
      )
    }

    // Total users
    const { count: totalUsers, error: usersError } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      // eslint-disable-next-line no-console
      console.error('Error counting users:', usersError)
    }

    // Pending proofs
    const { count: pendingProofs, error: pendingError } = await supabaseAdmin
      .from('proofs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending')

    if (pendingError) {
      // eslint-disable-next-line no-console
      console.error('Error counting pending proofs:', pendingError)
    }

    // Verified proofs
    const { count: verifiedProofs, error: verifiedError } = await supabaseAdmin
      .from('proofs')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'verified')

    if (verifiedError) {
      // eslint-disable-next-line no-console
      console.error('Error counting verified proofs:', verifiedError)
    }

    return NextResponse.json(
      {
        totalUsers: totalUsers ?? 0,
        accountsCreated: totalUsers ?? 0,
        pendingVerifications: pendingProofs ?? 0,
        verifiedModules: verifiedProofs ?? 0,
      },
      { status: 200 },
    )
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error fetching admin stats:', err)
    return NextResponse.json(
      { error: 'Unexpected error while fetching admin stats' },
      { status: 500 },
    )
  }
}


