"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;
let clientTried = false;

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Browser Supabase client, or null when the project is not configured. */
export function db(): SupabaseClient | null {
  if (client) return client;
  if (clientTried || !url || !anonKey) {
    clientTried = true;
    return null;
  }
  clientTried = true;
  try {
    client = createClient(url, anonKey);
    return client;
  } catch {
    return null;
  }
}
