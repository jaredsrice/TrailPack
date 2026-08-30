import type {
  GuardedAiReviewResult,
  LiveAiOutcome,
} from "@/features/trailpack/lib/ai-contract";

export type AiReviewDisplayTone =
  | "accepted"
  | "fallback"
  | "loading"
  | "error";

export interface AiReviewPresentation {
  badge: string;
  description: string;
  tone: AiReviewDisplayTone;
}

export function getAiReviewPresentation({
  reviewStatus,
  liveOutcome,
  isLoading,
  requestError,
}: {
  reviewStatus: GuardedAiReviewResult["status"];
  liveOutcome?: LiveAiOutcome;
  isLoading: boolean;
  requestError?: string;
}): AiReviewPresentation {
  if (isLoading) {
    return {
      badge: "Checking live AI",
      description:
        "TrailPack is checking a Gemini explanation against the existing rule-based list and safety guardrails.",
      tone: "loading",
    };
  }

  if (requestError) {
    return {
      badge: "Live request failed",
      description: requestError,
      tone: "error",
    };
  }

  switch (liveOutcome) {
    case "accepted":
      return {
        badge: "Live review accepted",
        description:
          "The explanation passed TrailPack's schema, packing-item, source-label, trail-fact, and safety checks. The rule-based list remains unchanged.",
        tone: "accepted",
      };
    case "rejected":
      return {
        badge: "Live review rejected",
        description:
          "TrailPack discarded the provider text because it failed validation and replaced it with the deterministic template fallback. The rule-based list remains unchanged.",
        tone: "fallback",
      };
    case "timed-out":
      return {
        badge: "Live review timed out",
        description:
          "The provider did not finish within TrailPack's time limit, so the deterministic template fallback is shown and the rule-based list remains unchanged.",
        tone: "fallback",
      };
    case "quota-limited":
      return {
        badge: "Live quota unavailable",
        description:
          "The provider could not accept this request, so the deterministic template fallback is shown and the rule-based list remains unchanged.",
        tone: "fallback",
      };
    case "rate-limited":
      return {
        badge: "Hourly review limit reached",
        description:
          "This account has reviewed five distinct generated packing lists in the current hour. TrailPack kept the deterministic rule-based list and explanation and will allow another live review after the window resets.",
        tone: "fallback",
      };
    case "duplicate-generation":
      return {
        badge: "List already reviewed",
        description:
          "TrailPack recognized this packing-list generation and did not spend another live review. The deterministic rule-based list remains available.",
        tone: "fallback",
      };
    case "sign-in-required":
      return {
        badge: "Sign in for live AI",
        description:
          "TrailPack generated the rule-based list and deterministic explanation. Sign in with Google before generating the next list to add a validated live Gemini review.",
        tone: "fallback",
      };
    case "missing-key":
      return {
        badge: "Live AI not configured",
        description:
          "No Gemini key is available in this deployment. TrailPack made no provider request and kept the deterministic template fallback.",
        tone: "fallback",
      };
    case "invalid-response":
      return {
        badge: "Invalid live response",
        description:
          "The provider response did not match TrailPack's runtime contract, so it was discarded and replaced with the deterministic template fallback.",
        tone: "fallback",
      };
    case "provider-error":
      return {
        badge: "Live provider unavailable",
        description:
          "The provider request failed without exposing upstream details. TrailPack kept the deterministic template fallback and rule-based list.",
        tone: "fallback",
      };
    default:
      return reviewStatus === "accepted"
        ? {
            badge: "Saved review accepted",
            description:
              "This saved explanation fixture passed the same TrailPack guardrails used for live responses. Generating a list while signed in requests one live review when the provider and account allowance are available.",
            tone: "accepted",
          }
        : {
            badge: "Template fallback",
            description:
              "No validated AI explanation is displayed. TrailPack is showing deterministic text derived from the unchanged rule-based list.",
            tone: "fallback",
          };
  }
}
