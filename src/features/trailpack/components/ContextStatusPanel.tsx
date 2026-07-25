import type { ReactNode } from "react";
import { buildContextStatus } from "@/features/trailpack/lib/context-status";
import type { AlertContext, WeatherContext } from "@/features/trailpack/types";
import { SourceBadge } from "./SourceBadge";

export function ContextStatusPanel({
  weather,
  alerts,
  isWeatherLoading = false,
}: {
  weather: WeatherContext;
  alerts: AlertContext;
  isWeatherLoading?: boolean;
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

      <div className="mt-5 grid gap-4 lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]">
        <ContextCard
          title="Weather"
          status={
            isWeatherLoading ? "Updating live forecast" : status.weather.status
          }
          summary={status.weather.summary}
          label={status.weather.label}
          retrievalStatus={status.weather.retrievalStatus}
          details={status.weather.details}
          notice={
            isWeatherLoading
              ? "Saved values remain visible while TrailPack requests the latest forecast."
              : status.weather.notice
          }
        >
          <DayForecast weather={weather} />
        </ContextCard>
        <ContextCard
          title="NPS alerts"
          status={status.alerts.status}
          summary={status.alerts.summary}
          label={status.alerts.label}
          retrievalStatus={status.alerts.retrievalStatus}
          details={status.alerts.details}
          notice={status.alerts.notice}
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
  notice,
  children,
}: {
  title: string;
  status: string;
  summary: string;
  label: WeatherContext["label"];
  retrievalStatus: string;
  details: string[];
  notice?: string;
  children?: ReactNode;
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

      {notice ? (
        <p className="mt-3 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs leading-5 text-amber-900">
          {notice}
        </p>
      ) : null}

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

      {children}
    </div>
  );
}

function DayForecast({ weather }: { weather: WeatherContext }) {
  const periods = weather.forecastPeriods ?? [];

  return (
    <div className="mt-5 border-t border-slate-200 pt-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-slate-900">Day forecast</p>
        {weather.plannedDate ? (
          <p className="text-xs text-slate-500">
            {formatForecastDate(weather.plannedDate)}
          </p>
        ) : null}
      </div>

      {periods.length > 0 ? (
        <div className="mt-3 grid grid-cols-2 gap-2 xl:grid-cols-4">
          {periods.map((period) => (
            <div
              key={period.time}
              className="rounded-lg border border-slate-200 bg-white p-3"
            >
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                {periodName(period.time)}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {formatForecastTime(period.time)}
              </p>
              <p className="mt-3 text-2xl font-semibold text-slate-900">
                {formatTemperature(period.temperatureF)}
              </p>
              <p className="mt-1 min-h-10 text-sm capitalize text-slate-700">
                {period.condition}
              </p>
              <div className="mt-3 space-y-1 text-xs text-slate-500">
                {period.apparentTemperatureF !== undefined ? (
                  <p>Feels like {formatTemperature(period.apparentTemperatureF)}</p>
                ) : null}
                {period.precipitationChance !== undefined ? (
                  <p>Precipitation {period.precipitationChance}%</p>
                ) : null}
                {period.windMph !== undefined ? (
                  <p>Wind {period.windMph} mph</p>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 rounded-md bg-white px-3 py-2 text-xs text-slate-500">
          A detailed day timeline is unavailable for this weather response.
        </p>
      )}
    </div>
  );
}

function formatForecastDate(value: string): string {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function formatForecastTime(value: string): string {
  const match = value.match(/T(\d{2}):(\d{2})/);
  if (!match) {
    return value;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return minute === "00"
    ? `${hour12} ${period}`
    : `${hour12}:${minute} ${period}`;
}

function periodName(value: string): string {
  const match = value.match(/T(\d{2}):/);
  const hour = match ? Number.parseInt(match[1], 10) : 12;

  if (hour < 9) return "Morning";
  if (hour < 12) return "Late morning";
  if (hour < 17) return "Afternoon";
  return "Evening";
}

function formatTemperature(value: number | undefined): string {
  return value === undefined ? "—" : `${value}°`;
}
