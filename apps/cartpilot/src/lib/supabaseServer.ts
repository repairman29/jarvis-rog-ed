import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

export const isSupabaseServerConfigured = () => Boolean(supabaseUrl && supabaseServiceRole)

export const supabaseServer = isSupabaseServerConfigured()
  ? createClient(supabaseUrl, supabaseServiceRole)
  : null
