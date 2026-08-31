import type {
  DaylightContext,
  RetrievalStatus,
  WeatherContext,
  WeatherForecastPeriod,
} from "@/features/trailpack/types";
import {
  discardBody,
  readTextWithinLimit,
} from "@/features/trailpack/lib/read-text-with-limit";

const WEATHER_ROUTE = "/api/trailpack/weather";
const REQUEST_ERROR_MESSAGE =
  "TrailPack could not load the live weather forecast.";
const WEATHER_CONDITIONS = new Set<WeatherContext["conditions"][number]>([
  "heat",
  "cold",
  "rain",
  "wind",
  "snow",
  "sun",
]);
const RETRIEVAL_STATUSES = new Set<RetrievalStatus>([
  "live",
  "saved-fixture",
  "unavailable",
]);
const MAX_STRING_LENGTH = 2_000;
const MAX_FORECAST_PERIODS = 24;
const MAX_RESPONSE_BYTES = 64_000;

interface RequestTrailWeatherOptions {
  plannedDate?: string;
  fetchImpl?: typeof fetch;
  signal?: AbortSignal;
}

export async function requestTrailWeather(
  trailId: string,
  options: RequestTrailWeatherOptions = {},
): Promise<WeatherContext> {
  const params = new URLSearchParams({ trailId });
  if (options.plannedDate) {
    params.set("date", options.plannedDate);
  }

  let response: Response;
  try {
    response = await (options.fetchImpl ?? fetch)(
      `${WEATHER_ROUTE}?${params.toString()}`,
      {
        method: "GET",
        cache: "no-store",
        signal: options.signal,
      },
    );
  } catch {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  if (!response.ok) {
    await discardBody(response);
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  let responseBody: unknown;
  try {
    const responseRead = await readTextWithinLimit(response, MAX_RESPONSE_BYTES);
    if (responseRead.status !== "ok") {
      throw new Error(REQUEST_ERROR_MESSAGE);
    }
    responseBody = JSON.parse(responseRead.text);
  } catch {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  const weather = parseWeatherContextResponse(responseBody);
  if (!weather) {
    throw new Error(REQUEST_ERROR_MESSAGE);
  }

  return weather;
}

export function parseWeatherContextResponse(
  value: unknown,
): WeatherContext | null {
  if (
    !isRecord(value) ||
    !isRequiredString(value.summary) ||
    value.source !== "open-meteo" ||
    value.label !== "forecast-based" ||
    !isRetrievalStatus(value.retrievalStatus) ||
    !isOptionalIsoDate(value.plannedDate) ||
    !isOptionalString(value.timezone, 100) ||
    !isOptionalString(value.statusReason, 500) ||
    !isOptionalNumber(value.precipitationChance, 0, 100) ||
    !isOptionalNumber(value.windMph, 0, 300) ||
    !isWeatherConditions(value.conditions)
  ) {
    return null;
  }

  const temperatureF = parseTemperature(value.temperatureF);
  if (temperatureF === null) {
    return null;
  }

  const daylight = parseDaylight(value.daylight);
  if (daylight === null) {
    return null;
  }

  const forecastPeriods = parseForecastPeriods(value.forecastPeriods);
  if (forecastPeriods === null) {
    return null;
  }

  return {
    plannedDate: value.plannedDate,
    timezone: value.timezone,
    summary: value.summary,
    temperatureF,
    precipitationChance: value.precipitationChance,
    windMph: value.windMph,
    conditions: [...value.conditions],
    source: "open-meteo",
    label: "forecast-based",
    retrievalStatus: value.retrievalStatus,
    statusReason: value.statusReason,
    daylight,
    forecastPeriods,
  };
}

function parseTemperature(
  value: unknown,
): WeatherContext["temperatureF"] | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    !isRecord(value) ||
    !isOptionalNumber(value.high, -150, 150) ||
    !isOptionalNumber(value.low, -150, 150) ||
    !isOptionalNumber(value.current, -150, 150)
  ) {
    return null;
  }

  return {
    high: value.high,
    low: value.low,
    current: value.current,
  };
}

function parseForecastPeriods(
  value: unknown,
): WeatherForecastPeriod[] | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    !Array.isArray(value) ||
    value.length > MAX_FORECAST_PERIODS
  ) {
    return null;
  }

  const periods: WeatherForecastPeriod[] = [];
  for (const period of value) {
    if (
      !isRecord(period) ||
      !isForecastTime(period.time) ||
      !isRequiredString(period.condition, 100) ||
      !isOptionalNumber(period.temperatureF, -150, 150) ||
      !isOptionalNumber(period.apparentTemperatureF, -150, 150) ||
      !isOptionalNumber(period.precipitationChance, 0, 100) ||
      !isOptionalNumber(period.windMph, 0, 300) ||
      !isOptionalInteger(period.weatherCode, 0, 99)
    ) {
      return null;
    }

    periods.push({
      time: period.time,
      temperatureF: period.temperatureF,
      apparentTemperatureF: period.apparentTemperatureF,
      precipitationChance: period.precipitationChance,
      windMph: period.windMph,
      weatherCode: period.weatherCode,
      condition: period.condition,
    });
  }

  return periods;
}

function parseDaylight(
  value: unknown,
): DaylightContext | null | undefined {
  if (value === undefined) {
    return undefined;
  }

  if (
    !isRecord(value) ||
    value.source !== "sunrise-sunset" ||
    !isOptionalRetrievalStatus(value.retrievalStatus) ||
    !isOptionalIsoDate(value.date) ||
    !isOptionalString(value.sunrise, 100) ||
    !isOptionalString(value.sunset, 100) ||
    !isOptionalString(value.civilTwilightBegin, 100) ||
    !isOptionalString(value.civilTwilightEnd, 100) ||
    !isOptionalNumber(value.dayLengthSeconds, 0, 86_400) ||
    !isOptionalString(value.timezone, 100) ||
    !isOptionalString(value.statusReason, 500)
  ) {
    return null;
  }

  return {
    date: value.date,
    sunrise: value.sunrise,
    sunset: value.sunset,
    civilTwilightBegin: value.civilTwilightBegin,
    civilTwilightEnd: value.civilTwilightEnd,
    dayLengthSeconds: value.dayLengthSeconds,
    timezone: value.timezone,
    source: "sunrise-sunset",
    retrievalStatus: value.retrievalStatus,
    statusReason: value.statusReason,
  };
}

function isWeatherConditions(
  value: unknown,
): value is WeatherContext["conditions"] {
  return (
    Array.isArray(value) &&
    value.length <= WEATHER_CONDITIONS.size &&
    value.every(
      (condition) =>
        typeof condition === "string" &&
        WEATHER_CONDITIONS.has(
          condition as WeatherContext["conditions"][number],
        ),
    )
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isRequiredString(
  value: unknown,
  maxLength = MAX_STRING_LENGTH,
): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= maxLength
  );
}

function isOptionalString(
  value: unknown,
  maxLength = MAX_STRING_LENGTH,
): value is string | undefined {
  return (
    value === undefined ||
    (typeof value === "string" && value.length <= maxLength)
  );
}

function isOptionalNumber(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number | undefined {
  return (
    value === undefined ||
    (typeof value === "number" &&
      Number.isFinite(value) &&
      value >= minimum &&
      value <= maximum)
  );
}

function isOptionalInteger(
  value: unknown,
  minimum: number,
  maximum: number,
): value is number | undefined {
  return (
    isOptionalNumber(value, minimum, maximum) &&
    (value === undefined || Number.isInteger(value))
  );
}

function isRetrievalStatus(value: unknown): value is RetrievalStatus {
  return (
    typeof value === "string" &&
    RETRIEVAL_STATUSES.has(value as RetrievalStatus)
  );
}

function isOptionalRetrievalStatus(
  value: unknown,
): value is RetrievalStatus | undefined {
  return value === undefined || isRetrievalStatus(value);
}

function isOptionalIsoDate(value: unknown): value is string | undefined {
  return value === undefined || (typeof value === "string" && isIsoDate(value));
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const parsed = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(parsed.getTime()) &&
    parsed.toISOString().slice(0, 10) === value
  );
}

function isForecastTime(value: unknown): value is string {
  if (typeof value !== "string") {
    return false;
  }

  const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match || !isIsoDate(match[1])) {
    return false;
  }

  const hour = Number(match[2]);
  const minute = Number(match[3]);
  return hour >= 0 && hour <= 23 && minute >= 0 && minute <= 59;
}
