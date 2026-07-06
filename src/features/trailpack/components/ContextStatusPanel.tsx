import { buildContextStatus } from "@/features/trailpack/lib/context-status";
import type { AlertContext, WeatherContext } from "@/features/trailpack/types";
import { SourceBadge } from "./SourceBadge";

export function ContextStatusPanel({
  weather,
  alerts,
}: {
  weather: WeatherContext;
  alerts: AlertContext;
}) {
  const status = buildContextStatus(weather, alerts);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-medium text-slate-500">External context</p>
        <h2 className="mt-1 text-xl font-semibold text-slate-900">
          Weather and alert status
        </h2>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <ContextCard
          title="Weather"
          status={status.weather.status}
          summary={status.weather.summary}
          label={status.weather.label}
          retrievalStatus={status.weather.retrievalStatus}
          details={status.weather.details}
        />
        <ContextCard
          title="NPS alerts"
          status={status.alerts.status}
          summary={status.alerts.summary}
          label={status.alerts.label}
          retrievalStatus={status.alerts.retrievalStatus}
          details={status.alerts.details}
        />
      </div>
    </section>
  );
}

function ContextCard({
  title,
  status,
  summary,
  label,
  retrievalStatus,
  details,
}: {
  title: string;
  status: string;
  summary: string;
  label: WeatherContext["label"];
  retrievalStatus: string;
  details: string[];
}) {
  return (
    <div className="rounded-lg border border-slate-100 bg-slate-50 p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            {title}
          </p>
          <h3 className="mt-2 text-base font-semibold text-slate-900">{status}</h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-xs text-slate-600">
          {retrievalStatus}
        </span>
      </div>

      <p className="mt-3 text-sm text-slate-600">{summary}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        <SourceBadge label={label} />
        {details.map((detail) => (
          <span
            key={detail}
            className="rounded-full border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600"
          >
            {detail}
          </span>
        ))}
      </div>
    </div>
  );
}
