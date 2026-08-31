import type { SavedResultDraft, SavedResultRecord } from "./saved-results";
import { parseSavedResultRecord } from "./saved-results-runtime";
import {
  discardBody,
  readTextWithinLimit,
} from "./read-text-with-limit";

const SAVED_RESULTS_ROUTE = "/api/trailpack/saved-results";
const REQUEST_ERROR_MESSAGE = "TrailPack could not update saved results. Please try again.";
const MAX_RESPONSE_BYTES = 6_600_000;

export async function saveResultFromRoute(
  draft: SavedResultDraft,
  fetchImpl: typeof fetch = fetch,
): Promise<SavedResultRecord> {
  const response = await request(fetchImpl, SAVED_RESULTS_ROUTE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(draft),
  });
  const body = await parseJson(response);
  const result = isRecord(body) ? parseSavedResultRecord(body.result) : null;
  if (!response.ok || !result) {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }
  return result;
}

export async function listSavedResultsFromRoute(
  fetchImpl: typeof fetch = fetch,
): Promise<SavedResultRecord[]> {
  const response = await request(fetchImpl, SAVED_RESULTS_ROUTE);
  const body = await parseJson(response);
  const results = isRecord(body) && Array.isArray(body.results)
    ? body.results.map(parseSavedResultRecord)
    : null;
  if (!response.ok || !results || results.some((result) => !result)) {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }
  return results as SavedResultRecord[];
}

export async function deleteSavedResultFromRoute(
  id: string,
  fetchImpl: typeof fetch = fetch,
): Promise<void> {
  const response = await request(fetchImpl, `${SAVED_RESULTS_ROUTE}/${id}`, {
    method: "DELETE",
  });
  if (!response.ok) {
    await discardBody(response);
    throw new Error(REQUEST_ERROR_MESSAGE);
  }
  await discardBody(response);
}

async function request(
  fetchImpl: typeof fetch,
  input: RequestInfo | URL,
  init?: RequestInit,
): Promise<Response> {
  try {
    return await fetchImpl(input, { ...init, cache: "no-store" });
  } catch {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    const responseRead = await readTextWithinLimit(response, MAX_RESPONSE_BYTES);
    return responseRead.status === "ok" ? JSON.parse(responseRead.text) : null;
  } catch {
    return null;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
