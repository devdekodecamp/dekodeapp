// TODO: Configure Supabase client
// Replace with your Supabase URL and anon key once you have them

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Example usage:
// import { supabase } from '@/lib/supabase'
// const { data, error } = await supabase.from('users').select('*')



