import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ getSupabaseServerClient: vi.fn() }));

vi.mock("@/features/trailpack/lib/supabase/server", () => mocks);

import { GET } from "./route";

afterEach(() => {
  vi.resetAllMocks();
});

describe("auth callback redirects", () => {
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
});
