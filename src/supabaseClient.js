import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase credentials not found. Online mode disabled.')
}

export const supabase = createClient(supabaseUrl || '', supabaseKey || '')

export const isSupabaseConfigured = () => {
  return !!(supabaseUrl && supabaseKey)
}

console.log('✓ Supabase client initialized', isSupabaseConfigured() ? '(Online Mode)' : '(Offline Mode)')