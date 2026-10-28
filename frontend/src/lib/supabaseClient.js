import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

const hasCredentials = supabaseUrl && supabaseAnonKey

// Real Supabase client when credentials exist, no-op mock when they don't
export const supabase = hasCredentials
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
    })
  : {
      // Minimal mock so the app loads without Supabase credentials
      auth: {
        getSession: async () => ({ data: { session: null }, error: null }),
        signUp: async () => ({ data: null, error: { message: 'Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env' } }),
        signInWithPassword: async () => ({ data: null, error: { message: 'Supabase not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to frontend/.env' } }),
        signOut: async () => ({ error: null }),
        getUser: async () => ({ data: { user: null }, error: null }),
        onAuthStateChange: (cb) => {
          cb('INITIAL_SESSION', null)
          return { data: { subscription: { unsubscribe: () => {} } } }
        },
        refreshSession: async () => ({ error: null }),
      },
    }

if (!hasCredentials) {
  console.warn(
    '[TravelPlanner] Supabase credentials not set.\n' +
    'Open frontend/.env and fill in:\n' +
    '  VITE_SUPABASE_URL=https://your-project.supabase.co\n' +
    '  VITE_SUPABASE_ANON_KEY=your-anon-key\n' +
    'Get them from supabase.com → your project → Settings → API'
  )
}
