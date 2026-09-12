import { expect, it, vi } from "vitest";
import { createLookupHandler } from "./nps-lookup-route";
const request = (body: unknown = { q: "Fairyland Loop", parkCode: "brca" }) =>
  new Request("http://localhost/api/trailpack/nps-lookup", {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
it.each(["limited", "unavailable"] as const)("fails closed when shared quota is %s", async (status) => {
  const search = vi.fn();
  const handle = createLookupHandler({ claimQuota: vi.fn().mockResolvedValue(status), search });
  const response = await handle(request());
  expect(response.status).toBe(status === "limited" ? 429 : 503);
  expect(search).not.toHaveBeenCalled();
});
it("rejects malformed and oversized requests before quota/provider", async () => {
  const claimQuota = vi.fn();
  const handle = createLookupHandler({ claimQuota, search: vi.fn() });
  expect((await handle(request({ q: "x".repeat(2100), parkCode: "brca" }))).status).toBe(413);
  expect((await handle(request({ q: "ab", parkCode: "brca" }))).status).toBe(400);
  expect(claimQuota).not.toHaveBeenCalled();
});
it("coalesces simultaneous identical queries and caches safe outcomes briefly", async () => {
  const claimQuota = vi.fn().mockResolvedValue("allowed");
  const search = vi.fn().mockResolvedValue({ status: "empty" });
  const handle = createLookupHandler({ claimQuota, search });
  const replies = await Promise.all(Array.from({ length: 10 }, () => handle(request())));
  expect(replies.every((r) => r.status === 200)).toBe(true);
  await handle(request());
  expect(claimQuota).toHaveBeenCalledTimes(1);
  expect(search).toHaveBeenCalledTimes(1);
});
it("does not leak or cache quota/provider failures", async () => {
  const search = vi.fn().mockRejectedValue(new Error("PRIVATE"));
  const handle = createLookupHandler({ claimQuota: vi.fn().mockResolvedValue("allowed"), search });
  const response = await handle(request());
  expect(await response.text()).not.toContain("PRIVATE");
  await handle(request());
  expect(search).toHaveBeenCalledTimes(2);
});
