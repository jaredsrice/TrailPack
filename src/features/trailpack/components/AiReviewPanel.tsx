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
  onRequestLive: () => void;
}

export function AiReviewPanel({
  review,
  liveOutcome,
  providerModel,
  isLoading,
  requestError,
  onRequestLive,
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
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">
            Automatic explanation layer
          </p>
          <h2 id="ai-review-heading" className="section-title">
            Guarded AI review
          </h2>
          <p className="section-subtitle">
            TrailPack checks the explanation automatically; the rule-based list
            above never changes.
          </p>
        </div>
        <span className={`ai-status-badge ${toneBadgeClassName(
            presentation.tone,
          )}`}>
          <TrailPackIcon name="sparkles" className="h-4 w-4" />
          {presentation.badge}
        </span>
      </div>

      <div
        aria-live="polite"
        className={`ai-status-panel ${tonePanelClassName(
          presentation.tone,
        )}`}
      >
        <p className="text-sm font-medium">{presentation.description}</p>
        {providerModel && liveOutcome ? (
          <p className="mt-1 text-xs opacity-80">
            Gemini model: {providerModel}
          </p>
        ) : null}
      </div>

      <div className="ai-action-row">
        <button
          type="button"
          onClick={onRequestLive}
          disabled={isLoading}
          className="ai-review-button"
        >
          {isLoading ? "Checking live AI..." : "Refresh guarded review"}
        </button>
        <p>
          Signed-in hikers can generate up to five live reviews per hour. Every
          review checks explanation text only and cannot add, remove,
          reprioritize, or relabel the rule-based list above.
        </p>
      </div>

      <p className="ai-trip-summary">
        {review.review.tripSummary}
      </p>

      <div className="ai-review-grid">
        <div>
          <h3>Missing-data review</h3>
          <ul>
            {review.review.missingDataReview.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3>Validation result</h3>
          {review.validationReasons.length > 0 ? (
            <ul className="text-amber-800">
              {review.validationReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p>
              The review matched the rule-based packing items and source labels.
            </p>
          )}
        </div>
      </div>

      <details className="ai-explanation-details group">
        <summary>
          <span>Item explanation drafts</span>
          <TrailPackIcon
            name="chevron"
            className="h-5 w-5 transition-transform group-open:rotate-180"
          />
        </summary>
        <ul>
          {review.review.itemExplanationDrafts.map((item) => (
            <li key={item.itemName}>
              <p className="font-medium text-slate-900">{item.itemName}</p>
              <p className="mt-1">{item.explanation}</p>
            </li>
          ))}
        </ul>
      </details>
    </section>
  );
}

function toneBadgeClassName(tone: AiReviewDisplayTone): string {
  switch (tone) {
    case "accepted":
      return "bg-emerald-100 text-emerald-800";
    case "loading":
      return "bg-sky-100 text-sky-900";
    case "error":
      return "bg-rose-100 text-rose-900";
    case "fallback":
      return "bg-amber-100 text-amber-900";
  }
}

function tonePanelClassName(tone: AiReviewDisplayTone): string {
  switch (tone) {
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-950";
    case "loading":
      return "border-sky-200 bg-sky-50 text-sky-950";
    case "error":
      return "border-rose-200 bg-rose-50 text-rose-950";
    case "fallback":
      return "border-amber-200 bg-amber-50 text-amber-950";
  }
}
