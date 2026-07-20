import type { AlertContext, WeatherContext } from "@/features/trailpack/types";

export interface DemoScenario {
  weather: WeatherContext;
  alerts: AlertContext;
}

const TRAIL_CATALOG_IDS = [
  "jenny-lake-loop",
  "taggart-lake",
  "string-lake-loop",
  "colter-bay-lakeshore-trail",
  "two-ocean-lake-loop",
] as const;

export type TrailCatalogId = (typeof TRAIL_CATALOG_IDS)[number];

const NO_ALERTS: AlertContext = {
  hasActiveAlerts: false,
  alerts: [],
  label: "unavailable",
  retrievalStatus: "saved-fixture",
  statusReason:
    "Saved demo fixture contains no active alerts; check live NPS alerts before the hike.",
};

const TAGGART_2026_TRAIL_WORK: AlertContext = {
  hasActiveAlerts: true,
  alerts: [
    {
      title: "Taggart Trail 2026 construction closure",
      description:
        "NPS says a section of the Taggart Trail will be closed in 2026 for trail improvements. Check the current route before leaving.",
      severity: "closure",
      source: "NPS",
      sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
    },
  ],
  label: "official",
  retrievalStatus: "saved-fixture",
};

export const DEMO_CONTEXTS: Record<TrailCatalogId, DemoScenario> = {
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
      retrievalStatus: "saved-fixture",
      statusReason: "Saved weather fixture for deterministic TrailPack testing.",
      timezone: "America/Denver",
      daylight: {
        date: "2026-06-15",
        sunrise: "2026-06-15T05:38:37-06:00",
        sunset: "2026-06-15T21:08:20-06:00",
        civilTwilightBegin: "2026-06-15T05:04:20-06:00",
        civilTwilightEnd: "2026-06-15T21:42:37-06:00",
        dayLengthSeconds: 55783,
        timezone: "America/Denver",
        source: "sunrise-sunset",
        retrievalStatus: "saved-fixture",
      },
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
      retrievalStatus: "saved-fixture",
      statusReason: "Saved weather fixture for deterministic TrailPack testing.",
      timezone: "America/Denver",
      daylight: {
        date: "2026-06-15",
        sunrise: "2026-06-15T05:38:37-06:00",
        sunset: "2026-06-15T21:08:20-06:00",
        civilTwilightBegin: "2026-06-15T05:04:20-06:00",
        civilTwilightEnd: "2026-06-15T21:42:37-06:00",
        dayLengthSeconds: 55783,
        timezone: "America/Denver",
        source: "sunrise-sunset",
        retrievalStatus: "saved-fixture",
      },
    },
    alerts: TAGGART_2026_TRAIL_WORK,
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
      retrievalStatus: "saved-fixture",
      statusReason: "Saved weather fixture for deterministic TrailPack testing.",
      timezone: "America/Denver",
      daylight: {
        date: "2026-06-15",
        sunrise: "2026-06-15T05:38:37-06:00",
        sunset: "2026-06-15T21:08:20-06:00",
        civilTwilightBegin: "2026-06-15T05:04:20-06:00",
        civilTwilightEnd: "2026-06-15T21:42:37-06:00",
        dayLengthSeconds: 55783,
        timezone: "America/Denver",
        source: "sunrise-sunset",
        retrievalStatus: "saved-fixture",
      },
    },
    alerts: NO_ALERTS,
  },
  "colter-bay-lakeshore-trail": {
    weather: {
      plannedDate: "2026-06-15",
      summary: "Mild saved demo conditions with mixed sun near Colter Bay.",
      temperatureF: { high: 70, low: 45, current: 58 },
      precipitationChance: 20,
      windMph: 8,
      conditions: ["sun"],
      source: "open-meteo",
      label: "forecast-based",
      retrievalStatus: "saved-fixture",
      statusReason: "Saved weather fixture for deterministic TrailPack testing.",
      timezone: "America/Denver",
      daylight: {
        date: "2026-06-15",
        sunrise: "2026-06-15T05:38:37-06:00",
        sunset: "2026-06-15T21:08:20-06:00",
        civilTwilightBegin: "2026-06-15T05:04:20-06:00",
        civilTwilightEnd: "2026-06-15T21:42:37-06:00",
        dayLengthSeconds: 55783,
        timezone: "America/Denver",
        source: "sunrise-sunset",
        retrievalStatus: "saved-fixture",
      },
    },
    alerts: NO_ALERTS,
  },
  "two-ocean-lake-loop": {
    weather: {
      plannedDate: "2026-06-15",
      summary: "Sunny saved demo conditions with a cool start at Two Ocean Lake.",
      temperatureF: { high: 75, low: 43, current: 56 },
      precipitationChance: 10,
      windMph: 10,
      conditions: ["sun"],
      source: "open-meteo",
      label: "forecast-based",
      retrievalStatus: "saved-fixture",
      statusReason: "Saved weather fixture for deterministic TrailPack testing.",
      timezone: "America/Denver",
      daylight: {
        date: "2026-06-15",
        sunrise: "2026-06-15T05:38:37-06:00",
        sunset: "2026-06-15T21:08:20-06:00",
        civilTwilightBegin: "2026-06-15T05:04:20-06:00",
        civilTwilightEnd: "2026-06-15T21:42:37-06:00",
        dayLengthSeconds: 55783,
        timezone: "America/Denver",
        source: "sunrise-sunset",
        retrievalStatus: "saved-fixture",
      },
    },
    alerts: NO_ALERTS,
  },
};

function isTrailCatalogId(trailId: string): trailId is TrailCatalogId {
  return TRAIL_CATALOG_IDS.includes(trailId as TrailCatalogId);
}

export function getDemoScenario(trailId: string | null | undefined): DemoScenario | null {
  if (!trailId) {
    return null;
  }

  if (!isTrailCatalogId(trailId)) {
    return null;
  }

  return DEMO_CONTEXTS[trailId];
}
