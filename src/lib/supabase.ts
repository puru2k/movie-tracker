import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** True when Supabase env vars are present, i.e. the cloud web backend is configured. */
export const supabaseEnabled = Boolean(url && anonKey);

/**
 * Supabase client, or null when not configured. When unset, the app runs in
 * guest mode with the library stored in the browser's localStorage.
 */
export const supabase: SupabaseClient | null = supabaseEnabled
  ? createClient(url!, anonKey!, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    })
  : null;

/** The signed-in user's id from the locally persisted session, or null. */
export async function currentUserId(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.user.id ?? null;
}
