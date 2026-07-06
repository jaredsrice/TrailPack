import { getDemoScenario } from "@/features/trailpack/data/demo-contexts";
import {
  getSupportedParkForTrail,
  SUPPORTED_PARKS,
  SUPPORTED_TRAILS,
} from "@/features/trailpack/data/supported-trails";
import type { AlertContext, WeatherContext } from "@/features/trailpack/types";

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

interface OpenMeteoForecastResponse {
  current?: {
    temperature_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    weathercode?: number;
  };
  daily?: {
    time?: string[];
    temperature_2m_max?: number[];
    temperature_2m_min?: number[];
    precipitation_probability_max?: number[];
    wind_speed_10m_max?: number[];
    weather_code?: number[];
    weathercode?: number[];
  };
}

interface NpsAlertsResponse {
  total?: string | number;
  data?: Array<{
    title?: string;
    description?: string;
    category?: string;
    url?: string;
  }>;
}

const OPEN_METEO_FORECAST_URL = "https://api.open-meteo.com/v1/forecast";
const NPS_ALERTS_URL = "https://developer.nps.gov/api/v1/alerts";
const SUPPORTED_PARK_CODES = new Set(SUPPORTED_PARKS.map((park) => park.parkCode));

const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);

function firstNumber(values: number[] | undefined): number | undefined {
  const value = values?.[0];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function addCondition(
  conditions: WeatherContext["conditions"],
  condition: WeatherContext["conditions"][number],
) {
  if (!conditions.includes(condition)) {
    conditions.push(condition);
  }
}

function weatherCodeDescription(code: number | undefined): string {
  if (code === undefined) {
    return "forecast context available";
  }

  if (SNOW_CODES.has(code)) {
    return "snow possible";
  }

  if (RAIN_CODES.has(code)) {
    return "rain likely";
  }

  if (code === 0 || code === 1) {
    return "mostly clear";
  }

  if (code === 2 || code === 3) {
    return "partly cloudy";
  }

  if (code >= 45 && code <= 48) {
    return "fog possible";
  }

  return "forecast context available";
}

function round(value: number | undefined): number | undefined {
  return value === undefined ? undefined : Math.round(value);
}

function buildWeatherSummary({
  high,
  low,
  precipitationChance,
  windMph,
  weatherCode,
}: {
  high?: number;
  low?: number;
  precipitationChance?: number;
  windMph?: number;
  weatherCode?: number;
}): string {
  const parts: string[] = [];

  if (high !== undefined) {
    parts.push(`${high}°F high`);
  }

  if (low !== undefined) {
    parts.push(`${low}°F low`);
  }

  if (precipitationChance !== undefined) {
    parts.push(`${precipitationChance}% precipitation chance`);
  }

  if (windMph !== undefined) {
    parts.push(`wind up to ${windMph} mph`);
  }

  const context = weatherCodeDescription(weatherCode);
  const details = parts.length > 0 ? parts.join(", ") : "limited forecast values";
  return `Open-Meteo forecast: ${details}; ${context}.`;
}

export function buildWeatherContextFromOpenMeteoResponse(
  response: OpenMeteoForecastResponse,
  plannedDate?: string,
): WeatherContext {
  const daily = response.daily ?? {};
  const current = response.current ?? {};
  const high = round(firstNumber(daily.temperature_2m_max));
  const low = round(firstNumber(daily.temperature_2m_min));
  const currentTemperature = round(current.temperature_2m);
  const precipitationChance = round(firstNumber(daily.precipitation_probability_max));
  const windMph = round(firstNumber(daily.wind_speed_10m_max) ?? current.wind_speed_10m);
  const weatherCode =
    firstNumber(daily.weather_code) ??
    firstNumber(daily.weathercode) ??
    current.weather_code ??
    current.weathercode;

  const conditions: WeatherContext["conditions"] = [];

  if ((high ?? Number.NEGATIVE_INFINITY) >= 80 || (currentTemperature ?? 0) >= 75) {
    addCondition(conditions, "heat");
  }

  if ((low ?? Number.POSITIVE_INFINITY) <= 40 || (currentTemperature ?? 100) <= 40) {
    addCondition(conditions, "cold");
  }

  if ((precipitationChance ?? 0) >= 40 || RAIN_CODES.has(weatherCode ?? -1)) {
    addCondition(conditions, "rain");
  }

  if (SNOW_CODES.has(weatherCode ?? -1)) {
    addCondition(conditions, "snow");
  }

  if ((windMph ?? 0) >= 20) {
    addCondition(conditions, "wind");
  }

  if (weatherCode === 0 || weatherCode === 1 || conditions.includes("heat")) {
    addCondition(conditions, "sun");
  }

  return {
    plannedDate: plannedDate ?? daily.time?.[0],
    summary: buildWeatherSummary({
      high,
      low,
      precipitationChance,
      windMph,
      weatherCode,
    }),
    temperatureF: {
      high,
      low,
      current: currentTemperature,
    },
    precipitationChance,
    windMph,
    conditions,
    source: "open-meteo",
    label: "forecast-based",
    retrievalStatus: "live",
  };
}

export function buildSavedWeatherFallback(trailId: string): WeatherContext | null {
  const scenario = getDemoScenario(trailId);
  if (!scenario) {
    return null;
  }

  return {
    ...scenario.weather,
    retrievalStatus: "saved-fixture",
    statusReason: "Using saved demo weather because live weather is unavailable.",
  };
}

export async function fetchOpenMeteoWeatherContext(
  trailId: string,
  fetcher: Fetcher = fetch,
): Promise<WeatherContext | null> {
  const trail = SUPPORTED_TRAILS[trailId];
  const fallback = buildSavedWeatherFallback(trailId);

  if (!trail?.coordinates) {
    return fallback;
  }

  const url = new URL(OPEN_METEO_FORECAST_URL);
  url.searchParams.set("latitude", String(trail.coordinates.lat));
  url.searchParams.set("longitude", String(trail.coordinates.lng));
  url.searchParams.set(
    "current",
    "temperature_2m,wind_speed_10m,weather_code",
  );
  url.searchParams.set(
    "daily",
    "temperature_2m_max,temperature_2m_min,precipitation_probability_max,wind_speed_10m_max,weather_code",
  );
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  url.searchParams.set("forecast_days", "1");
  url.searchParams.set("timezone", "auto");

  try {
    const response = await fetcher(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return fallback;
    }

    return buildWeatherContextFromOpenMeteoResponse(
      (await response.json()) as OpenMeteoForecastResponse,
    );
  } catch {
    return fallback;
  }
}

function normalizeParkCode(parkCode: string | null | undefined): string | null {
  if (!parkCode) {
    return null;
  }

  const normalized = parkCode.trim().toLowerCase();
  return /^[a-z]{4}$/.test(normalized) ? normalized : null;
}

export function resolveSupportedParkCode({
  trailId,
  parkCode,
}: {
  trailId?: string | null;
  parkCode?: string | null;
}): string | null {
  const normalizedParkCode = normalizeParkCode(parkCode);
  if (normalizedParkCode && SUPPORTED_PARK_CODES.has(normalizedParkCode)) {
    return normalizedParkCode;
  }

  if (!trailId) {
    return null;
  }

  return getSupportedParkForTrail(trailId)?.parkCode ?? null;
}

function cleanSourceUrl(url: string | undefined): string | undefined {
  if (!url) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (
      parsed.protocol === "https:" &&
      (host === "nps.gov" || host.endsWith(".nps.gov"))
    ) {
      return parsed.toString();
    }
  } catch {
    return undefined;
  }

  return undefined;
}

function mapNpsAlertSeverity(
  category: string | undefined,
  title: string,
): AlertContext["alerts"][number]["severity"] {
  const text = `${category ?? ""} ${title}`.toLowerCase();

  if (text.includes("closure") || text.includes("closed")) {
    return "closure";
  }

  if (
    text.includes("caution") ||
    text.includes("warning") ||
    text.includes("danger") ||
    text.includes("advisory")
  ) {
    return "caution";
  }

  return "info";
}

export function buildAlertContextFromNpsResponse(
  response: NpsAlertsResponse,
): AlertContext {
  const data = Array.isArray(response.data) ? response.data : [];
  const alerts = data
    .map((alert) => {
      const title = alert.title?.trim() || "NPS alert";
      return {
        title,
        description: alert.description?.trim() || "No alert description provided.",
        severity: mapNpsAlertSeverity(alert.category, title),
        source: "NPS" as const,
        sourceUrl: cleanSourceUrl(alert.url),
      };
    })
    .filter((alert) => alert.title.length > 0);

  return {
    hasActiveAlerts: alerts.length > 0,
    alerts,
    label: "official",
    retrievalStatus: "live",
  };
}

export function buildSavedAlertFallback(parkCode: string): AlertContext {
  const supportedPark = SUPPORTED_PARKS.find((park) => park.parkCode === parkCode);

  return {
    hasActiveAlerts: false,
    alerts: [],
    label: "unavailable",
    retrievalStatus: "saved-fixture",
    statusReason: supportedPark
      ? `Using saved ${supportedPark.name} alert fixture because live NPS alerts are unavailable.`
      : "Using saved alert fixture because live NPS alerts are unavailable.",
  };
}

function buildMissingNpsKeyContext(): AlertContext {
  return {
    hasActiveAlerts: false,
    alerts: [],
    label: "unavailable",
    retrievalStatus: "unavailable",
    statusReason: "NPS API key is not configured for this environment.",
  };
}

export async function fetchNpsAlertContext(
  parkCode: string,
  apiKey: string | undefined,
  fetcher: Fetcher = fetch,
): Promise<AlertContext> {
  const normalizedParkCode = normalizeParkCode(parkCode);
  if (!normalizedParkCode || !SUPPORTED_PARK_CODES.has(normalizedParkCode)) {
    return {
      ...buildMissingNpsKeyContext(),
      statusReason: "Unsupported or invalid NPS park code.",
    };
  }

  if (!apiKey?.trim()) {
    return buildMissingNpsKeyContext();
  }

  const url = new URL(NPS_ALERTS_URL);
  url.searchParams.set("parkCode", normalizedParkCode);
  url.searchParams.set("limit", "10");

  try {
    const response = await fetcher(url, {
      headers: {
        Accept: "application/json",
        "X-Api-Key": apiKey,
      },
    });

    if (!response.ok) {
      return buildSavedAlertFallback(normalizedParkCode);
    }

    return buildAlertContextFromNpsResponse(
      (await response.json()) as NpsAlertsResponse,
    );
  } catch {
    return buildSavedAlertFallback(normalizedParkCode);
  }
}
