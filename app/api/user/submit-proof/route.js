import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseAnonKey) {
  // eslint-disable-next-line no-console
  console.warn('Supabase URL or anon key is not set in environment variables')
}

// POST - Submit a proof for a week
export async function POST(request) {
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
    
    // Create a Supabase client
    const supabase = createClient(supabaseUrl, supabaseAnonKey)
    
    // Set the auth token for RLS
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid token' },
        { status: 401 }
      )
    }
    
    // Create a client with the user's session for RLS
    const supabaseWithAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    })

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file')
    const weekNumber = parseInt(formData.get('weekNumber'), 10)
    const weekTitle = formData.get('weekTitle') || ''

    if (!file || !weekNumber) {
      return NextResponse.json(
        { error: 'File and week number are required' },
        { status: 400 }
      )
    }

    // Generate a unique file name
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${weekNumber}-${Date.now()}.${fileExt}`
    
    // Upload file to Supabase Storage (use authenticated client)
    const { data: uploadData, error: uploadError } = await supabaseWithAuth.storage
      .from('proofs')
      .upload(fileName, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      // eslint-disable-next-line no-console
      console.error('Upload error:', uploadError)
      return NextResponse.json(
        { error: uploadError.message || 'Failed to upload file' },
        { status: 500 }
      )
    }

    // Get public URL for the uploaded file
    const { data: urlData } = supabaseWithAuth.storage
      .from('proofs')
      .getPublicUrl(fileName)

    const proofUrl = urlData.publicUrl

    // Create proof record in database (use authenticated client for RLS)
    const { data: proofData, error: proofError } = await supabaseWithAuth
      .from('proofs')
      .insert({
        user_id: user.id,
        week: weekNumber,
        module_title: weekTitle,
        proof_url: proofUrl,
        status: 'pending',
      })
      .select()
      .single()

    if (proofError) {
      // eslint-disable-next-line no-console
      console.error('Database error:', proofError)
      // Try to clean up uploaded file if database insert fails
      await supabaseWithAuth.storage.from('proofs').remove([fileName])
      
      return NextResponse.json(
        { error: proofError.message || 'Failed to save proof record' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { 
        success: true, 
        proof: proofData,
        message: 'Proof submitted successfully' 
      },
      { status: 201 }
    )
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error('Unexpected error submitting proof:', err)
    return NextResponse.json(
      { error: 'Unexpected error while submitting proof' },
      { status: 500 }
    )
  }
}

