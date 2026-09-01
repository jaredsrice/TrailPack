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
import { readTextWithinLimit } from "@/features/trailpack/lib/read-text-with-limit";

type Fetcher = (
  input: RequestInfo | URL,
  init?: RequestInit,
) => Promise<{
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
  body?: ReadableStream<Uint8Array> | null;
  headers?: Headers;
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
const EXTERNAL_REQUEST_TIMEOUT_MS = 8_000;
const NPS_ALERT_REQUEST_TIMEOUT_MS = 5_000;
const MAX_WEATHER_RESPONSE_BYTES = 256_000;
const MAX_DAYLIGHT_RESPONSE_BYTES = 32_000;
const MAX_NPS_RESPONSE_BYTES = 128_000;
const MAX_ALERTS = 10;
const MAX_PROVIDER_TEXT_LENGTH = 2_000;
const SUPPORTED_PARK_CODES = new Set(SUPPORTED_PARKS.map((park) => park.parkCode));

const RAIN_CODES = new Set([
  51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99,
]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const MAX_HOURLY_FORECAST_PERIODS = 24;

function firstNumber(
  values: number[] | undefined,
  minimum = Number.NEGATIVE_INFINITY,
  maximum = Number.POSITIVE_INFINITY,
  integer = false,
): number | undefined {
  const value = values?.[0];
  return boundedNumber(value, minimum, maximum, integer);
}

function numberAt(
  values: number[] | undefined,
  index: number,
  minimum = Number.NEGATIVE_INFINITY,
  maximum = Number.POSITIVE_INFINITY,
  integer = false,
): number | undefined {
  const value = values?.[index];
  return boundedNumber(value, minimum, maximum, integer);
}

function boundedNumber(
  value: unknown,
  minimum: number,
  maximum: number,
  integer = false,
): number | undefined {
  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= minimum &&
    value <= maximum &&
    (!integer || Number.isInteger(value))
    ? value
    : undefined;
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
      !time.startsWith(datePrefix) ||
      !isForecastLocalTime(time)
    ) {
      continue;
    }

    const temperatureF = round(
      numberAt(hourly.temperature_2m, index, -150, 150),
    );
    const apparentTemperatureF = round(
      numberAt(hourly.apparent_temperature, index, -150, 150),
    );
    const precipitationChance = round(
      numberAt(hourly.precipitation_probability, index, 0, 100),
    );
    const windMph = round(numberAt(hourly.wind_speed_10m, index, 0, 300));
    const weatherCode =
      numberAt(hourly.weather_code, index, 0, 99, true) ??
      numberAt(hourly.weathercode, index, 0, 99, true);

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
  const high = round(firstNumber(daily.temperature_2m_max, -150, 150));
  const low = round(firstNumber(daily.temperature_2m_min, -150, 150));
  const currentTemperature = round(
    boundedNumber(current.temperature_2m, -150, 150),
  );
  const precipitationChance = round(
    firstNumber(daily.precipitation_probability_max, 0, 100),
  );
  const windMph = round(
    firstNumber(daily.wind_speed_10m_max, 0, 300) ??
      boundedNumber(current.wind_speed_10m, 0, 300),
  );
  const weatherCode =
    firstNumber(daily.weather_code, 0, 99, true) ??
    firstNumber(daily.weathercode, 0, 99, true) ??
    boundedNumber(current.weather_code, 0, 99, true) ??
    boundedNumber(current.weathercode, 0, 99, true);
  const dailyDate = daily.time?.[0];
  const forecastDate = isIsoDate(plannedDate)
    ? plannedDate
    : isIsoDate(dailyDate)
      ? dailyDate
      : undefined;
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
    timezone: boundedProviderText(response.timezone, 100),
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

function hasUsableOpenMeteoData(
  response: OpenMeteoForecastResponse,
  plannedDate?: string,
): boolean {
  const daily = response.daily ?? {};
  const current = response.current ?? {};
  const dailyDate = daily.time?.[0];
  const forecastDate = isIsoDate(plannedDate)
    ? plannedDate
    : isIsoDate(dailyDate)
      ? dailyDate
      : undefined;

  return (
    firstNumber(daily.temperature_2m_max, -150, 150) !== undefined ||
    firstNumber(daily.temperature_2m_min, -150, 150) !== undefined ||
    firstNumber(daily.precipitation_probability_max, 0, 100) !== undefined ||
    firstNumber(daily.wind_speed_10m_max, 0, 300) !== undefined ||
    firstNumber(daily.weather_code, 0, 99, true) !== undefined ||
    firstNumber(daily.weathercode, 0, 99, true) !== undefined ||
    boundedNumber(current.temperature_2m, -150, 150) !== undefined ||
    boundedNumber(current.wind_speed_10m, 0, 300) !== undefined ||
    boundedNumber(current.weather_code, 0, 99, true) !== undefined ||
    boundedNumber(current.weathercode, 0, 99, true) !== undefined ||
    buildForecastPeriods(response.hourly, forecastDate).length > 0
  );
}

export function buildDaylightContextFromSunriseSunsetResponse(
  response: SunriseSunsetResponse,
  date?: string,
): DaylightContext | null {
  if (response.status !== "OK") {
    return null;
  }

  const results = response.results ?? {};
  const sunrise = boundedIsoDateTime(results.sunrise);
  const sunset = boundedIsoDateTime(results.sunset);
  const civilTwilightBegin = boundedIsoDateTime(
    results.civil_twilight_begin,
  );
  const civilTwilightEnd = boundedIsoDateTime(results.civil_twilight_end);
  const dayLengthSeconds = boundedNumber(results.day_length, 0, 86_400, true);
  if (
    !sunset ||
    !civilTwilightEnd ||
    (results.sunrise !== undefined && !sunrise) ||
    (results.civil_twilight_begin !== undefined && !civilTwilightBegin) ||
    (results.day_length !== undefined && dayLengthSeconds === undefined)
  ) {
    return null;
  }

  return {
    date: isIsoDate(date) ? date : undefined,
    sunrise,
    sunset,
    civilTwilightBegin,
    civilTwilightEnd,
    dayLengthSeconds,
    timezone: boundedProviderText(response.tzid, 100),
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

async function withExternalRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = EXTERNAL_REQUEST_TIMEOUT_MS,
): Promise<T> {
  const timeoutController = new AbortController();
  const timeoutId = setTimeout(
    () => timeoutController.abort(),
    timeoutMs,
  );

  try {
    return await operation(timeoutController.signal);
  } finally {
    clearTimeout(timeoutId);
  }
}

async function readBoundedProviderJson(
  response: {
    json: () => Promise<unknown>;
    body?: ReadableStream<Uint8Array> | null;
    headers?: Headers;
  },
  maximumBytes: number,
): Promise<unknown> {
  if ("body" in response && response.headers) {
    const responseRead = await readTextWithinLimit(
      {
        body: response.body ?? null,
        headers: response.headers,
      },
      maximumBytes,
    );
    if (responseRead.status !== "ok") {
      throw new Error("External provider response was not readable.");
    }
    return JSON.parse(responseRead.text);
  }

  // Test doubles and non-Fetch adapters may expose only json(). Production
  // Response objects always take the byte-bounded branch above.
  return response.json();
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
    const responseBody = await withExternalRequestTimeout(async (signal) => {
      const response = await fetcher(url, {
        headers: {
          Accept: "application/json",
        },
        signal,
      });

      if (!response.ok) {
        return null;
      }

      return readBoundedProviderJson(response, MAX_DAYLIGHT_RESPONSE_BYTES);
    });
    if (!isRecord(responseBody)) {
      return null;
    }

    return buildDaylightContextFromSunriseSunsetResponse(
      responseBody as SunriseSunsetResponse,
      date,
    );
  } catch {
    return null;
  }
}

function boundedProviderText(
  value: unknown,
  maximumLength: number,
): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }

  const normalized = value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .trim()
    .slice(0, maximumLength);
  return normalized || undefined;
}

function boundedIsoDateTime(value: unknown): string | undefined {
  const normalized = boundedProviderText(value, 100);
  if (
    !normalized ||
    !/^\d{4}-\d{2}-\d{2}T/.test(normalized) ||
    !Number.isFinite(Date.parse(normalized))
  ) {
    return undefined;
  }

  return normalized;
}

function isIsoDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function isForecastLocalTime(value: string): boolean {
  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match || !isIsoDate(match[1])) {
    return false;
  }

  const hour = Number(match[2]);
  const minute = Number(match[3]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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
    const responseBody = await withExternalRequestTimeout(async (signal) => {
      const response = await fetcher(url, {
        headers: {
          Accept: "application/json",
        },
        signal,
      });

      if (!response.ok) {
        return null;
      }

      return readBoundedProviderJson(response, MAX_WEATHER_RESPONSE_BYTES);
    });
    if (!isRecord(responseBody)) {
      return fallback;
    }

    const providerResponse = responseBody as OpenMeteoForecastResponse;
    if (!hasUsableOpenMeteoData(providerResponse, plannedDate)) {
      return fallback;
    }

    const weather = buildWeatherContextFromOpenMeteoResponse(
      providerResponse,
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
  const requestedTrailId = trailId?.trim();
  const requestedParkCode = parkCode?.trim();
  const normalizedParkCode = normalizeParkCode(parkCode);

  if (requestedTrailId && requestedParkCode) {
    const trailParkCode = getSupportedParkForTrail(requestedTrailId)?.parkCode;
    return trailParkCode &&
      normalizedParkCode === trailParkCode &&
      SUPPORTED_PARK_CODES.has(normalizedParkCode)
      ? normalizedParkCode
      : null;
  }

  if (
    normalizedParkCode &&
    SUPPORTED_PARK_CODES.has(normalizedParkCode)
  ) {
    return normalizedParkCode;
  }

  if (!requestedTrailId) {
    return null;
  }

  return getSupportedParkForTrail(requestedTrailId)?.parkCode ?? null;
}

function cleanSourceUrl(url: unknown): string | undefined {
  if (typeof url !== "string" || url.length > MAX_PROVIDER_TEXT_LENGTH) {
    return undefined;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (
      parsed.protocol === "https:" &&
      !parsed.username &&
      !parsed.password &&
      !parsed.port &&
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
    .slice(0, MAX_ALERTS)
    .filter(isRecord)
    .map((alert) => {
      const title = boundedProviderText(alert.title, MAX_PROVIDER_TEXT_LENGTH) ||
        "NPS alert";
      return {
        title,
        description:
          boundedProviderText(alert.description, MAX_PROVIDER_TEXT_LENGTH) ||
          "No alert description provided.",
        severity: mapNpsAlertSeverity(
          typeof alert.category === "string" ? alert.category : undefined,
          title,
        ),
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

export function buildSavedAlertFallback(): AlertContext {
  return {
    hasActiveAlerts: false,
    alerts: [],
    label: "unavailable",
    retrievalStatus: "saved-fixture",
    statusReason:
      "Live NPS alerts could not be checked. Check current NPS alerts directly before leaving.",
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
    const responseBody = await withExternalRequestTimeout(
      async (signal) => {
        const response = await fetcher(url, {
          headers: {
            Accept: "application/json",
            "X-Api-Key": apiKey,
          },
          signal,
        });

        if (!response.ok) {
          return null;
        }

        return readBoundedProviderJson(response, MAX_NPS_RESPONSE_BYTES);
      },
      NPS_ALERT_REQUEST_TIMEOUT_MS,
    );
    if (!isRecord(responseBody)) {
      return buildSavedAlertFallback();
    }

    return buildAlertContextFromNpsResponse(
      responseBody as NpsAlertsResponse,
    );
  } catch {
    return buildSavedAlertFallback();
  }
}
