import { expect, it, vi } from "vitest";
import { claimNpsLookupQuota } from "./nps-lookup-quota";
const config = { url: "https://example.supabase.co", publishableKey: "PUBLIC-CONFIG" };
it.each([[true, "allowed"], [false, "limited"], [{ allowed: true }, "unavailable"]])("accepts only a boolean quota decision %j", async (value, expected) => {
  const fetchImpl = vi.fn().mockResolvedValue(new Response(JSON.stringify(value)));
  expect(await claimNpsLookupQuota({ config, fetchImpl })).toBe(expected);
  expect(fetchImpl.mock.calls[0][1].body).toBe("{}");
});
it("fails closed on missing config, timeout, or RPC failure", async () => {
  const fetchImpl = vi.fn().mockRejectedValue(new Error("PRIVATE"));
  expect(await claimNpsLookupQuota({ config: null, fetchImpl })).toBe("unavailable");
  expect(fetchImpl).not.toHaveBeenCalled();
  expect(await claimNpsLookupQuota({ config, fetchImpl })).toBe("unavailable");
  fetchImpl.mockResolvedValue(new Response("true", { status: 403 }));
  expect(await claimNpsLookupQuota({ config, fetchImpl })).toBe("unavailable");
});
