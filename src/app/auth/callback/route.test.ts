import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSupabaseServerClient: vi.fn() }));

vi.mock("@/features/trailpack/lib/supabase/server", () => mocks);

import { GET } from "./route";

afterEach(() => {
  vi.resetAllMocks();
});

describe("auth callback redirects", () => {
  it("marks callback redirects as non-cacheable", async () => {
    mocks.getSupabaseServerClient.mockResolvedValue(null);

    const response = await GET(
      new Request("https://trailpack.example/auth/callback"),
    );

    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("rejects a backslash-based cross-origin redirect", async () => {
    mocks.getSupabaseServerClient.mockResolvedValue(null);
    const next = encodeURIComponent("/\\evil.example");

    const response = await GET(
      new Request(`https://trailpack.example/auth/callback?next=${next}`),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://trailpack.example/?auth=unavailable",
    );
  });

  it("rejects a protocol-relative cross-origin redirect", async () => {
    mocks.getSupabaseServerClient.mockResolvedValue(null);
    const next = encodeURIComponent("//evil.example/path");

    const response = await GET(
      new Request(`https://trailpack.example/auth/callback?next=${next}`),
    );

    expect(response.headers.get("location")).toBe(
      "https://trailpack.example/?auth=unavailable",
    );
  });

  it.each([
    "///evil.example/path",
    "https://evil.example/path",
    "http://evil.example/path",
    "javascript:alert(1)",
    " /saved",
    "/\\\\evil.example/path",
  ])("rejects the unsafe next destination %s", async (unsafeNext) => {
    mocks.getSupabaseServerClient.mockResolvedValue(null);
    const next = encodeURIComponent(unsafeNext);

    const response = await GET(
      new Request(`https://trailpack.example/auth/callback?next=${next}`),
    );

    expect(response.headers.get("location")).toBe(
      "https://trailpack.example/?auth=unavailable",
    );
  });

  it.each([
    "/%2f%2fevil.example",
    "/%5c%5cevil.example",
    "/%252f%252fevil.example",
    "/%25255c%25255cevil.example",
    "/%00control",
    "/%E2%80%A8separator",
  ])("keeps encoded path data on the callback origin: %s", async (safePath) => {
    mocks.getSupabaseServerClient.mockResolvedValue(null);
    const next = encodeURIComponent(safePath);

    const response = await GET(
      new Request(`https://trailpack.example/auth/callback?next=${next}`),
    );
    const destination = new URL(response.headers.get("location") ?? "");

    expect(destination.origin).toBe("https://trailpack.example");
    expect(destination.searchParams.get("auth")).toBe("unavailable");
  });

  it("preserves a same-origin path and existing query parameters", async () => {
    mocks.getSupabaseServerClient.mockResolvedValue(null);
    const next = encodeURIComponent("/saved?view=compact");

    const response = await GET(
      new Request(`https://trailpack.example/auth/callback?next=${next}`),
    );

    expect(response.headers.get("location")).toBe(
      "https://trailpack.example/saved?view=compact&auth=unavailable",
    );
  });

  it("preserves a same-origin fragment while replacing an existing auth status", async () => {
    mocks.getSupabaseServerClient.mockResolvedValue(null);
    const next = encodeURIComponent("/saved?auth=stale&view=compact#plan-1");

    const response = await GET(
      new Request(`https://trailpack.example/auth/callback?next=${next}`),
    );

    expect(response.headers.get("location")).toBe(
      "https://trailpack.example/saved?auth=unavailable&view=compact#plan-1",
    );
  });

  it("delegates a missing OAuth code to Supabase validation", async () => {
    const exchangeCodeForSession = vi.fn(async () => ({
      error: new Error("invalid code"),
    }));
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });

    const response = await GET(
      new Request("https://trailpack.example/auth/callback?next=%2Fsaved"),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("");
    expect(response.headers.get("location")).toBe(
      "https://trailpack.example/saved?auth=error",
    );
  });

  it("turns an unexpected exchange rejection into a controlled error redirect", async () => {
    const exchangeCodeForSession = vi.fn(async () => {
      throw new Error("provider unavailable");
    });
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });

    const response = await GET(
      new Request("https://trailpack.example/auth/callback?code=opaque&next=%2Fsaved"),
    );

    expect(response.status).toBe(307);
    expect(response.headers.get("location")).toBe(
      "https://trailpack.example/saved?auth=error",
    );
    expect(response.headers.get("cache-control")).toBe("no-store");
  });

  it("reports a provider-validated code as signed in", async () => {
    const exchangeCodeForSession = vi.fn(async () => ({ error: null }));
    mocks.getSupabaseServerClient.mockResolvedValue({
      auth: { exchangeCodeForSession },
    });

    const response = await GET(
      new Request("https://trailpack.example/auth/callback?code=opaque&next=%2Fsaved"),
    );

    expect(exchangeCodeForSession).toHaveBeenCalledWith("opaque");
    expect(response.headers.get("location")).toBe(
      "https://trailpack.example/saved?auth=signed-in",
    );
  });
});
