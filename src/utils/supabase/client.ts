import { createClient } from '@supabase/supabase-js';
import { projectId, publicAnonKey } from './info';

// Singleton Supabase client - only one instance for the entire app
let supabaseInstance: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseInstance) {
    const supabaseUrl = `https://${projectId}.supabase.co`;
    
    console.log('🔧 Creating Supabase client');
    console.log('🔧 Project ID:', projectId);
    console.log('🔧 Full URL:', supabaseUrl);
    console.log('🔧 Has Anon Key:', !!publicAnonKey);
    console.log('🔧 Anon Key length:', publicAnonKey?.length || 0);
    
    // Create client with minimal configuration to avoid hanging issues
    supabaseInstance = createClient(
      supabaseUrl,
      publicAnonKey,
      {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: false, // Avoid hanging on auth redirects
          storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        },
      }
    );
    
    console.log('✅ Supabase client created successfully');
  }
  return supabaseInstance;
}

// Force inject a session into the Supabase client manually
export async function injectSupabaseSession(accessToken: string, refreshToken: string) {
  try {
    console.log('💉 Injecting session into Supabase client...');
    
    // Store tokens in localStorage manually (Supabase client format)
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      token_type: 'bearer',
      user: null, // Will be populated by Supabase
    };
    
    const storageKey = `sb-${projectId}-auth-token`;
    localStorage.setItem(storageKey, JSON.stringify(session));
    
    console.log('✅ Session injected into localStorage');
    
    return true;
  } catch (error: any) {
    console.error('❌ Failed to inject session:', error.message);
    return false;
  }
}