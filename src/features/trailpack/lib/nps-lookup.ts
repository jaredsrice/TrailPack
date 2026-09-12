import { discardBody, readTextWithinLimit } from "./read-text-with-limit";

export const NPS_LOOKUP_PARKS = {
  zion: { name: "Zion National Park", state: "UT" },
  acad: { name: "Acadia National Park", state: "ME" },
  brca: { name: "Bryce Canyon National Park", state: "UT" },
} as const;
export interface NpsLookupQuery {
  q: string;
  parkCode: keyof typeof NPS_LOOKUP_PARKS;
}
/** A live hiking-activity record, deliberately not an admitted TrailProfile. */
export interface NpsLookupTrail {
  kind: "nps-live-lookup";
  id: string;
  title: string;
  parkCode: NpsLookupQuery["parkCode"];
  park: string;
  state: string;
  sourceUrl: string;
  retrievalStatus: "live";
  retrievedAt: string;
  duration: string;
  durationHours: number;
  distanceMiles: null;
  elevationGainFeet: null;
  routeType: null;
}
export type NpsLookupOutcome =
  | { status: "ok"; results: NpsLookupTrail[] }
  | { status: "empty" | "invalid-query" | "rate-limited" | "timeout" | "provider-error" | "invalid-response" | "unavailable" };

function record(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
function plainText(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 &&
    value.length <= max && !/[<>\x00-\x1f\x7f]/.test(value);
}
export function parseLookupQuery(value: unknown): NpsLookupQuery | null {
  if (!record(value) || Object.keys(value).length !== 2 ||
    !plainText(value.q, 104) || !plainText(value.parkCode, 4) ||
    !Object.hasOwn(NPS_LOOKUP_PARKS, value.parkCode)) return null;
  const q = value.q.trim();
  if (q.length < 3 || q.length > 100 || !/[a-z]/i.test(q)) return null;
  return { q, parkCode: value.parkCode as NpsLookupQuery["parkCode"] };
}
function durationHours(value: unknown): number | null {
  if (typeof value !== "string") return null;
  const match = /^(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s+(Hours?|Minutes?)$/i.exec(value.trim());
  if (!match) return null;
  const start = Number(match[1]);
  const end = Number(match[2] ?? match[1]);
  const divisor = /minute/i.test(match[3]) ? 60 : 1;
  const hours = end / divisor;
  // Only bounded day-hike durations; use the upper range for conservative planning.
  return start / divisor >= 0.25 && end >= start && hours <= 12 ? hours : null;
}
function sourceUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "www.nps.gov" &&
      !url.username && !url.password && !url.port && !url.search && !url.hash &&
      /^\/thingstodo\/[a-z0-9-]+\.htm$/.test(url.pathname) ? url.href : null;
  } catch { return null; }
}
const tokens = (text: string): string[] => text.toLowerCase().match(/[a-z0-9]+/g) ?? [];

export function normalizeNpsLookup(
  value: unknown, query: NpsLookupQuery, retrievedAt = new Date().toISOString(),
): NpsLookupTrail[] | null {
  if (!record(value) || !Array.isArray(value.data)) return null;
  const results: NpsLookupTrail[] = [];
  const seen = new Set<string>();
  for (const raw of value.data.slice(0, 5)) {
    if (!record(raw) || !plainText(raw.id, 36) ||
      !/^[a-f0-9-]{36}$/i.test(raw.id) || !plainText(raw.title, 160) ||
      !Array.isArray(raw.activities) ||
      !raw.activities.some((a) => record(a) && (a.name === "Hiking" || a.name === "Front-Country Hiking")) ||
      !Array.isArray(raw.relatedParks) ||
      !raw.relatedParks.some((p) => record(p) && p.parkCode === query.parkCode &&
        p.fullName === NPS_LOOKUP_PARKS[query.parkCode].name &&
        p.states === NPS_LOOKUP_PARKS[query.parkCode].state)) continue;
    // Query terms must all occur in the title, not merely in park prose or tags.
    const titleWords = tokens(raw.title);
    if (!tokens(query.q).every((word) => titleWords.includes(word))) continue;
    const hours = durationHours(raw.duration);
    const url = sourceUrl(raw.url);
    if (hours === null || !url || seen.has(raw.id)) continue;
    seen.add(raw.id);
    results.push({
      kind: "nps-live-lookup", id: raw.id, title: raw.title,
      parkCode: query.parkCode, park: NPS_LOOKUP_PARKS[query.parkCode].name,
      state: NPS_LOOKUP_PARKS[query.parkCode].state, sourceUrl: url,
      duration: raw.duration as string, durationHours: hours,
      retrievalStatus: "live", retrievedAt,
      distanceMiles: null, elevationGainFeet: null, routeType: null,
    });
  }
  return results;
}

/** Server callers supply the key; this module never reads or exposes environment secrets. */
export async function searchNpsTrails(
  query: NpsLookupQuery,
  options: { apiKey: string; fetchImpl?: typeof fetch },
): Promise<NpsLookupOutcome> {
  if (!parseLookupQuery(query)) return { status: "invalid-query" };
  if (!options.apiKey) return { status: "unavailable" };
  const url = new URL("https://developer.nps.gov/api/v1/thingstodo");
  url.search = new URLSearchParams({ q: query.q, parkCode: query.parkCode, limit: "5", sort: "-relevanceScore" }).toString();
  const signal = AbortSignal.timeout(5_000);
  try {
    const response = await (options.fetchImpl ?? fetch)(url, {
      headers: { "X-Api-Key": options.apiKey, Accept: "application/json" },
      redirect: "error", signal, cache: "no-store",
    });
    if (!response.ok) {
      await discardBody(response);
      return { status: response.status === 429 ? "rate-limited" : "provider-error" };
    }
    if (!response.headers.get("content-type")?.includes("application/json")) {
      await discardBody(response);
      return { status: "invalid-response" };
    }
    const body = await readTextWithinLimit(response, 128 * 1024, signal);
    if (signal.aborted) return { status: "timeout" };
    if (body.status !== "ok") return { status: "invalid-response" };
    let parsed: unknown;
    try { parsed = JSON.parse(body.text); } catch { return { status: "invalid-response" }; }
    const results = normalizeNpsLookup(parsed, query);
    return results === null ? { status: "invalid-response" } :
      results.length ? { status: "ok", results } : { status: "empty" };
  } catch (error) {
    return { status: signal.aborted || (error instanceof Error &&
      (error.name === "TimeoutError" || error.name === "AbortError")) ? "timeout" : "provider-error" };
  }
}
