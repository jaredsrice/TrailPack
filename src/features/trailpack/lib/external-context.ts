import { getDemoScenario } from "@/features/trailpack/data/demo-contexts";
import {
  getSupportedParkForTrail,
  SUPPORTED_PARKS,
  TRAIL_CATALOG,
} from "@/features/trailpack/data/supported-trails";
import type {
  AlertContext,
  DaylightContext,
  WeatherContext,
  WeatherForecastPeriod,
} from "@/features/trailpack/types";

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
}>;

interface OpenMeteoForecastResponse {
  timezone?: string;
  current?: {
    temperature_2m?: number;
    wind_speed_10m?: number;
    weather_code?: number;
    weathercode?: number;
  };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    apparent_temperature?: number[];
    precipitation_probability?: number[];
    wind_speed_10m?: number[];
    weather_code?: number[];
    weathercode?: number[];
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

interface SunriseSunsetResponse {
  status?: string;
  tzid?: string;
  results?: {
    sunrise?: string;
    sunset?: string;
    day_length?: number;
    civil_twilight_begin?: string;
    civil_twilight_end?: string;
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
const SUNRISE_SUNSET_URL = "https://api.sunrise-sunset.org/json";
const NPS_ALERTS_URL = "https://developer.nps.gov/api/v1/alerts";
const NPS_REQUEST_TIMEOUT_MS = 8_000;
const SUPPORTED_PARK_CODES = new Set(SUPPORTED_PARKS.map((park) => park.parkCode));

const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const MAX_HOURLY_FORECAST_PERIODS = 24;

function firstNumber(values: number[] | undefined): number | undefined {
  const value = values?.[0];
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function numberAt(
  values: number[] | undefined,
  index: number,
): number | undefined {
  const value = values?.[index];
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

  if (code === 0) return "clear";
  if (code === 1) return "mostly clear";
  if (code === 2) return "partly cloudy";
  if (code === 3) return "overcast";
  if (code === 45 || code === 48) return "fog possible";
  if (code >= 51 && code <= 55) return "drizzle possible";
  if (code === 56 || code === 57) return "freezing drizzle possible";
  if (code >= 61 && code <= 65) return "rain likely";
  if (code === 66 || code === 67) return "freezing rain possible";
  if (code >= 71 && code <= 75) return "snow possible";
  if (code === 77) return "snow grains possible";
  if (code >= 80 && code <= 82) return "rain showers possible";
  if (code === 85 || code === 86) return "snow showers possible";
  if (code === 95) return "thunderstorms possible";
  if (code === 96 || code === 99) return "thunderstorms with hail possible";
  return "forecast context available";
}

function round(value: number | undefined): number | undefined {
  return value === undefined ? undefined : Math.round(value);
}

function buildForecastPeriods(
  hourly: OpenMeteoForecastResponse["hourly"],
  plannedDate: string | undefined,
): WeatherForecastPeriod[] {
  if (!plannedDate || !Array.isArray(hourly?.time)) {
    return [];
  }

  const periods: WeatherForecastPeriod[] = [];
  const datePrefix = `${plannedDate}T`;

  for (const [index, time] of hourly.time.entries()) {
    if (
      periods.length >= MAX_HOURLY_FORECAST_PERIODS ||
      typeof time !== "string" ||
      !time.startsWith(datePrefix)
    ) {
      continue;
    }

    const temperatureF = round(numberAt(hourly.temperature_2m, index));
    const apparentTemperatureF = round(
      numberAt(hourly.apparent_temperature, index),
    );
    const precipitationChance = round(
      numberAt(hourly.precipitation_probability, index),
    );
    const windMph = round(numberAt(hourly.wind_speed_10m, index));
    const weatherCode =
      numberAt(hourly.weather_code, index) ??
      numberAt(hourly.weathercode, index);

    if (
      temperatureF === undefined &&
      apparentTemperatureF === undefined &&
      precipitationChance === undefined &&
      windMph === undefined &&
      weatherCode === undefined
    ) {
      continue;
    }

    periods.push({
      time,
      temperatureF,
      apparentTemperatureF,
      precipitationChance,
      windMph,
      weatherCode,
      condition: weatherCodeDescription(weatherCode),
    });
  }

  return periods;
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
  const forecastDate = plannedDate ?? daily.time?.[0];
  const forecastPeriods = buildForecastPeriods(response.hourly, forecastDate);

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
    plannedDate: forecastDate,
    timezone: response.timezone,
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
    forecastPeriods,
  };
}

export function buildDaylightContextFromSunriseSunsetResponse(
  response: SunriseSunsetResponse,
  date?: string,
): DaylightContext | null {
  if (response.status !== "OK") {
    return null;
  }

  const results = response.results ?? {};
  if (!results.sunset || !results.civil_twilight_end) {
    return null;
  }

  return {
    date,
    sunrise: results.sunrise,
    sunset: results.sunset,
    civilTwilightBegin: results.civil_twilight_begin,
    civilTwilightEnd: results.civil_twilight_end,
    dayLengthSeconds: results.day_length,
    timezone: response.tzid,
    source: "sunrise-sunset",
    retrievalStatus: "live",
  };
}

export function buildSavedWeatherFallback(
  trailId: string,
  plannedDate?: string,
): WeatherContext | null {
  const scenario = getDemoScenario(trailId);
  if (!scenario) {
    return null;
  }

  const forecastPeriods = plannedDate
    ? scenario.weather.forecastPeriods?.map((period) => ({
        ...period,
        time: period.time.includes("T")
          ? `${plannedDate}${period.time.slice(period.time.indexOf("T"))}`
          : period.time,
      }))
    : scenario.weather.forecastPeriods;
  const daylight =
    plannedDate && plannedDate !== scenario.weather.daylight?.date
      ? undefined
      : scenario.weather.daylight;

  return {
    ...scenario.weather,
    plannedDate: plannedDate ?? scenario.weather.plannedDate,
    forecastPeriods,
    daylight,
    retrievalStatus: "saved-fixture",
    statusReason: plannedDate
      ? `Live weather is unavailable for ${plannedDate}; these are saved example conditions, not that day's forecast.`
      : "Using saved example conditions because live weather is unavailable.",
  };
}

async function fetchSunriseSunsetDaylightContext({
  lat,
  lng,
  date,
  timezone,
  fetcher,
}: {
  lat: number;
  lng: number;
  date?: string;
  timezone?: string;
  fetcher: Fetcher;
}): Promise<DaylightContext | null> {
  if (!date) {
    return null;
  }

  const url = new URL(SUNRISE_SUNSET_URL);
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lng", String(lng));
  url.searchParams.set("date", date);
  url.searchParams.set("formatted", "0");
  if (timezone) {
    url.searchParams.set("tzid", timezone);
  }

  try {
    const response = await fetcher(url, {
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return null;
    }

    return buildDaylightContextFromSunriseSunsetResponse(
      (await response.json()) as SunriseSunsetResponse,
      date,
    );
  } catch {
    return null;
  }
}

export async function fetchOpenMeteoWeatherContext(
  trailId: string,
  {
    plannedDate,
    fetcher = fetch,
  }: {
    plannedDate?: string;
    fetcher?: Fetcher;
  } = {},
): Promise<WeatherContext | null> {
  const trail = TRAIL_CATALOG[trailId];
  const fallback = buildSavedWeatherFallback(trailId, plannedDate);

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
  url.searchParams.set(
    "hourly",
    "temperature_2m,apparent_temperature,precipitation_probability,wind_speed_10m,weather_code",
  );
  url.searchParams.set("temperature_unit", "fahrenheit");
  url.searchParams.set("wind_speed_unit", "mph");
  if (plannedDate) {
    url.searchParams.set("start_date", plannedDate);
    url.searchParams.set("end_date", plannedDate);
  } else {
    url.searchParams.set("forecast_days", "1");
  }
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

    const weather = buildWeatherContextFromOpenMeteoResponse(
      (await response.json()) as OpenMeteoForecastResponse,
      plannedDate,
    );
    const daylight = await fetchSunriseSunsetDaylightContext({
      lat: trail.coordinates.lat,
      lng: trail.coordinates.lng,
      date: weather.plannedDate,
      timezone: weather.timezone,
      fetcher,
    });

    return daylight ? { ...weather, daylight } : weather;
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
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    NPS_REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetcher(url, {
      headers: {
        Accept: "application/json",
        "X-Api-Key": apiKey,
      },
      signal: timeoutController.signal,
    });

    if (!response.ok) {
      return buildSavedAlertFallback(normalizedParkCode);
    }

    return buildAlertContextFromNpsResponse(
      (await response.json()) as NpsAlertsResponse,
    );
  } catch {
    return buildSavedAlertFallback(normalizedParkCode);
  } finally {
    clearTimeout(timeoutId);
  }
}
