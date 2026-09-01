import type {
  GuardedAiReviewResult,
  LiveAiOutcome,
} from "@/features/trailpack/lib/ai-contract";

export type AiReviewDisplayTone =
  | "accepted"
  | "ready"
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
      badge: "Checking plan",
      description:
        "TrailPack is checking the optional explanation. Your packing list is already available.",
      tone: "loading",
    };
  }

  if (requestError) {
    return {
      badge: "Standard review ready",
      description:
        "The optional live review was unavailable. Your packing list and standard review are ready to use.",
      tone: "ready",
    };
  }

  switch (liveOutcome) {
    case "accepted":
      return {
        badge: "Live review complete",
        description:
          "The optional AI wording passed TrailPack's safety and source checks.",
        tone: "accepted",
      };
    case "rejected":
      return {
        badge: "Live review rejected",
        description:
          "The AI wording did not pass TrailPack's checks, so the standard review is shown instead.",
        tone: "fallback",
      };
    case "timed-out":
      return {
        badge: "Standard review ready",
        description:
          "The optional live review did not finish in time. Your packing list and standard review are ready.",
        tone: "ready",
      };
    case "quota-limited":
      return {
        badge: "Standard review ready",
        description:
          "The optional live provider could not accept this request. Your standard review is ready.",
        tone: "ready",
      };
    case "rate-limited":
      return {
        badge: "Standard review ready",
        description:
          "Five optional live reviews have been used this hour. Your packing list and standard review still work.",
        tone: "ready",
      };
    case "duplicate-generation":
      return {
        badge: "List already reviewed",
        description:
          "TrailPack recognized this generated list and did not spend another optional live review.",
        tone: "ready",
      };
    case "sign-in-required":
      return {
        badge: "Guest review ready",
        description:
          "This one-time plan is complete without an account. Sign in only if you want an optional live AI wording check or a private saved copy.",
        tone: "ready",
      };
    case "missing-key":
      return {
        badge: "Standard review ready",
        description:
          "The optional live provider is not configured here. Your standard review is ready.",
        tone: "ready",
      };
    case "invalid-response":
      return {
        badge: "Invalid live response",
        description:
          "The AI wording did not match TrailPack's required format, so the standard review is shown instead.",
        tone: "fallback",
      };
    case "provider-error":
      return {
        badge: "Standard review ready",
        description:
          "The optional live provider was unavailable. Your packing list and standard review are ready.",
        tone: "ready",
      };
    default:
      return reviewStatus === "accepted"
        ? {
            badge: "Review ready",
            description:
              "TrailPack checked the explanation against the current packing items and source labels.",
            tone: "accepted",
          }
        : {
            badge: "Standard review ready",
            description:
              "TrailPack completed a deterministic review of the current packing plan.",
            tone: "ready",
          };
  }
}
