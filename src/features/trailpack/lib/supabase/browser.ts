"use client";

import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicConfig } from "./config";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | null | undefined;

export function getSupabaseBrowserClient(): SupabaseClient<Database> | null {
  if (browserClient !== undefined) {
    return browserClient;
  }

  const config = getSupabasePublicConfig();
  browserClient = config
    ? createBrowserClient<Database>(config.url, config.publishableKey)
    : null;

  return browserClient;
}
