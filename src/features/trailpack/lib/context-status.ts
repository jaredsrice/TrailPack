import type { AlertContext, RetrievalStatus, SourceLabel, WeatherContext } from "@/features/trailpack/types";

export interface ContextStatusItem {
  status: string;
  summary: string;
  label: SourceLabel;
  retrievalStatus: RetrievalStatus;
  details: string[];
}

export interface ContextStatusSummary {
  weather: ContextStatusItem;
  alerts: ContextStatusItem;
}

export function buildContextStatus(
  weather: WeatherContext,
  alerts: AlertContext,
): ContextStatusSummary {
  return {
    weather: {
      status: weatherStatusText(weather),
      summary: weather.summary,
      label: weather.label,
      retrievalStatus: weather.retrievalStatus ?? "saved-fixture",
      details: weatherDetails(weather),
    },
    alerts: {
      status: alertStatusText(alerts),
      summary: alertSummaryText(alerts),
      label: alerts.label,
      retrievalStatus: alerts.retrievalStatus ?? "saved-fixture",
      details: alerts.alerts.map((alert) => alert.title),
    },
  };
}

function formatClock(isoValue?: string): string | null {
  const match = isoValue?.match(/T(\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}

function weatherDetails(weather: WeatherContext): string[] {
  const details: string[] = [...weather.conditions];
  const civilTwilightEnd = formatClock(weather.daylight?.civilTwilightEnd);
  if (civilTwilightEnd) {
    details.push(`Civil twilight ends ${civilTwilightEnd}`);
  }

  return details;
}

function weatherStatusText(weather: WeatherContext): string {
  switch (weather.retrievalStatus ?? "saved-fixture") {
    case "live":
      return "Live forecast";
    case "saved-fixture":
      return "Saved demo forecast";
    case "unavailable":
      return "Weather unavailable";
  }
}

function alertStatusText(alerts: AlertContext): string {
  if (alerts.hasActiveAlerts) {
    return alerts.label === "official" ? "Active official alert" : "Active alert";
  }

  switch (alerts.retrievalStatus ?? "saved-fixture") {
    case "live":
      return "No active official alerts";
    case "saved-fixture":
      return "No active alerts in saved fixture";
    case "unavailable":
      return "Alert data unavailable";
  }
}

function alertSummaryText(alerts: AlertContext): string {
  if (alerts.hasActiveAlerts) {
    return alerts.alerts.map((alert) => alert.title).join("; ");
  }

  switch (alerts.retrievalStatus ?? "saved-fixture") {
    case "live":
      return "NPS returned no active alerts for this park.";
    case "saved-fixture":
      return "The saved demo alert fixture has no active alerts for this scenario.";
    case "unavailable":
      return alerts.statusReason ?? "NPS alert data is unavailable.";
  }
}
