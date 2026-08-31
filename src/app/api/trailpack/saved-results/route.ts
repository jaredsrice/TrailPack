import { getSupabaseServerClient } from "@/features/trailpack/lib/supabase/server";
import type { Json } from "@/features/trailpack/lib/supabase/types";
import type { SavedResultRecord } from "@/features/trailpack/lib/saved-results";
import { parseSavedResultDraft, parseSavedResultRecord } from "@/features/trailpack/lib/saved-results-runtime";
import { readTextWithinLimit } from "@/features/trailpack/lib/read-text-with-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_REQUEST_BYTES = 64_000;
const MAX_SAVED_RESULTS_PER_USER = 100;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

export async function GET() {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return jsonResponse({ error: "Saved results are unavailable." }, { status: 503 });
  }

  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return jsonResponse({ error: "Authentication is required." }, { status: 401 });
  }

  const { data, error } = await supabase
    .from("saved_results")
    .select("id, created_at, trail_summary, trip_inputs, recommendation, source_labels")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(MAX_SAVED_RESULTS_PER_USER);

  if (error || !data) {
    return jsonResponse({ error: "Saved results could not be loaded." }, { status: 500 });
  }

  const results = data.map(rowToRecord);
  if (results.some((result: SavedResultRecord | null) => !result)) {
    return jsonResponse({ error: "Saved results could not be loaded." }, { status: 500 });
  }

  return jsonResponse({ results: results as SavedResultRecord[] });
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();
  if (!supabase) {
    return jsonResponse({ error: "Saved results are unavailable." }, { status: 503 });
  }

  const user = await getAuthenticatedUser(supabase);
  if (!user) {
    return jsonResponse({ error: "Authentication is required." }, { status: 401 });
  }

  const bodyRead = await readTextWithinLimit(request, MAX_REQUEST_BYTES);
  if (bodyRead.status === "too-large") {
    return jsonResponse({ error: "Saved result request is too large." }, { status: 413 });
  }
  if (bodyRead.status === "unreadable") {
    return jsonResponse({ error: "Unable to read saved result request." }, { status: 400 });
  }
  const requestText = bodyRead.text;

  let value: unknown;
  try {
    value = JSON.parse(requestText);
  } catch {
    return jsonResponse({ error: "Saved result request must be valid JSON." }, { status: 400 });
  }

  const draft = parseSavedResultDraft(value);
  if (!draft) {
    return jsonResponse({ error: "Saved result request does not match the supported contract." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("saved_results")
    .insert({
      user_id: user.id,
      trail_summary: draft.trailSummary as unknown as Json,
      trip_inputs: draft.tripInputs as unknown as Json,
      recommendation: draft.recommendation as unknown as Json,
      source_labels: draft.sourceLabels,
    })
    .select("id, created_at, trail_summary, trip_inputs, recommendation, source_labels")
    .single();

  const result = data ? rowToRecord(data) : null;
  if (error?.code === "23514") {
    return jsonResponse(
      { error: "Saved result limit reached. Delete one before saving another." },
      { status: 409 },
    );
  }
  if (error || !result) {
    return jsonResponse({ error: "Saved result could not be created." }, { status: 500 });
  }

  return jsonResponse({ result }, { status: 201 });
}

async function getAuthenticatedUser(
  supabase: Awaited<ReturnType<typeof getSupabaseServerClient>> & {},
) {
  try {
    const { data, error } = await supabase.auth.getUser();
    return error ? null : data.user;
  } catch {
    return null;
  }
}

function rowToRecord(row: {
  id: string;
  created_at: string;
  trail_summary: Json;
  trip_inputs: Json;
  recommendation: Json;
  source_labels: string[];
}): SavedResultRecord | null {
  return parseSavedResultRecord({
    id: row.id,
    createdAt: row.created_at,
    trailSummary: row.trail_summary,
    tripInputs: row.trip_inputs,
    recommendation: row.recommendation,
    sourceLabels: row.source_labels,
  });
}

function jsonResponse(body: unknown, init: ResponseInit = {}): Response {
  const headers = new Headers(init.headers);
  headers.set("Cache-Control", NO_STORE_HEADERS["Cache-Control"]);
  return Response.json(body, { ...init, headers });
}
