import type {
  GuardedAiReviewResult,
  LiveAiOutcome,
} from "@/features/trailpack/lib/ai-contract";
import {
  getAiReviewPresentation,
  type AiReviewDisplayTone,
} from "@/features/trailpack/lib/ai-review-display";

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
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">
            Optional explanation layer
          </p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Guarded AI review
          </h2>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${toneBadgeClassName(
            presentation.tone,
          )}`}
        >
          {presentation.badge}
        </span>
      </div>

      <div
        aria-live="polite"
        className={`mt-4 rounded-lg border px-4 py-3 ${tonePanelClassName(
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

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onRequestLive}
          disabled={isLoading}
          className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:cursor-wait disabled:bg-slate-400"
        >
          {isLoading ? "Checking live AI..." : "Run guarded live review"}
        </button>
        <p className="max-w-xl text-xs leading-5 text-slate-500">
          Optional: this checks explanation text only. It cannot add, remove,
          reprioritize, or relabel anything in the rule-based list above.
        </p>
      </div>

      <p className="mt-4 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3 text-sm text-slate-700">
        {review.review.tripSummary}
      </p>

      <div className="mt-5 grid gap-5 lg:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Missing-data review</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-600">
            {review.review.missingDataReview.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Validation result</h3>
          {review.validationReasons.length > 0 ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800">
              {review.validationReasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          ) : (
            <p className="mt-2 text-sm text-slate-600">
              The review matched the rule-based packing items and source labels.
            </p>
          )}
        </div>
      </div>

      <details className="mt-5 rounded-lg border border-slate-100 bg-slate-50 px-4 py-3">
        <summary className="cursor-pointer text-sm font-semibold text-slate-900">
          Item explanation drafts
        </summary>
        <ul className="mt-3 space-y-3 text-sm text-slate-700">
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
