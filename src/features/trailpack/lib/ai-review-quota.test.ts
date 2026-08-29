import { describe, expect, it } from "vitest";
import {
  getRetryAfterSeconds,
  parseAiReviewQuotaRow,
} from "@/features/trailpack/lib/ai-review-quota";

describe("AI review quota contract", () => {
  it("accepts one bounded database decision", () => {
    expect(
      parseAiReviewQuotaRow([
        {
          allowed: true,
          remaining: 4,
          reset_at: "2026-08-29T18:00:00.000Z",
        },
      ]),
    ).toEqual({
      allowed: true,
      remaining: 4,
      reset_at: "2026-08-29T18:00:00.000Z",
    });
  });

  it.each([
    null,
    [],
    [{ allowed: true, remaining: 6, reset_at: "2026-08-29T18:00:00.000Z" }],
    [{ allowed: "yes", remaining: 4, reset_at: "2026-08-29T18:00:00.000Z" }],
    [{ allowed: false, remaining: 0, reset_at: "not-a-date" }],
  ])("rejects malformed quota data %#", (value) => {
    expect(parseAiReviewQuotaRow(value)).toBeNull();
  });

  it("turns the reset time into a bounded Retry-After value", () => {
    const now = Date.parse("2026-08-29T17:30:00.000Z");
    expect(getRetryAfterSeconds("2026-08-29T18:00:00.000Z", now)).toBe(1_800);
    expect(getRetryAfterSeconds("2026-08-29T17:00:00.000Z", now)).toBe(1);
    expect(getRetryAfterSeconds("2026-08-30T19:00:00.000Z", now)).toBe(3_600);
  });
});
