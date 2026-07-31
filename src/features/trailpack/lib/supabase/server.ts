import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { getSupabasePublicConfig } from "./config";
import type { Database } from "./types";

export async function getSupabaseServerClient(): Promise<
  SupabaseClient<Database> | null
> {
  const config = getSupabasePublicConfig();
  if (!config) {
    return null;
  }

  const cookieStore = await cookies();
  return createServerClient<Database>(config.url, config.publishableKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // A Server Component cannot write cookies. Route handlers can, and
          // they are the only callers that need to exchange or refresh tokens.
        }
      },
    },
  });
}
