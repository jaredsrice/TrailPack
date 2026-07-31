import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/features/trailpack/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const next = safeNextPath(url.searchParams.get("next"));
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return NextResponse.redirect(new URL(`${next}?auth=unavailable`, url.origin));
  }

  const code = url.searchParams.get("code");
  if (!code) {
    return NextResponse.redirect(new URL(`${next}?auth=error`, url.origin));
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);
  const status = error ? "error" : "signed-in";
  return NextResponse.redirect(new URL(`${next}?auth=${status}`, url.origin));
}

function safeNextPath(value: string | null): string {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}
