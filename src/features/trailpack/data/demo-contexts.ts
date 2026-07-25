import type {
  AlertContext,
  WeatherContext,
  WeatherForecastPeriod,
} from "@/features/trailpack/types";

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

function savedForecastPeriods(
  periods: Array<{
    hour: string;
    temperatureF: number;
    apparentTemperatureF: number;
    precipitationChance: number;
    windMph: number;
    weatherCode: number;
    condition: string;
  }>,
): WeatherForecastPeriod[] {
  return periods.map((period) => ({
    ...period,
    time: `2026-06-15T${period.hour}:00`,
  }));
}

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
      forecastPeriods: savedForecastPeriods([
        {
          hour: "06",
          temperatureF: 44,
          apparentTemperatureF: 42,
          precipitationChance: 15,
          windMph: 5,
          weatherCode: 1,
          condition: "mostly clear",
        },
        {
          hour: "10",
          temperatureF: 58,
          apparentTemperatureF: 56,
          precipitationChance: 20,
          windMph: 8,
          weatherCode: 2,
          condition: "partly cloudy",
        },
        {
          hour: "14",
          temperatureF: 67,
          apparentTemperatureF: 65,
          precipitationChance: 35,
          windMph: 12,
          weatherCode: 61,
          condition: "rain likely",
        },
        {
          hour: "18",
          temperatureF: 61,
          apparentTemperatureF: 59,
          precipitationChance: 30,
          windMph: 10,
          weatherCode: 80,
          condition: "rain showers possible",
        },
      ]),
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
      forecastPeriods: savedForecastPeriods([
        {
          hour: "06",
          temperatureF: 49,
          apparentTemperatureF: 47,
          precipitationChance: 5,
          windMph: 3,
          weatherCode: 1,
          condition: "mostly clear",
        },
        {
          hour: "10",
          temperatureF: 62,
          apparentTemperatureF: 61,
          precipitationChance: 5,
          windMph: 5,
          weatherCode: 0,
          condition: "clear",
        },
        {
          hour: "14",
          temperatureF: 71,
          apparentTemperatureF: 70,
          precipitationChance: 10,
          windMph: 8,
          weatherCode: 1,
          condition: "mostly clear",
        },
        {
          hour: "18",
          temperatureF: 66,
          apparentTemperatureF: 65,
          precipitationChance: 10,
          windMph: 6,
          weatherCode: 1,
          condition: "mostly clear",
        },
      ]),
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
      forecastPeriods: savedForecastPeriods([
        {
          hour: "06",
          temperatureF: 53,
          apparentTemperatureF: 52,
          precipitationChance: 0,
          windMph: 4,
          weatherCode: 0,
          condition: "clear",
        },
        {
          hour: "10",
          temperatureF: 69,
          apparentTemperatureF: 68,
          precipitationChance: 0,
          windMph: 8,
          weatherCode: 0,
          condition: "clear",
        },
        {
          hour: "14",
          temperatureF: 83,
          apparentTemperatureF: 82,
          precipitationChance: 5,
          windMph: 14,
          weatherCode: 1,
          condition: "mostly clear",
        },
        {
          hour: "18",
          temperatureF: 76,
          apparentTemperatureF: 75,
          precipitationChance: 5,
          windMph: 12,
          weatherCode: 1,
          condition: "mostly clear",
        },
      ]),
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
      forecastPeriods: savedForecastPeriods([
        {
          hour: "06",
          temperatureF: 46,
          apparentTemperatureF: 44,
          precipitationChance: 10,
          windMph: 3,
          weatherCode: 2,
          condition: "partly cloudy",
        },
        {
          hour: "10",
          temperatureF: 59,
          apparentTemperatureF: 58,
          precipitationChance: 15,
          windMph: 5,
          weatherCode: 2,
          condition: "partly cloudy",
        },
        {
          hour: "14",
          temperatureF: 69,
          apparentTemperatureF: 68,
          precipitationChance: 20,
          windMph: 8,
          weatherCode: 2,
          condition: "partly cloudy",
        },
        {
          hour: "18",
          temperatureF: 64,
          apparentTemperatureF: 63,
          precipitationChance: 20,
          windMph: 7,
          weatherCode: 2,
          condition: "partly cloudy",
        },
      ]),
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
      forecastPeriods: savedForecastPeriods([
        {
          hour: "06",
          temperatureF: 44,
          apparentTemperatureF: 42,
          precipitationChance: 5,
          windMph: 3,
          weatherCode: 1,
          condition: "mostly clear",
        },
        {
          hour: "10",
          temperatureF: 61,
          apparentTemperatureF: 59,
          precipitationChance: 5,
          windMph: 5,
          weatherCode: 0,
          condition: "clear",
        },
        {
          hour: "14",
          temperatureF: 74,
          apparentTemperatureF: 73,
          precipitationChance: 10,
          windMph: 10,
          weatherCode: 1,
          condition: "mostly clear",
        },
        {
          hour: "18",
          temperatureF: 67,
          apparentTemperatureF: 66,
          precipitationChance: 10,
          windMph: 8,
          weatherCode: 1,
          condition: "mostly clear",
        },
      ]),
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
