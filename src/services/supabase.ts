import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const supabaseUrl =
  (Constants.expoConfig?.extra as any)?.supabaseUrl ||
  process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey =
  (Constants.expoConfig?.extra as any)?.supabaseAnonKey ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Supabase environment variables are not set");
}

export const supabase = createClient(
  supabaseUrl || "https://awyfxnhcgpjxxqujltwx.supabase.co",
  supabaseAnonKey || "sb_publishable_qnzPKO_xxdbfT9huZ03D9w_f9ZQCRqX",
);
