import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  throw new Error("VITE_SUPABASE_URL não foi encontrada. Verifique seu arquivo .env");
}

if (!supabaseAnonKey) {
  throw new Error("VITE_SUPABASE_ANON_KEY não foi encontrada. Verifique seu arquivo .env");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
