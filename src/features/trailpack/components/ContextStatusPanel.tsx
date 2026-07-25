"use client";

import { useState, type ReactNode } from "react";
import { buildContextStatus } from "@/features/trailpack/lib/context-status";
import {
  buildForecastTimelineMarkers,
  type ForecastTimelineMarker,
} from "@/features/trailpack/lib/forecast-timeline";
import type {
  AlertContext,
  WeatherContext,
  WeatherForecastPeriod,
} from "@/features/trailpack/types";
import { SourceBadge } from "./SourceBadge";

const FORECAST_HIGHLIGHT_HOURS = [6, 10, 14, 18] as const;

export function ContextStatusPanel({
  weather,
  alerts,
  isWeatherLoading = false,
  startTime,
}: {
  weather: WeatherContext;
  alerts: AlertContext;
  isWeatherLoading?: boolean;
  startTime?: string;
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
          <DayForecast startTime={startTime} weather={weather} />
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

function DayForecast({
  weather,
  startTime,
}: {
  weather: WeatherContext;
  startTime?: string;
}) {
  const periods = weather.forecastPeriods ?? [];
  const highlights = selectForecastHighlights(periods);
  const canShowHourly = periods.length > highlights.length;
  const timelineMarkers = buildForecastTimelineMarkers({
    daylight: weather.daylight,
    startTime,
  });
  const [selectedView, setSelectedView] = useState<"highlights" | "hourly">(
    "highlights",
  );
  const visibleView =
    selectedView === "hourly" && canShowHourly ? "hourly" : "highlights";

  return (
    <details className="group mt-5 border-t border-slate-200 pt-1">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-3 text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-700">
        <div>
          <p className="text-sm font-semibold text-slate-900">Day forecast</p>
          <p className="mt-1 text-xs text-slate-500">
            {periods.length > 4
              ? `${periods.length} hourly periods available`
              : periods.length === 4
                ? "Four representative times"
                : periods.length > 0
                  ? `${periods.length} representative periods`
                  : "No detailed periods available"}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {weather.plannedDate ? (
            <p className="text-xs text-slate-500">
              {formatForecastDate(weather.plannedDate)}
            </p>
          ) : null}
          <span
            aria-hidden="true"
            className="text-lg text-slate-500 transition-transform group-open:rotate-180"
          >
            ⌄
          </span>
        </div>
      </summary>

      <div className="pb-1 pt-2">
        {periods.length > 0 ? (
          <>
            <ForecastTimelineSummary markers={timelineMarkers} />

            {canShowHourly ? (
              <div
                aria-label="Forecast detail"
                className="inline-flex rounded-lg bg-slate-200 p-1"
                role="group"
              >
                <ForecastViewButton
                  isSelected={visibleView === "highlights"}
                  label="Highlights"
                  onClick={() => setSelectedView("highlights")}
                />
                <ForecastViewButton
                  isSelected={visibleView === "hourly"}
                  label="Hour by hour"
                  onClick={() => setSelectedView("hourly")}
                />
              </div>
            ) : (
              <p className="rounded-md bg-white px-3 py-2 text-xs leading-5 text-slate-500">
                This saved fallback includes representative times. Full hourly
                detail appears when a live forecast is available.
              </p>
            )}

            {visibleView === "hourly" ? (
              <HourlyForecast markers={timelineMarkers} periods={periods} />
            ) : (
              <ForecastHighlights periods={highlights} />
            )}
          </>
        ) : (
          <p className="rounded-md bg-white px-3 py-2 text-xs text-slate-500">
            A detailed day timeline is unavailable for this weather response.
          </p>
        )}
      </div>
    </details>
  );
}

function ForecastViewButton({
  isSelected,
  label,
  onClick,
}: {
  isSelected: boolean;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      aria-pressed={isSelected}
      className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
        isSelected
          ? "bg-white text-slate-900 shadow-sm"
          : "text-slate-600 hover:text-slate-900"
      }`}
      onClick={onClick}
      type="button"
    >
      {label}
    </button>
  );
}

function ForecastHighlights({
  periods,
}: {
  periods: WeatherForecastPeriod[];
}) {
  return (
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
          <ForecastPeriodDetails period={period} />
        </div>
      ))}
    </div>
  );
}

function ForecastTimelineSummary({
  markers,
}: {
  markers: ForecastTimelineMarker[];
}) {
  if (markers.length === 0) {
    return null;
  }

  return (
    <div className="mb-3 rounded-lg border border-sky-100 bg-sky-50 p-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-sky-900">
        Trip timeline
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        {markers.map((marker) => (
          <TimelineMarkerBadge key={marker.id} marker={marker} />
        ))}
      </div>
    </div>
  );
}

function HourlyForecast({
  periods,
  markers,
}: {
  periods: WeatherForecastPeriod[];
  markers: ForecastTimelineMarker[];
}) {
  return (
    <div className="mt-3 grid gap-2 md:grid-cols-2">
      {periods.map((period) => {
        const hour = forecastHour(period.time);
        const periodMarkers = markers.filter((marker) => marker.hour === hour);

        return (
          <div
            key={period.time}
            className={`rounded-lg border bg-white p-3 ${
              periodMarkers.some((marker) => marker.kind === "start")
                ? "border-emerald-400 ring-1 ring-emerald-200"
                : "border-slate-200"
            }`}
          >
            {periodMarkers.length > 0 ? (
              <div className="mb-3 flex flex-wrap gap-1.5">
                {periodMarkers.map((marker) => (
                  <TimelineMarkerBadge key={marker.id} marker={marker} compact />
                ))}
              </div>
            ) : null}
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {formatForecastTime(period.time)}
                </p>
                <p className="mt-1 text-sm capitalize text-slate-700">
                  {period.condition}
                </p>
              </div>
              <p className="text-xl font-semibold text-slate-900">
                {formatTemperature(period.temperatureF)}
              </p>
            </div>
            <ForecastPeriodDetails period={period} />
          </div>
        );
      })}
    </div>
  );
}

function TimelineMarkerBadge({
  marker,
  compact = false,
}: {
  marker: ForecastTimelineMarker;
  compact?: boolean;
}) {
  const isStart = marker.kind === "start";

  return (
    <span
      className={`rounded-full border font-medium ${
        compact ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs"
      } ${
        isStart
          ? "border-emerald-300 bg-emerald-100 text-emerald-900"
          : "border-sky-200 bg-white text-sky-900"
      }`}
    >
      {marker.label} {marker.time}
    </span>
  );
}

function ForecastPeriodDetails({
  period,
}: {
  period: WeatherForecastPeriod;
}) {
  return (
    <div className="mt-3 space-y-1 text-xs text-slate-500">
      {period.apparentTemperatureF !== undefined ? (
        <p>Feels like {formatTemperature(period.apparentTemperatureF)}</p>
      ) : null}
      {period.precipitationChance !== undefined ? (
        <p>Precipitation {period.precipitationChance}%</p>
      ) : null}
      {period.windMph !== undefined ? <p>Wind {period.windMph} mph</p> : null}
    </div>
  );
}

function selectForecastHighlights(
  periods: WeatherForecastPeriod[],
): WeatherForecastPeriod[] {
  if (periods.length <= FORECAST_HIGHLIGHT_HOURS.length) {
    return periods;
  }

  const highlights = FORECAST_HIGHLIGHT_HOURS.flatMap((hour) => {
    const match = periods.find(
      (period) => forecastHour(period.time) === hour,
    );
    return match ? [match] : [];
  });

  if (highlights.length === FORECAST_HIGHLIGHT_HOURS.length) {
    return highlights;
  }

  return periods.slice(0, FORECAST_HIGHLIGHT_HOURS.length);
}

function forecastHour(value: string): number | null {
  const match = value.match(/T(\d{2}):/);
  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  return Number.isNaN(hour) ? null : hour;
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
