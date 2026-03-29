import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Export functions for compatibility with UserContext
export const getSupabaseClient = () => supabase;

export const injectSupabaseSession = async (session: any) => {
  // Implementation for session injection if needed
  return session;
};
