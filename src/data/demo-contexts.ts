import type { AlertContext, WeatherContext } from "@/types/trailpack";

export interface DemoScenario {
  weather: WeatherContext;
  alerts: AlertContext;
}

const SUPPORTED_TRAIL_IDS = [
  "jenny-lake-loop",
  "taggart-lake",
  "string-lake-loop",
] as const;

export type SupportedTrailId = (typeof SUPPORTED_TRAIL_IDS)[number];

const NO_ALERTS: AlertContext = {
  hasActiveAlerts: false,
  alerts: [],
  label: "unavailable",
};

export const DEMO_CONTEXTS: Record<SupportedTrailId, DemoScenario> = {
  "jenny-lake-loop": {
    weather: {
      plannedDate: "2026-06-15",
      summary: "Partly sunny with a chance of afternoon showers in the Tetons.",
      temperatureF: { high: 68, low: 42, current: 55 },
      precipitationChance: 35,
      windMph: 12,
      conditions: ["sun", "rain", "wind"],
      source: "open-meteo",
      label: "forecast-based",
    },
    alerts: NO_ALERTS,
  },
  "taggart-lake": {
    weather: {
      plannedDate: "2026-06-15",
      summary: "Sunny and mild with a cool start at the trailhead.",
      temperatureF: { high: 72, low: 48, current: 58 },
      precipitationChance: 10,
      windMph: 8,
      conditions: ["sun"],
      source: "open-meteo",
      label: "forecast-based",
    },
    alerts: NO_ALERTS,
  },
  "string-lake-loop": {
    weather: {
      plannedDate: "2026-06-15",
      summary: "Hot, sunny, and breezy around the exposed String Lake shoreline.",
      temperatureF: { high: 84, low: 52, current: 74 },
      precipitationChance: 5,
      windMph: 14,
      conditions: ["sun", "heat", "wind"],
      source: "open-meteo",
      label: "forecast-based",
    },
    alerts: NO_ALERTS,
  },
};

function isSupportedTrailId(trailId: string): trailId is SupportedTrailId {
  return SUPPORTED_TRAIL_IDS.includes(trailId as SupportedTrailId);
}

export function getDemoScenario(trailId: string | null | undefined): DemoScenario | null {
  if (!trailId) {
    return null;
  }

  if (!isSupportedTrailId(trailId)) {
    return null;
  }

  return DEMO_CONTEXTS[trailId];
}
