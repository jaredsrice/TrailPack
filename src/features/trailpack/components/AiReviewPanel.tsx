import type {
  GuardedAiReviewResult,
  LiveAiOutcome,
} from "@/features/trailpack/lib/ai-contract";
import {
  getAiReviewPresentation,
  type AiReviewDisplayTone,
} from "@/features/trailpack/lib/ai-review-display";
import { TrailPackIcon } from "./TrailPackIcon";

interface AiReviewPanelProps {
  review: GuardedAiReviewResult;
  liveOutcome?: LiveAiOutcome;
  providerModel?: string;
  isLoading: boolean;
  requestError?: string;
}

export function AiReviewPanel({
  review,
  liveOutcome,
  providerModel,
  isLoading,
  requestError,
}: AiReviewPanelProps) {
  const presentation = getAiReviewPresentation({
    reviewStatus: review.status,
    liveOutcome,
    isLoading,
    requestError,
  });

  return (
    <section
      id="ai-review"
      className="ai-review-section"
      aria-labelledby="ai-review-heading"
    >
      <div>
        <div>
          <p className="section-kicker">
            Concise second look
          </p>
          <h2 id="ai-review-heading" className="section-title">
            Plan review
          </h2>
          <p className="section-subtitle">
            The useful result stays up front. Open the details only if you want
            more context.
          </p>
        </div>
      </div>

      <div
        aria-live="polite"
        className={`ai-review-summary-card ${tonePanelClassName(
          presentation.tone,
        )}`}
      >
        <p className="ai-review-label">
          <TrailPackIcon name="sparkles" className="h-4 w-4" />
          {presentation.badge}
        </p>
        <p className="ai-trip-summary">{review.review.tripSummary}</p>
        <p className="ai-review-status-copy">{presentation.description}</p>
      </div>

      <details className="ai-review-details group">
        <summary>
          <span>Why and review details</span>
          <TrailPackIcon
            name="chevron"
            className="h-5 w-5 transition-transform group-open:rotate-180"
          />
        </summary>
        <div className="ai-review-details-body">
          <div>
            <h3>What could improve this plan</h3>
            <ul>
              {review.review.missingDataReview.map((detail) => (
                <li key={detail}>{detail}</li>
              ))}
            </ul>
          </div>
          <div>
            <h3>How the review works</h3>
            <p>
              TrailPack builds the packing list with fixed rules. A live Gemini
              review, when available, can only check the explanation wording; it
              cannot add, remove, reprioritize, or relabel packing items.
            </p>
            <p>
              Guest planning and the standard review do not require an account.
              Signed-in hikers can use up to five optional live reviews per hour;
              editing fields alone does not count.
            </p>
            {providerModel && liveOutcome === "accepted" ? (
              <p>Live wording reviewed with {providerModel}.</p>
            ) : null}
          </div>
        </div>
      </details>
    </section>
  );
}

function tonePanelClassName(tone: AiReviewDisplayTone): string {
  switch (tone) {
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "ready":
      return "border-sky-200 bg-sky-50 text-sky-950";
    case "loading":
      return "border-sky-200 bg-sky-50 text-sky-950";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-950";
    case "fallback":
      return "border-amber-200 bg-amber-50 text-amber-950";
  }
}
