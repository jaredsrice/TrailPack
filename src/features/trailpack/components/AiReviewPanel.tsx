import type { GuardedAiReviewResult } from "@/features/trailpack/lib/ai-contract";

export function AiReviewPanel({ review }: { review: GuardedAiReviewResult }) {
  const isAccepted = review.status === "accepted";

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Guarded AI review</p>
          <h2 className="mt-1 text-xl font-semibold text-slate-900">
            Trip summary and validation
          </h2>
        </div>
        <p
          className={`rounded-full px-3 py-1 text-xs font-medium ${
            isAccepted
              ? "bg-emerald-100 text-emerald-800"
              : "bg-amber-100 text-amber-900"
          }`}
        >
          {isAccepted ? "Saved fixture accepted" : "Template fallback"}
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
