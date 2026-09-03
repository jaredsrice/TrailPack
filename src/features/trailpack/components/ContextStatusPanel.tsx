"use client";

import { useState, type ReactNode } from "react";
import {
  buildContextStatus,
  type ContextTone,
} from "@/features/trailpack/lib/context-status";
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
import {
  TrailPackIcon,
  type TrailPackIconName,
} from "./TrailPackIcon";

const FORECAST_HIGHLIGHT_HOURS = [6, 10, 14, 18] as const;

export function ContextStatusPanel({
  weather,
  alerts,
  isWeatherLoading = false,
  isAlertLoading = false,
  isAlertRetrying = false,
  startTime,
}: {
  weather: WeatherContext;
  alerts: AlertContext;
  isWeatherLoading?: boolean;
  isAlertLoading?: boolean;
  isAlertRetrying?: boolean;
  startTime?: string;
}) {
  const status = buildContextStatus(weather, alerts);

  return (
    <section
      id="context-status"
      className="context-section"
      aria-labelledby="context-status-heading"
    >
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">External context</p>
          <h2 id="context-status-heading" className="section-title">
            Weather and alert status
          </h2>
          <p className="section-subtitle">
            Current planning context remains visibly separate from trail facts.
          </p>
        </div>
        <TrailPackIcon name="weather" className="section-heading-icon" />
      </div>

      <div className="context-grid">
        <ContextCard
          icon="weather"
          tone={isWeatherLoading ? "neutral" : status.weather.tone}
          title="Weather"
          status={
            isWeatherLoading ? "Updating live forecast" : status.weather.status
          }
          summary={status.weather.summary}
          label={status.weather.label}
          retrievalStatus={
            isWeatherLoading ? "loading" : status.weather.retrievalStatus
          }
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
          icon="alert"
          tone={isAlertLoading ? "neutral" : status.alerts.tone}
          title="NPS alerts"
          status={isAlertLoading ? "Updating live alerts" : status.alerts.status}
          summary={
            isAlertLoading
              ? "Checking NPS for current park alerts before generation."
              : status.alerts.summary
          }
          label={status.alerts.label}
          retrievalStatus={
            isAlertLoading ? "loading" : status.alerts.retrievalStatus
          }
          details={status.alerts.details}
          notice={
            isAlertLoading
              ? "Saved alert context remains visible while TrailPack requests current NPS alerts."
              : isAlertRetrying
                ? "TrailPack is retrying once in the background. You can generate now using standard safety rules."
                : status.alerts.notice
          }
        />
      </div>
    </section>
  );
}

function ContextCard({
  icon,
  tone,
  title,
  status,
  summary,
  label,
  retrievalStatus,
  details,
  notice,
  children,
}: {
  icon: TrailPackIconName;
  tone: ContextTone;
  title: string;
  status: string;
  summary: string;
  label: WeatherContext["label"];
  retrievalStatus: string;
  details: string[];
  notice?: string;
  children?: ReactNode;
}) {
  const showSource = retrievalStatus === "live" && label !== "unavailable";

  return (
    <div
      className="context-card"
      data-context={icon}
      data-tone={tone}
      aria-busy={retrievalStatus === "loading"}
    >
      <div className="context-card-heading">
        <div className="context-card-title">
          <TrailPackIcon name={icon} className="h-6 w-6" />
          <div>
            <p className="context-card-label">
              {title}
            </p>
            <h3>{status}</h3>
          </div>
        </div>
        <span
          className="retrieval-pill"
          data-retrieval-status={retrievalStatus}
        >
          {retrievalStatusLabel(retrievalStatus)}
        </span>
      </div>

      <p className="context-summary">{summary}</p>

      {notice ? (
        <p className="context-notice">
          {notice}
        </p>
      ) : null}

      {details.length > 0 || showSource ? (
        <div className="context-badges">
          {showSource ? <SourceBadge label={label} /> : null}
          {details.map((detail) => (
            <span key={detail} className="context-detail-pill">
              {detail}
            </span>
          ))}
        </div>
      ) : null}

      {children}
    </div>
  );
}

function retrievalStatusLabel(retrievalStatus: string): string {
  switch (retrievalStatus) {
    case "loading":
      return "Checking";
    case "live":
      return "Live";
    case "saved-fixture":
      return "Fallback";
    case "unavailable":
      return "Unavailable";
    default:
      return retrievalStatus;
  }
}

function DayForecast({
  weather,
  startTime,
}: {
  weather: WeatherContext;
  startTime?: string;
}) {
  const periods = weather.forecastPeriods ?? [];
  const isLiveForecast = weather.retrievalStatus === "live";
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
    <details className="forecast-details group">
      <summary>
        <div>
          <p className="forecast-details-title">
            {isLiveForecast ? "Day forecast" : "Saved weather example"}
          </p>
          <p className="forecast-details-subtitle">
            {!isLiveForecast
              ? "Example values only — not current weather"
              : periods.length > 4
              ? `${periods.length} hourly periods available`
              : periods.length === 4
                ? "Four representative times"
                : periods.length > 0
                  ? `${periods.length} representative periods`
                  : "No detailed periods available"}
          </p>
        </div>
        <div className="forecast-summary-meta">
          {weather.plannedDate ? (
            <p>
              {formatForecastDate(weather.plannedDate)}
            </p>
          ) : null}
          <TrailPackIcon
            name="chevron"
            className="h-5 w-5 transition-transform group-open:rotate-180"
          />
        </div>
      </summary>

      <div className="forecast-details-content">
        {periods.length > 0 ? (
          <>
            <ForecastTimelineSummary markers={timelineMarkers} />

            {canShowHourly ? (
              <div
                aria-label="Forecast detail"
                className="forecast-view-toggle"
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
              <p className="forecast-availability-note">
                {isLiveForecast
                  ? "These are the forecast periods available for this response."
                  : "These saved values support the fallback packing list. They are not a forecast for your hike; check current weather before leaving."}
              </p>
            )}

            {visibleView === "hourly" ? (
              <HourlyForecast markers={timelineMarkers} periods={periods} />
            ) : (
              <ForecastHighlights periods={highlights} />
            )}
          </>
        ) : (
          <p className="forecast-availability-note">
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
      className={`forecast-view-button ${
        isSelected
          ? "is-selected"
          : ""
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
    <div className="forecast-highlight-grid">
      {periods.map((period) => (
        <div key={period.time} className="forecast-highlight">
          <p className="forecast-period-label">
            {periodName(period.time)}
          </p>
          <p className="forecast-period-time">
            {formatForecastTime(period.time)}
          </p>
          <p className="forecast-temperature">
            {formatTemperature(period.temperatureF)}
          </p>
          <p className="forecast-condition">
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
    <div className="forecast-timeline">
      <p className="forecast-timeline-label">
        Trip timeline
      </p>
      <div className="forecast-timeline-markers">
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
