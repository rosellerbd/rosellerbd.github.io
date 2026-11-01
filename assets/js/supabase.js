// ============================================================
// Roseller — Supabase client bound to Firebase JWT
// ============================================================
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm';

const SUPABASE_URL = 'https://brxcewayxayqfgyrekqh.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_7iKas9NU72vt3OUhaqqW-w_TLwLrY9O';

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
    detectSessionInUrl: false
  },
  global: {
    headers: {
      // Supabase needs this header to accept a Firebase JWT instead of its own
      'x-client-info': 'roseller-web'
    }
  },
  accessToken: async () => {
    const auth = window.RosellerAuth;
    if (!auth || !auth.currentUser) return null;
    try {
      return await auth.currentUser.getIdToken(false);
    } catch {
      return null;
    }
  }
});

// Expose globally so console debugging and other scripts can access it
window.RosellerSupabase = supabase;