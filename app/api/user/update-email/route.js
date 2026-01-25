import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // secret: only on server!
)

export async function POST(request) {
  try {
    const { userId, newEmail } = await request.json()
    if (!userId || !newEmail) {
      return NextResponse.json({ error: 'Missing userId or newEmail' }, { status: 400 })
    }

    // Instantly change email with no confirmation:
    const { data, error } = await supabase.auth.admin.updateUserById(userId, {
      email: newEmail,
      email_confirm: true // <--- this bypasses confirmation and sends NO email
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Update user email in 'profiles'
    await supabase
      .from('profiles')
      .update({ email: newEmail })
      .eq('id', userId)

    return NextResponse.json({ success: true, user: data.user })
  } catch (err) {
    return NextResponse.json({ error: 'Unexpected server error' }, { status: 500 })
  }
}






