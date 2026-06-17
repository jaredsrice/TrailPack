import type { AlertContext, WeatherContext } from "@/types/trailpack";

export interface DemoScenario {
  weather: WeatherContext;
  alerts: AlertContext;
}

const NO_ALERTS: AlertContext = {
  hasActiveAlerts: false,
  alerts: [],
  label: "unavailable",
};

export const DEMO_CONTEXTS: Record<string, DemoScenario> = {
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
      summary: "Mostly sunny and breezy near the ridge above String Lake.",
      temperatureF: { high: 70, low: 45, current: 56 },
      precipitationChance: 15,
      windMph: 16,
      conditions: ["sun", "wind"],
      source: "open-meteo",
      label: "forecast-based",
    },
    alerts: NO_ALERTS,
  },
};
