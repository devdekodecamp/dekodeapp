import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !serviceRoleKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or service role key is not set for verify-proof route')
}

const supabaseAdmin = serviceRoleKey ? createClient(supabaseUrl, serviceRoleKey) : null

export async function POST(request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: 'Supabase admin client is not configured on the server' },
        { status: 500 },
      )
    }

    const { proofId, approved } = await request.json()

    if (!proofId || typeof approved !== 'boolean') {
      return NextResponse.json({ error: 'proofId and approved flag are required' }, { status: 400 })
    }

    // Update proof status in a `proofs` table
    const { data: proof, error: updateError } = await supabaseAdmin
      .from('proofs')
      .update({ status: approved ? 'verified' : 'rejected' })
      .eq('id', proofId)
      .select('id, user_id, week')
      .maybeSingle()

    if (updateError || !proof) {
      return NextResponse.json(
        { error: updateError?.message || 'Failed to update proof status' },
        { status: 400 },
      )
    }

    // Optionally update user progress in a `user_progress` table if it exists
    if (approved && proof.user_id && proof.week) {
      try {
        await supabaseAdmin
          .from('user_progress')
          .upsert(
            {
              user_id: proof.user_id,
              week: proof.week,
              verified: true,
            },
            {
              onConflict: 'user_id,week',
            },
          )
      } catch (progressErr) {
        // eslint-disable-next-line no-console
        console.warn('Failed to upsert user_progress (may be expected if table does not exist):', progressErr)
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Verify proof error', err)
    return NextResponse.json({ error: 'Unexpected error while verifying proof' }, { status: 500 })
  }
}

