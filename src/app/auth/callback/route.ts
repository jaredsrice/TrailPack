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

  const code = url.searchParams.get("code");
  if (!code) {
    return redirectWithAuthStatus(next, "error");
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  const status = error ? "error" : "signed-in";
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
  return NextResponse.redirect(redirectUrl);
}
