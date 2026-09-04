import { describe, expect, it, vi } from "vitest";
import { DEMO_CONTEXTS } from "../data/demo-contexts";
import {
  parseWeatherContextResponse,
  requestTrailWeather,
} from "@/features/trailpack/lib/weather-client";

const WEATHER_RESPONSE = {
  plannedDate: "2026-07-28",
  timezone: "America/Denver",
  summary:
    "Open-Meteo forecast: 76°F high, 46°F low, 20% precipitation chance; partly cloudy.",
  temperatureF: {
    high: 76,
    low: 46,
    current: 58,
  },
  precipitationChance: 20,
  windMph: 11,
  conditions: ["sun"],
  source: "open-meteo",
  label: "forecast-based",
  retrievalStatus: "live",
  forecastPeriods: [
    {
      time: "2026-07-28T06:00",
      temperatureF: 46,
      apparentTemperatureF: 43,
      precipitationChance: 5,
      windMph: 3,
      weatherCode: 1,
      condition: "mostly clear",
    },
    {
      time: "2026-07-28T14:00",
      temperatureF: 76,
      apparentTemperatureF: 75,
      precipitationChance: 20,
      windMph: 11,
      weatherCode: 2,
      condition: "partly cloudy",
    },
  ],
  daylight: {
    date: "2026-07-28",
    sunrise: "2026-07-28T06:07:00-06:00",
    sunset: "2026-07-28T20:50:00-06:00",
    civilTwilightEnd: "2026-07-28T21:23:00-06:00",
    source: "sunrise-sunset",
    retrievalStatus: "live",
  },
} as const;

function asFetch(response: Response): typeof fetch {
  return vi.fn(async () => response) as unknown as typeof fetch;
}

function oversizedResponse(onCancel: () => void): Response {
  return new Response(
    new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode("x".repeat(70_000)));
      },
      cancel() {
        onCancel();
      },
    }),
  );
}

describe("weather route client", () => {
  it("requests live weather for the selected trail and date", async () => {
    const fetchImpl = asFetch(Response.json(WEATHER_RESPONSE));
    const controller = new AbortController();

    const weather = await requestTrailWeather("jenny-lake-loop", {
      plannedDate: "2026-07-28",
      fetchImpl,
      signal: controller.signal,
    });

    expect(weather.retrievalStatus).toBe("live");
    expect(weather.forecastPeriods).toHaveLength(2);

    const [url, init] = vi.mocked(fetchImpl).mock.calls[0];
    expect(url).toBe(
      "/api/trailpack/weather?trailId=jenny-lake-loop&date=2026-07-28",
    );
    expect(init).toMatchObject({
      method: "GET",
      cache: "no-store",
      signal: controller.signal,
    });
  });

  it("omits the date query parameter when the user has not chosen one", async () => {
    const fetchImpl = asFetch(Response.json(WEATHER_RESPONSE));

    await requestTrailWeather("jenny-lake-loop", { fetchImpl });

    expect(vi.mocked(fetchImpl).mock.calls[0]?.[0]).toBe(
      "/api/trailpack/weather?trailId=jenny-lake-loop",
    );
  });

  it("rejects malformed successful responses", async () => {
    const fetchImpl = asFetch(
      Response.json({
        ...WEATHER_RESPONSE,
        forecastPeriods: [
          {
            time: "not-a-time",
            condition: "private provider detail",
          },
        ],
      }),
    );

    await expect(
      requestTrailWeather("jenny-lake-loop", { fetchImpl }),
    ).rejects.toThrow("TrailPack could not load the live weather forecast.");
  });

  it("does not expose route error bodies to the UI", async () => {
    const fetchImpl = asFetch(
      new Response("private provider detail", { status: 500 }),
    );

    await expect(
      requestTrailWeather("jenny-lake-loop", { fetchImpl }),
    ).rejects.not.toThrow(/private provider detail/i);
  });

  it("bounds successful route bodies before parsing JSON", async () => {
    let cancelled = false;
    const fetchImpl = asFetch(oversizedResponse(() => { cancelled = true; }));

    await expect(
      requestTrailWeather("jenny-lake-loop", { fetchImpl }),
    ).rejects.toThrow("TrailPack could not load the live weather forecast.");
    expect(cancelled).toBe(true);
  });
});

describe("weather response parser", () => {
  it.each(["lunch-tree-hill", "christian-pond-loop"])("accepts the explicitly unknown weather response for %s", (id) => {
    const response = { ...DEMO_CONTEXTS[id].weather, plannedDate: "2026-09-03" };
    expect(parseWeatherContextResponse(response)).toEqual(response);
  });

  it.each([
    { conditions: ["snow"] }, { temperatureF: { high: 20 } },
    { precipitationChance: 80 }, { windMph: 40 },
    { retrievalStatus: "live" }, { label: "forecast-based" },
    { forecastPeriods: [] }, { daylight: {} }, { plannedDate: "2026-02-30" },
    { statusReason: "x".repeat(501) },
  ])("rejects invented facts or false provenance on a no-data response: %j", (override) => {
    expect(parseWeatherContextResponse({ ...DEMO_CONTEXTS["lunch-tree-hill"].weather, ...override })).toBeNull();
  });

  it("keeps only the bounded weather response shape", () => {
    const weather = parseWeatherContextResponse({
      ...WEATHER_RESPONSE,
      internalProviderDetail: "must not reach the client model",
    });

    expect(weather).not.toBeNull();
    expect(weather).not.toHaveProperty("internalProviderDetail");
    expect(weather?.daylight?.civilTwilightEnd).toBe(
      "2026-07-28T21:23:00-06:00",
    );
  });

  it("accepts a complete 24-hour forecast and rejects oversized arrays", () => {
    const fullDay = Array.from({ length: 24 }, (_, hour) => ({
      time: `2026-07-28T${hour.toString().padStart(2, "0")}:00`,
      temperatureF: 45 + hour,
      apparentTemperatureF: 43 + hour,
      precipitationChance: hour,
      windMph: 3 + hour,
      weatherCode: 1,
      condition: "mostly clear",
    }));

    expect(
      parseWeatherContextResponse({
        ...WEATHER_RESPONSE,
        forecastPeriods: fullDay,
      })?.forecastPeriods,
    ).toHaveLength(24);
    expect(
      parseWeatherContextResponse({
        ...WEATHER_RESPONSE,
        forecastPeriods: [
          ...fullDay,
          {
            ...fullDay[0],
            time: "2026-07-29T00:00",
          },
        ],
      }),
    ).toBeNull();
  });

  it("rejects out-of-range forecast values", () => {
    expect(
      parseWeatherContextResponse({
        ...WEATHER_RESPONSE,
        precipitationChance: 101,
      }),
    ).toBeNull();
  });

  it.each([
    "2026-02-30T12:00",
    "2026-07-28T24:00",
    "2026-07-28T12:60",
  ])("rejects impossible forecast time %s", (time) => {
    expect(
      parseWeatherContextResponse({
        ...WEATHER_RESPONSE,
        forecastPeriods: [{ ...WEATHER_RESPONSE.forecastPeriods[0], time }],
      }),
    ).toBeNull();
  });
});
