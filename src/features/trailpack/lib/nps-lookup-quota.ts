import { readTextWithinLimit, discardBody } from "./read-text-with-limit";
import { getSupabasePublicConfig, type SupabasePublicConfig } from "./supabase/config";

export type LookupQuota = "allowed" | "limited" | "unavailable";
/** One database-owned bucket shared by every app worker; no browser-supplied identity or clock. */
export async function claimNpsLookupQuota(options: {
  config?: SupabasePublicConfig | null;
  fetchImpl?: typeof fetch;
} = {}): Promise<LookupQuota> {
  const config = options.config === undefined ? getSupabasePublicConfig() : options.config;
  if (!config) return "unavailable";
  try {
    const response = await (options.fetchImpl ?? fetch)(
      new URL("/rest/v1/rpc/claim_nps_lookup_quota", config.url),
      {
        method: "POST", headers: { apikey: config.publishableKey, "Content-Type": "application/json" },
        body: "{}", signal: AbortSignal.timeout(2_000), redirect: "error", cache: "no-store",
      },
    );
    if (!response.ok) { await discardBody(response); return "unavailable"; }
    const body = await readTextWithinLimit(response, 128);
    if (body.status !== "ok") return "unavailable";
    const value: unknown = JSON.parse(body.text);
    return value === true ? "allowed" : value === false ? "limited" : "unavailable";
  } catch { return "unavailable"; }
}
