import { beforeEach, describe, expect, it, vi } from "vitest";

const { getSupabaseServerClientMock } = vi.hoisted(() => ({
  getSupabaseServerClientMock: vi.fn(),
}));

vi.mock("@/features/trailpack/lib/supabase/server", () => ({
  getSupabaseServerClient: getSupabaseServerClientMock,
}));

import {
  claimAiReviewQuota,
  getRetryAfterSeconds,
  parseAiReviewQuotaRow,
} from "@/features/trailpack/lib/ai-review-quota";

const GENERATION_ID = "3f9a1f5e-6144-4f20-b1ad-32f8cc77d4bc";

beforeEach(() => {
  getSupabaseServerClientMock.mockReset();
});

describe("AI review quota contract", () => {
  it("accepts one bounded database decision", () => {
    expect(
      parseAiReviewQuotaRow([
        {
          allowed: true,
          duplicate: false,
          remaining: 4,
          reset_at: "2026-08-29T18:00:00.000Z",
        },
      ]),
    ).toEqual({
      allowed: true,
      duplicate: false,
      remaining: 4,
      reset_at: "2026-08-29T18:00:00.000Z",
    });
  });

  it.each([
    null,
    [],
    [{ allowed: true, duplicate: false, remaining: 6, reset_at: "2026-08-29T18:00:00.000Z" }],
    [{ allowed: "yes", duplicate: false, remaining: 4, reset_at: "2026-08-29T18:00:00.000Z" }],
    [{ allowed: true, duplicate: true, remaining: 4, reset_at: "2026-08-29T18:00:00.000Z" }],
    [{ allowed: true, duplicate: false, remaining: 5, reset_at: "2026-08-29T18:00:00.000Z" }],
    [{ allowed: false, duplicate: true, remaining: 5, reset_at: "2026-08-29T18:00:00.000Z" }],
    [{ allowed: false, duplicate: false, remaining: 1, reset_at: "2026-08-29T18:00:00.000Z" }],
    [{ allowed: false, duplicate: false, remaining: 0, reset_at: "not-a-date" }],
  ])("rejects malformed quota data %#", (value) => {
    expect(parseAiReviewQuotaRow(value)).toBeNull();
  });

  it("accepts a duplicate generation without another claim", () => {
    expect(
      parseAiReviewQuotaRow([
        {
          allowed: false,
          duplicate: true,
          remaining: 3,
          reset_at: "2026-08-29T18:00:00.000Z",
        },
      ]),
    ).toEqual({
      allowed: false,
      duplicate: true,
      remaining: 3,
      reset_at: "2026-08-29T18:00:00.000Z",
    });
  });

  it("turns the reset time into a bounded Retry-After value", () => {
    const now = Date.parse("2026-08-29T17:30:00.000Z");
    expect(getRetryAfterSeconds("2026-08-29T18:00:00.000Z", now)).toBe(1_800);
    expect(getRetryAfterSeconds("2026-08-29T17:00:00.000Z", now)).toBe(1);
    expect(getRetryAfterSeconds("2026-08-30T19:00:00.000Z", now)).toBe(3_600);
  });

  it.each(["client", "auth", "rpc"] as const)(
    "fails closed when the %s dependency throws",
    async (failurePoint) => {
      if (failurePoint === "client") {
        getSupabaseServerClientMock.mockRejectedValueOnce(
          new Error("private connection detail"),
        );
      } else {
        const getUser = vi.fn();
        const rpc = vi.fn();
        if (failurePoint === "auth") {
          getUser.mockRejectedValueOnce(new Error("private auth detail"));
        } else {
          getUser.mockResolvedValueOnce({
            data: { user: { id: "synthetic-user" } },
            error: null,
          });
          rpc.mockRejectedValueOnce(new Error("private database detail"));
        }
        getSupabaseServerClientMock.mockResolvedValueOnce({
          auth: { getUser },
          rpc,
        });
      }

      await expect(claimAiReviewQuota(GENERATION_ID)).resolves.toEqual({
        status: "unavailable",
      });
    },
  );
});
