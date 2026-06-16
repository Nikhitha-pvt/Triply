import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key';

// Placeholder values are used only during `next build` static page generation.
// At runtime, the real env vars are injected by Next.js. All Supabase auth
// calls happen inside useEffect (client-side only), so the placeholder client
// is never used for real requests.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
