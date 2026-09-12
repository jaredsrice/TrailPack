import { describe, expect, it, vi } from "vitest";
import { normalizeNpsLookup, searchNpsTrails, parseLookupQuery } from "./nps-lookup";

export const npsHike = {
  id: "6E21CE5C-45E4-4B66-9445-8764E89BCEC5",
  title: "Fairyland Loop",
  url: "https://www.nps.gov/thingstodo/fairyland-loop.htm",
  relatedParks: [{ parkCode: "brca", fullName: "Bryce Canyon National Park", states: "UT" }],
  activities: [{ name: "Hiking" }],
  duration: "4-5 Hours",
};
const query = { q: "Fairyland Loop", parkCode: "brca" as const };
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status, headers: { "Content-Type": "application/json" },
});

describe("NPS lookup identity and partial facts", () => {
  it("keeps source, time, duration, and explicit nulls without importing prose", () => {
    const results = normalizeNpsLookup({ data: [{ ...npsHike, description: "UNTRUSTED" }] }, query, "2026-09-11T00:00:00Z");
    expect(results).toHaveLength(1);
    expect(results![0]).toMatchObject({
      kind: "nps-live-lookup", title: "Fairyland Loop", durationHours: 5,
      distanceMiles: null, elevationGainFeet: null, routeType: null,
      retrievalStatus: "live", retrievedAt: "2026-09-11T00:00:00Z",
    });
    expect(JSON.stringify(results)).not.toContain("UNTRUSTED");
  });
  it.each([
    { title: "Scenic driving" }, { title: "Hiking in Bryce Canyon" },
    { activities: [{ name: "Fishing" }] }, { relatedParks: [{ parkCode: "zion" }] },
    { duration: "Several days" }, { duration: "1-2 Days" }, { duration: "24 Hours" },
    { duration: "5-2 Hours" }, { duration: "0 Hours" },
    { duration: "0.1-15 Minutes" }, { duration: "0.1-12 Hours" },
    { url: "https://evil.test/fairyland-loop.htm" },
    { url: "https://www.nps.gov@evil.test/thingstodo/fairyland-loop.htm" },
    { url: "https://www.nps.gov/thingstodo/fairyland-loop.htm?redirect=evil" },
    { title: "<script>Fairyland Loop</script>" }, { id: "" },
  ])("does not admit an ambiguous, unsupported, or hostile result: %j", (change) => {
    expect(normalizeNpsLookup({ data: [{ ...npsHike, ...change }] }, query)).toEqual([]);
  });
  it("bounds and deduplicates results and handles malformed envelopes", () => {
    expect(normalizeNpsLookup({ data: [npsHike, npsHike] }, query)).toHaveLength(1);
    expect(normalizeNpsLookup({ data: "wrong" }, query)).toBeNull();
  });
  it.each([
    ["15-720 Minutes", 12], ["0.25-12 Hours", 12], ["15 Minutes", 0.25],
  ])("accepts the inclusive duration bounds: %s", (duration, hours) => {
    expect(normalizeNpsLookup({ data: [{ ...npsHike, duration }] }, query)?.[0]?.durationHours).toBe(hours);
  });
  it("accepts the actual Bryce Canyon front-country hiking category", () => {
    expect(normalizeNpsLookup({ data: [{ ...npsHike, activities: [
      { id: "45261C0A-00D8-4C27-A1F8-029F933A0D34", name: "Front-Country Hiking" },
    ] }] }, query)).toHaveLength(1);
  });
  it.each(["", "ab", "x".repeat(101), "Fairyland\nLoop"])("rejects invalid query %j", (q) => {
    expect(parseLookupQuery({ ...query, q })).toBeNull();
  });
  it("requires a supported park and exact request keys", () => {
    expect(parseLookupQuery({ ...query, parkCode: "grte" })).toBeNull();
    expect(parseLookupQuery({ ...query, url: "https://evil.test" })).toBeNull();
    expect(parseLookupQuery({ ...query, q: "  Fairyland  " })?.q).toBe("Fairyland");
  });
});

describe("bounded NPS provider", () => {
  it("uses fixed endpoint, header key, explicit filters and no redirects", async () => {
    const fetchImpl = vi.fn().mockResolvedValue(json({ data: [npsHike] }));
    expect((await searchNpsTrails(query, { apiKey: "SERVER-SECRET", fetchImpl })).status).toBe("ok");
    const [url, init] = fetchImpl.mock.calls[0];
    expect(String(url)).toContain("https://developer.nps.gov/api/v1/thingstodo?");
    expect(String(url)).toContain("limit=5");
    expect(String(url)).not.toContain("SERVER-SECRET");
    expect(init).toMatchObject({ redirect: "error", headers: { "X-Api-Key": "SERVER-SECRET" } });
  });
  it.each([[400, "provider-error"], [429, "rate-limited"], [500, "provider-error"]])("maps HTTP %i safely", async (status, expected) => {
    const result = await searchNpsTrails(query, { apiKey: "key", fetchImpl: vi.fn().mockResolvedValue(json({ error: "SECRET" }, status as number)) });
    expect(result.status).toBe(expected);
    expect(JSON.stringify(result)).not.toContain("SECRET");
  });
  it("handles missing configuration without fetch", async () => {
    const fetchImpl = vi.fn();
    expect((await searchNpsTrails(query, { apiKey: "", fetchImpl })).status).toBe("unavailable");
    expect(fetchImpl).not.toHaveBeenCalled();
  });
  it("distinguishes empty, malformed, wrong content type and oversized bodies", async () => {
    for (const [response, status] of [
      [json({ data: [] }), "empty"],
      [json({ data: "bad" }), "invalid-response"],
      [new Response("invalid", { headers: { "Content-Type": "application/json" } }), "invalid-response"],
      [new Response("<html>secret</html>"), "invalid-response"],
      [json({ data: [], padding: "x".repeat(131_073) }), "invalid-response"],
    ] as const) {
      expect((await searchNpsTrails(query, { apiKey: "key", fetchImpl: vi.fn().mockResolvedValue(response) })).status).toBe(status);
    }
  });
  it("returns timeout and network failure without exposing errors", async () => {
    for (const error of [new DOMException("SECRET", "TimeoutError"), new Error("SECRET")]) {
      const result = await searchNpsTrails(query, { apiKey: "key", fetchImpl: vi.fn().mockRejectedValue(error) });
      expect(result.status).toBe(error.name === "TimeoutError" ? "timeout" : "provider-error");
      expect(JSON.stringify(result)).not.toContain("SECRET");
    }
  });
});
