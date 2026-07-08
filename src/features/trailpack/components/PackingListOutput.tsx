import type { PackingRecommendation } from "@/features/trailpack/types";
import { SourceBadge } from "./SourceBadge";

export function PackingListOutput({
  recommendation,
}: {
  recommendation: PackingRecommendation;
}) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Today&apos;s TrailPack</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {recommendation.trailName}
          </h2>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          Rule-based list · {new Date(recommendation.generatedAt).toLocaleString()}
        </p>
      </div>

      <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {recommendation.confidenceNote}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <ItemGroup title="Essential" items={recommendation.essential} />
        <ItemGroup title="Optional" items={recommendation.optional} />
      </div>

      {recommendation.missingDetails.length > 0 ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
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
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span className="text-sm text-slate-500">{items.length} items</span>
      </div>
      <ul className="mt-3 space-y-3">
        {items.map((item) => (
          <li
            key={item.name}
            className="rounded-lg border border-slate-100 bg-slate-50 p-4"
          >
            <p className="text-sm font-semibold text-slate-900">{item.name}</p>
            <div className="mt-2 space-y-3 text-sm leading-6 text-slate-700">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Recommendation
                </p>
                <p className="mt-1">{item.recommendation}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Why
                </p>
                <p className="mt-1">{item.why}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              {item.sourceLabels.map((label) => (
                <SourceBadge key={`${item.name}-${label}`} label={label} />
              ))}
              {item.links?.map((link) => (
                <a
                  key={`${item.name}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 underline"
                >
                  {link.label}
                </a>
              ))}
              {!item.links && item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 underline"
                >
                  Source
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
