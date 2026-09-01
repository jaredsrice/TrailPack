import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/features/trailpack/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextUrl(url.searchParams.get("next"), url.origin);
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return redirectWithAuthStatus(next, "unavailable");
  }

  // Supabase, not the presence of user-controlled input, is the security
  // authority for deciding whether the one-time OAuth code is valid.
  const code = url.searchParams.get("code") ?? "";
  let status = "error";
  try {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    status = error ? "error" : "signed-in";
  } catch {
    // Provider and network failures are intentionally reduced to the same
    // non-sensitive state as a rejected one-time code.
  }
  return redirectWithAuthStatus(next, status);
}

function safeNextUrl(value: string | null, origin: string): URL {
  const fallback = new URL("/", origin);
  if (!value || !value.startsWith("/")) {
    return fallback;
  }

  try {
    const destination = new URL(value, origin);
    return destination.origin === origin ? destination : fallback;
  } catch {
    return fallback;
  }
}

function redirectWithAuthStatus(destination: URL, status: string) {
  const redirectUrl = new URL(destination);
  redirectUrl.searchParams.set("auth", status);
  const response = NextResponse.redirect(redirectUrl);
  response.headers.set("Cache-Control", "no-store");
  return response;
}
