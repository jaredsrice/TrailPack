import { getSupabaseServerClient } from "@/features/trailpack/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!UUID_PATTERN.test(id)) {
    return jsonResponse({ error: "Saved result was not found." }, { status: 404 });
  }

  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return jsonResponse({ error: "Saved results are unavailable." }, { status: 503 });
  }

  const { data: authData, error: authError } = await supabase.auth.getUser();
  if (authError || !authData.user) {
    return jsonResponse({ error: "Authentication is required." }, { status: 401 });
  }

  // Ownership is enforced twice: this filter scopes the query and the table's
  // RLS policy rejects rows belonging to any other authenticated user.
  const { data, error } = await supabase
    .from("saved_results")
    .delete()
    .eq("id", id)
    .eq("user_id", authData.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    return jsonResponse({ error: "Saved result could not be deleted." }, { status: 500 });
  }
  if (!data) {
    return jsonResponse({ error: "Saved result was not found." }, { status: 404 });
  }

  return new Response(null, { status: 204, headers: NO_STORE_HEADERS });
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", NO_STORE_HEADERS["Cache-Control"]);
  return Response.json(body, { ...init, headers });
}
