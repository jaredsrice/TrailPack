import { parseLookupQuery, searchNpsTrails, type NpsLookupOutcome, type NpsLookupQuery } from "./nps-lookup";
import { claimNpsLookupQuota, type LookupQuota } from "./nps-lookup-quota";
import { readTextWithinLimit } from "./read-text-with-limit";

export function createLookupHandler(dependencies: {
  claimQuota: () => Promise<LookupQuota>;
  search: (query: NpsLookupQuery) => Promise<NpsLookupOutcome>;
}) {
  // Cache only validated results/empty outcomes. Quota itself is never process-local.
  const cache = new Map<string, { until: number; result: NpsLookupOutcome }>();
  const pending = new Map<string, Promise<NpsLookupOutcome>>();
  function reply(result: NpsLookupOutcome, status?: number) {
    const code = status ?? (result.status === "invalid-query" ? 400 :
      result.status === "rate-limited" ? 429 : result.status === "unavailable" ? 503 : 200);
    return Response.json(result, { status: code, headers: {
      "Cache-Control": "no-store",
      ...(code === 429 ? { "Retry-After": "6" } : {}),
    } });
  }
  return async function handle(request: Request): Promise<Response> {
    if (!request.headers.get("content-type")?.startsWith("application/json")) {
      return reply({ status: "invalid-query" }, 415);
    }
    const body = await readTextWithinLimit(request, 2048, AbortSignal.timeout(2_000));
    if (body.status !== "ok") return reply({ status: "invalid-query" }, body.status === "too-large" ? 413 : 400);
    let value: unknown;
    try { value = JSON.parse(body.text); } catch { return reply({ status: "invalid-query" }); }
    const query = parseLookupQuery(value);
    if (!query) return reply({ status: "invalid-query" });
    const key = query.parkCode + ":" + query.q.toLowerCase();
    const cached = cache.get(key);
    if (cached && cached.until > Date.now()) return reply(cached.result);
    let work = pending.get(key);
    if (!work) {
      if (pending.size >= 20) return reply({ status: "rate-limited" });
      work = (async (): Promise<NpsLookupOutcome> => {
        try {
          const quota = await dependencies.claimQuota();
          if (quota !== "allowed") return { status: quota === "limited" ? "rate-limited" : "unavailable" };
          const result = await dependencies.search(query);
          if (result.status === "ok" || result.status === "empty") {
            if (cache.size >= 128) cache.delete(cache.keys().next().value!);
            cache.set(key, { until: Date.now() + 60_000, result });
          }
          return result;
        } catch { return { status: "unavailable" }; }
      })();
      pending.set(key, work);
      void work.finally(() => pending.delete(key));
    }
    return reply(await work);
  };
}

export const handleNpsLookupPost = createLookupHandler({
  claimQuota: async () => process.env.NPS_API_KEY ? claimNpsLookupQuota() : "unavailable",
  search: (query) => searchNpsTrails(query, { apiKey: process.env.NPS_API_KEY ?? "" }),
});
