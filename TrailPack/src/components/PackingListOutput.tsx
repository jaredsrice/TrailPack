import type { PackingRecommendation } from "@/types/trailpack";
import { SourceBadge } from "./SourceBadge";

export function PackingListOutput({
  recommendation,
}: {
  recommendation: PackingRecommendation;
}) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Today&apos;s TrailPack</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {recommendation.trailName}
          </h2>
        </div>
        <p className="text-xs text-slate-500">
          Rule-based · no AI · {new Date(recommendation.generatedAt).toLocaleString()}
        </p>
      </div>

      <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {recommendation.confidenceNote}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ItemGroup title="Essential" items={recommendation.essential} />
        <ItemGroup title="Optional" items={recommendation.optional} />
      </div>

      {recommendation.missingDetails.length > 0 ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">
            Missing details that could improve this list
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {recommendation.missingDetails.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function ItemGroup({
  title,
  items,
}: {
  title: string;
  items: PackingRecommendation["essential"];
}) {
  return (
    <div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li
            key={item.name}
            className="rounded-xl border border-slate-100 bg-slate-50 p-4"
          >
            <p className="font-medium text-slate-900">{item.name}</p>
            <p className="mt-1 text-sm text-slate-600">{item.reason}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {item.sourceLabels.map((label) => (
                <SourceBadge key={`${item.name}-${label}`} label={label} />
              ))}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
