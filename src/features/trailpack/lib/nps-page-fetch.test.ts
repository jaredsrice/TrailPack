import { describe, expect, it, vi } from "vitest";
import { JENNY_LAKE_LOOP } from "../data/supported-trails";
import { fetchNpsPage } from "./nps-page-fetch";

function page(body: BodyInit | null, status = 200, contentType = "text/html") {
  const result = new Response(body, { status, headers: { "Content-Type": contentType } });
  Object.defineProperty(result, "url", { value: JENNY_LAKE_LOOP.npsSourceUrl });
  return result;
}

describe("NPS page fetch boundary", () => {
  it("rejects an external redirect without requesting its target", async () => {
    const requests: string[] = [];
    const result = await fetchNpsPage(JENNY_LAKE_LOOP, async (url, init) => {
      requests.push(String(url));
      expect(init?.redirect).toBe("manual");
      return new Response(null, { status: 302, headers: { Location: "https://example.com/private" } });
    });
    expect(result.error).toMatch(/redirect/i);
    expect(result.html).toBeUndefined();
    expect(requests).toEqual([JENNY_LAKE_LOOP.npsSourceUrl]);
  });

  it("cancels a stalled HTML body when the shared request deadline expires", async () => {
    const deadline = new AbortController();
    const timeout = vi.spyOn(AbortSignal, "timeout").mockReturnValue(deadline.signal);
    let cancelled = false;
    try {
      const pending = fetchNpsPage(JENNY_LAKE_LOOP, async () => page(new ReadableStream({
        start(controller) { controller.enqueue(new TextEncoder().encode("<html>")); },
        cancel() { cancelled = true; },
      })));
      await Promise.resolve();
      deadline.abort();
      const result = await Promise.race([pending, new Promise<null>(resolve => setTimeout(() => resolve(null), 100))]);
      expect(result).not.toBeNull();
      expect(result?.error).toMatch(/deadline/i);
      expect(cancelled).toBe(true);
    } finally { timeout.mockRestore(); }
  });

  it.each(["open-canyon", "open-canyon-rendezvous"])("uses the reviewed official delivery host for %s while preserving the saved source identity", async id => {
    const sourceUrl = "https://www.nps.gov/thingstodo/open-canyon.htm";
    const deliveryUrl = "https://home.nps.gov/thingstodo/open-canyon.htm";
    const result = await fetchNpsPage({ ...JENNY_LAKE_LOOP, id, npsSourceUrl: sourceUrl }, async url => {
      expect(String(url)).toBe(deliveryUrl);
      const response = new Response("<h1>Open Canyon</h1>", { headers: { "Content-Type": "text/html" } });
      Object.defineProperty(response, "url", { value: deliveryUrl });
      return response;
    });
    expect(result).toMatchObject({ sourceUrl, finalUrl: deliveryUrl, html: "<h1>Open Canyon</h1>" });
  });

  it("follows a relative NPS redirect with one deadline and retains both source URLs", async () => {
    const signals: unknown[] = [];
    const requests: string[] = [];
    const result = await fetchNpsPage(JENNY_LAKE_LOOP, async (url, init) => {
      requests.push(String(url));
      signals.push(init?.signal);
      if (requests.length === 1) return new Response(null, { status: 301, headers: { Location: "/thingstodo/jenny-new.htm" } });
      const response = new Response("<h1>Jenny Lake</h1>", { headers: { "Content-Type": "text/html" } });
      Object.defineProperty(response, "url", { value: String(url) });
      return response;
    });
    expect(requests).toEqual([JENNY_LAKE_LOOP.npsSourceUrl, "https://www.nps.gov/thingstodo/jenny-new.htm"]);
    expect(signals[0]).toBe(signals[1]);
    expect(result).toMatchObject({ sourceUrl: JENNY_LAKE_LOOP.npsSourceUrl, finalUrl: requests[1], html: "<h1>Jenny Lake</h1>" });
  });

  it("stops a redirect loop and cancels each abandoned response", async () => {
    let requests = 0;
    let cancellations = 0;
    const result = await fetchNpsPage(JENNY_LAKE_LOOP, async () => {
      requests++;
      return new Response(new ReadableStream({ cancel() { cancellations++; } }), {
        status: 302, headers: { Location: JENNY_LAKE_LOOP.npsSourceUrl },
      });
    });
    expect(result.error).toMatch(/redirect limit/);
    expect(result.html).toBeUndefined();
    expect(requests).toBe(4);
    expect(cancellations).toBe(4);
  });

  it.each([
    { id: "jenny-lake-loop", npsSourceUrl: "https://www.nps.gov/thingstodo/open-canyon.htm" },
    { id: "open-canyon", npsSourceUrl: JENNY_LAKE_LOOP.npsSourceUrl },
  ])("does not expand the reviewed host override to mismatched identity/source pairs", async identity => {
    let requested: unknown;
    await fetchNpsPage({ ...JENNY_LAKE_LOOP, ...identity }, async url => {
      requested = url;
      return page("<h1>Source</h1>");
    });
    expect(requested).toBe(identity.npsSourceUrl);
  });

  it("cancels an oversized chunked page before buffering the complete response", async () => {
    let pulls = 0;
    let cancelled = false;
    const body = new ReadableStream({
      pull(controller) {
        pulls++;
        if (pulls > 100) controller.close();
        else controller.enqueue(new Uint8Array(64_000));
      },
      cancel() { cancelled = true; },
    });
    const result = await fetchNpsPage(JENNY_LAKE_LOOP, async () => page(body));
    expect(result.html).toBeUndefined();
    expect(result.error).toMatch(/limit/i);
    expect(cancelled).toBe(true);
    expect(pulls).toBeLessThan(20);
  });

  it("returns bounded HTML with source provenance", async () => {
    const result = await fetchNpsPage(JENNY_LAKE_LOOP, async () => page("<h1>Jenny Lake Loop</h1>"));
    expect(result).toMatchObject({ trailId: "jenny-lake-loop", httpStatus: 200, html: "<h1>Jenny Lake Loop</h1>" });
    expect(result.sourceUrl).toBe(JENNY_LAKE_LOOP.npsSourceUrl);
  });

  it.each([429, 500])("does not treat HTTP %s as source facts", async status => {
    const result = await fetchNpsPage(JENNY_LAKE_LOOP, async () => page("error", status));
    expect(result.html).toBeUndefined();
    expect(result.httpStatus).toBe(status);
  });

  it("does not treat JSON as HTML source facts", async () => {
    const result = await fetchNpsPage(JENNY_LAKE_LOOP, async () => page("{}", 200, "application/json"));
    expect(result.html).toBeUndefined();
    expect(result.error).toMatch(/HTML/);
  });
});
