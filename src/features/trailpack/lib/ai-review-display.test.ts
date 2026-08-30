import { describe, expect, it } from "vitest";
import type { LiveAiOutcome } from "@/features/trailpack/lib/ai-contract";
import { getAiReviewPresentation } from "@/features/trailpack/lib/ai-review-display";

describe("AI review display states", () => {
  it("distinguishes a saved accepted fixture from a live accepted result", () => {
    const saved = getAiReviewPresentation({
      reviewStatus: "accepted",
      isLoading: false,
    });
    const live = getAiReviewPresentation({
      reviewStatus: "accepted",
      liveOutcome: "accepted",
      isLoading: false,
    });

    expect(saved.badge).toBe("Saved review accepted");
    expect(live.badge).toBe("Live review accepted");
    expect(live.description).toMatch(/rule-based list remains unchanged/i);
  });

  it.each<{
    outcome: Exclude<LiveAiOutcome, "accepted">;
    badge: string;
  }>([
    { outcome: "rejected", badge: "Live review rejected" },
    { outcome: "timed-out", badge: "Live review timed out" },
    { outcome: "quota-limited", badge: "Live quota unavailable" },
    { outcome: "rate-limited", badge: "Hourly review limit reached" },
    { outcome: "duplicate-generation", badge: "List already reviewed" },
    { outcome: "sign-in-required", badge: "Sign in for live AI" },
    { outcome: "missing-key", badge: "Live AI not configured" },
    { outcome: "invalid-response", badge: "Invalid live response" },
    { outcome: "provider-error", badge: "Live provider unavailable" },
  ])("labels $outcome as a fallback state", ({ outcome, badge }) => {
    const presentation = getAiReviewPresentation({
      reviewStatus: "fallback",
      liveOutcome: outcome,
      isLoading: false,
    });

    expect(presentation.badge).toBe(badge);
    expect(presentation.tone).toBe("fallback");
    expect(presentation.description).toMatch(/fallback|rule-based list/i);
  });

  it("gives loading and request failure their own understandable states", () => {
    expect(
      getAiReviewPresentation({
        reviewStatus: "accepted",
        isLoading: true,
      }).badge,
    ).toBe("Checking live AI");

    expect(
      getAiReviewPresentation({
        reviewStatus: "accepted",
        isLoading: false,
        requestError: "A safe generic message.",
      }),
    ).toMatchObject({
      badge: "Live request failed",
      description: "A safe generic message.",
      tone: "error",
    });
  });
});
