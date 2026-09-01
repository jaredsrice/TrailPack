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

    expect(saved.badge).toBe("Review ready");
    expect(live.badge).toBe("Live review complete");
    expect(live.description).toMatch(/safety and source checks/i);
  });

  it.each<{
    outcome: Exclude<LiveAiOutcome, "accepted">;
    badge: string;
    tone: "fallback" | "ready";
  }>([
    { outcome: "rejected", badge: "Live review rejected", tone: "fallback" },
    { outcome: "timed-out", badge: "Standard review ready", tone: "ready" },
    { outcome: "quota-limited", badge: "Standard review ready", tone: "ready" },
    { outcome: "rate-limited", badge: "Standard review ready", tone: "ready" },
    { outcome: "duplicate-generation", badge: "List already reviewed", tone: "ready" },
    { outcome: "sign-in-required", badge: "Guest review ready", tone: "ready" },
    { outcome: "missing-key", badge: "Standard review ready", tone: "ready" },
    { outcome: "invalid-response", badge: "Invalid live response", tone: "fallback" },
    { outcome: "provider-error", badge: "Standard review ready", tone: "ready" },
  ])("labels $outcome with a usable review state", ({ outcome, badge, tone }) => {
    const presentation = getAiReviewPresentation({
      reviewStatus: "fallback",
      liveOutcome: outcome,
      isLoading: false,
    });

    expect(presentation.badge).toBe(badge);
    expect(presentation.tone).toBe(tone);
    expect(presentation.description).toMatch(/review|packing list|AI wording/i);
  });

  it("gives loading and request failure their own understandable states", () => {
    expect(
      getAiReviewPresentation({
        reviewStatus: "accepted",
        isLoading: true,
      }).badge,
    ).toBe("Checking plan");

    expect(
      getAiReviewPresentation({
        reviewStatus: "accepted",
        isLoading: false,
        requestError: "A safe generic message.",
      }),
    ).toMatchObject({
      badge: "Standard review ready",
      tone: "ready",
    });
  });
});
