import type { TrailProfile } from "@/features/trailpack/types";
import { SourceBadge } from "./SourceBadge";

function formatConfidence(status: TrailProfile["sourceConfidence"]["status"]): string {
  return status.replaceAll("_", " ");
}

export function TrailProfileSummary({ trail }: { trail: TrailProfile }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">Selected trail</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">{trail.name}</h2>
          <p className="mt-1 text-slate-600">
            {trail.park} · {trail.state}
          </p>
        </div>
        <SourceBadge label="supported-profile" />
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Distance"
          value={`${trail.distanceMiles.value} mi`}
          officialNote="Official (NPS)"
          sourceLabel={trail.distanceMiles.label}
          computed={
            trail.distanceMiles.computedValue
              ? `USGS computed estimate: ~${trail.distanceMiles.computedValue} mi`
              : undefined
          }
          computedNote={trail.distanceMiles.computedNote}
        />
        <StatCard
          label="Elevation gain"
          value={`${trail.elevationGainFeet.value.toLocaleString()} ft`}
          officialNote="Official (NPS)"
          sourceLabel={trail.elevationGainFeet.label}
          computed={
            trail.elevationGainFeet.computedValue
              ? `USGS computed estimate: ~${trail.elevationGainFeet.computedValue} ft`
              : undefined
          }
          computedNote={trail.elevationGainFeet.computedNote}
          conflict={trail.sourceConfidence.gainMatch === "conflict"}
        />
        <StatCard
          label="Time"
          value={trail.estimatedDuration.value}
          sourceLabel={trail.estimatedDuration.label}
        />
        <StatCard
          label="Difficulty"
          value={trail.difficulty.value}
          sourceLabel={trail.difficulty.label}
        />
      </div>

      <details className="mt-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
        <summary className="cursor-pointer text-sm font-semibold text-slate-800">
          Sources &amp; Confidence
        </summary>
        <div className="mt-3 space-y-2 text-sm text-slate-600">
          <p>
            <span className="font-medium text-slate-800">Confidence:</span>{" "}
            {formatConfidence(trail.sourceConfidence.status)}
          </p>
          <p>{trail.sourceConfidence.summary}</p>
          <p>
            <span className="font-medium text-slate-800">NPS source:</span>{" "}
            <a
              href={trail.npsSourceUrl}
              className="text-emerald-700 underline"
              target="_blank"
              rel="noreferrer"
            >
              {trail.npsSourceUrl}
            </a>
          </p>
          <p>
            <span className="font-medium text-slate-800">Last checked:</span>{" "}
            {trail.sourceConfidence.lastChecked}
          </p>
          {trail.elevationMinFeet && trail.elevationMaxFeet ? (
            <p>
              <span className="font-medium text-slate-800">USGS elevation range:</span>{" "}
              {trail.elevationMinFeet.toLocaleString()}–{trail.elevationMaxFeet.toLocaleString()} ft
            </p>
          ) : null}
        </div>
      </details>
    </section>
  );
}

function StatCard({
  label,
  value,
  sourceLabel,
  computed,
  computedNote,
  officialNote,
  conflict = false,
}: {
  label: string;
  value: string;
  sourceLabel: TrailProfile["distanceMiles"]["label"];
  computed?: string;
  computedNote?: string;
  officialNote?: string;
  conflict?: boolean;
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <SourceBadge label={sourceLabel} />
        {officialNote ? (
          <span className="text-xs text-slate-500">{officialNote}</span>
        ) : null}
      </div>
      {computed ? (
        <p className="mt-2 text-xs text-slate-500">
          {computed}
          {conflict ? (
            <span className="ml-1 font-medium text-amber-700">· conflicts with NPS</span>
          ) : null}
        </p>
      ) : null}
      {computedNote ? (
        <p className="mt-1 text-xs text-slate-400">{computedNote}</p>
      ) : null}
    </div>
  );
}
