import type {
  AlertContext,
  RetrievalStatus,
  SourceLabel,
  WeatherContext,
} from "@/features/trailpack/types";

export type ContextTone =
  | "neutral"
  | "clear"
  | "warning"
  | "danger"
  | "unavailable";

export interface ContextStatusItem {
  status: string;
  summary: string;
  label: SourceLabel;
  retrievalStatus: RetrievalStatus;
  details: string[];
  notice?: string;
  tone: ContextTone;
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
      summary:
        weather.retrievalStatus === "live"
          ? weather.summary
          : "Packing guidance is using saved example conditions, not a current forecast.",
      label: weather.label,
      retrievalStatus: weather.retrievalStatus ?? "saved-fixture",
      details: weather.retrievalStatus === "live" ? weatherDetails(weather) : [],
      notice: weather.statusReason,
      tone: weather.retrievalStatus === "live" ? "neutral" : "unavailable",
    },
    alerts: {
      status: alertStatusText(alerts),
      summary: alertSummaryText(alerts),
      label: alerts.label,
      retrievalStatus: alerts.retrievalStatus ?? "saved-fixture",
      details:
        alerts.retrievalStatus === "live"
          ? alerts.alerts.map((alert) => alert.title)
          : [],
      notice: alerts.statusReason,
      tone: alertTone(alerts),
    },
  };
}

function alertTone(alerts: AlertContext): ContextTone {
  if (alerts.retrievalStatus !== "live") {
    return "unavailable";
  }

  if (!alerts.hasActiveAlerts) {
    return "clear";
  }

  return alerts.alerts.some((alert) => alert.severity === "closure")
    ? "danger"
    : "warning";
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
      return "Live forecast unavailable";
    case "unavailable":
      return "Weather unavailable";
  }
}

function alertStatusText(alerts: AlertContext): string {
  if (alerts.retrievalStatus === "live" && alerts.hasActiveAlerts) {
    return alerts.label === "official" ? "Active official alert" : "Active alert";
  }

  switch (alerts.retrievalStatus ?? "saved-fixture") {
    case "live":
      return "No active official alerts";
    case "saved-fixture":
      return "Live NPS alerts unavailable";
    case "unavailable":
      return "Live NPS alerts unavailable";
  }
}

function alertSummaryText(alerts: AlertContext): string {
  if (alerts.retrievalStatus === "live" && alerts.hasActiveAlerts) {
    return alerts.alerts.map((alert) => alert.title).join("; ");
  }

  switch (alerts.retrievalStatus ?? "saved-fixture") {
    case "live":
      return "NPS returned no active alerts for this park.";
    case "saved-fixture":
      return "Alert-based recommendations could not be evaluated from live NPS data. Standard safety rules remain active.";
    case "unavailable":
      return "Alert-based recommendations could not be evaluated from live NPS data. Standard safety rules remain active.";
  }
}
