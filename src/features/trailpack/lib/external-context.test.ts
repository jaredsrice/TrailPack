import { afterEach, describe, expect, it, vi } from "vitest";
import {
  buildAlertContextFromNpsResponse,
  buildDaylightContextFromSunriseSunsetResponse,
  buildSavedAlertFallback,
  buildSavedWeatherFallback,
  buildWeatherContextFromOpenMeteoResponse,
  fetchNpsAlertContext,
  fetchOpenMeteoWeatherContext,
  resolveSupportedParkCode,
} from "@/features/trailpack/lib/external-context";

afterEach(() => {
  vi.useRealTimers();
});

describe("buildWeatherContextFromOpenMeteoResponse", () => {
  it("normalizes Open-Meteo forecast data into TrailPack weather context", () => {
    const weather = buildWeatherContextFromOpenMeteoResponse(
      {
        timezone: "America/Denver",
        current: {
          temperature_2m: 78,
          wind_speed_10m: 22,
          weather_code: 61,
        },
        daily: {
          time: ["2026-07-06"],
          temperature_2m_max: [84],
          temperature_2m_min: [42],
          precipitation_probability_max: [55],
          wind_speed_10m_max: [24],
          weather_code: [61],
        },
        hourly: {
          time: [
            "2026-07-06T06:00",
            "2026-07-06T10:00",
            "2026-07-06T14:00",
            "2026-07-06T18:00",
          ],
          temperature_2m: [45, 60, 84, 70],
          apparent_temperature: [42, 59, 82, 68],
          precipitation_probability: [10, 20, 55, 40],
          wind_speed_10m: [4, 10, 24, 18],
          weather_code: [1, 2, 61, 80],
        },
      },
      "2026-07-06",
    );

    expect(weather.label).toBe("forecast-based");
    expect(weather.source).toBe("open-meteo");
    expect(weather.retrievalStatus).toBe("live");
    expect(weather.timezone).toBe("America/Denver");
    expect(weather.temperatureF).toEqual({ current: 78, high: 84, low: 42 });
    expect(weather.precipitationChance).toBe(55);
    expect(weather.windMph).toBe(24);
    expect(weather.conditions).toEqual(expect.arrayContaining(["heat", "rain", "wind"]));
    expect(weather.summary).toContain("84°F high");
    expect(weather.forecastPeriods).toEqual([
      {
        time: "2026-07-06T06:00",
        temperatureF: 45,
        apparentTemperatureF: 42,
        precipitationChance: 10,
        windMph: 4,
        weatherCode: 1,
        condition: "mostly clear",
      },
      {
        time: "2026-07-06T10:00",
        temperatureF: 60,
        apparentTemperatureF: 59,
        precipitationChance: 20,
        windMph: 10,
        weatherCode: 2,
        condition: "partly cloudy",
      },
      {
        time: "2026-07-06T14:00",
        temperatureF: 84,
        apparentTemperatureF: 82,
        precipitationChance: 55,
        windMph: 24,
        weatherCode: 61,
        condition: "rain likely",
      },
      {
        time: "2026-07-06T18:00",
        temperatureF: 70,
        apparentTemperatureF: 68,
        precipitationChance: 40,
        windMph: 18,
        weatherCode: 80,
        condition: "rain showers possible",
      },
    ]);
  });
});

describe("buildDaylightContextFromSunriseSunsetResponse", () => {
  it("normalizes civil-twilight data from Sunrise-Sunset.org", () => {
    const daylight = buildDaylightContextFromSunriseSunsetResponse(
      {
        status: "OK",
        tzid: "America/Denver",
        results: {
          sunrise: "2026-06-15T05:38:37-06:00",
          sunset: "2026-06-15T21:08:20-06:00",
          day_length: 55783,
          civil_twilight_begin: "2026-06-15T05:04:20-06:00",
          civil_twilight_end: "2026-06-15T21:42:37-06:00",
        },
      },
      "2026-06-15",
    );

    expect(daylight).toEqual({
      date: "2026-06-15",
      sunrise: "2026-06-15T05:38:37-06:00",
      sunset: "2026-06-15T21:08:20-06:00",
      civilTwilightBegin: "2026-06-15T05:04:20-06:00",
      civilTwilightEnd: "2026-06-15T21:42:37-06:00",
      dayLengthSeconds: 55783,
      timezone: "America/Denver",
      source: "sunrise-sunset",
      retrievalStatus: "live",
    });
  });

  it("returns null when the daylight provider returns an invalid status", () => {
    expect(
      buildDaylightContextFromSunriseSunsetResponse({
        status: "INVALID_TZID",
        results: {},
      }),
    ).toBeNull();
  });
});

describe("buildAlertContextFromNpsResponse", () => {
  it("normalizes active NPS alerts with official provenance", () => {
    const alerts = buildAlertContextFromNpsResponse({
      total: "1",
      data: [
        {
          title: "Trail closure near Hidden Falls",
          description: "A bridge is closed for maintenance.",
          category: "Park Closure",
          url: "https://www.nps.gov/grte/planyourvisit/conditions.htm",
        },
      ],
    });

    expect(alerts.hasActiveAlerts).toBe(true);
    expect(alerts.label).toBe("official");
    expect(alerts.retrievalStatus).toBe("live");
    expect(alerts.alerts).toEqual([
      {
        title: "Trail closure near Hidden Falls",
        description: "A bridge is closed for maintenance.",
        severity: "closure",
        source: "NPS",
        sourceUrl: "https://www.nps.gov/grte/planyourvisit/conditions.htm",
      },
    ]);
  });

  it("returns an official no-active-alert state when NPS returns no alerts", () => {
    const alerts = buildAlertContextFromNpsResponse({ total: "0", data: [] });

    expect(alerts.hasActiveAlerts).toBe(false);
    expect(alerts.alerts).toEqual([]);
    expect(alerts.label).toBe("official");
    expect(alerts.retrievalStatus).toBe("live");
  });
});

describe("external-context fallbacks", () => {
  it("returns the saved weather fixture when live weather is unavailable", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", {
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledOnce();
    expect(weather).not.toBeNull();
    expect(weather?.retrievalStatus).toBe("saved-fixture");
    expect(weather?.summary).toMatch(/Partly sunny/);
  });

  it("labels a selected-date fallback without reusing daylight from another day", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({}),
    });

    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", {
      plannedDate: "2027-01-01",
      fetcher,
    });

    expect(weather).toMatchObject({
      plannedDate: "2027-01-01",
      retrievalStatus: "saved-fixture",
    });
    expect(weather?.statusReason).toMatch(/saved example conditions/i);
    expect(weather?.statusReason).toMatch(/not that day's forecast/i);
    expect(weather?.daylight).toBeUndefined();
    expect(
      weather?.forecastPeriods?.every((period) =>
        period.time.startsWith("2027-01-01T"),
      ),
    ).toBe(true);
  });

  it("uses imported-trail coordinates and falls back to its saved context", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: async () => ({}),
    });

    const weather = await fetchOpenMeteoWeatherContext(
      "two-ocean-lake-loop",
      { fetcher },
    );
    const requestedUrl = new URL(String(fetcher.mock.calls[0]?.[0]));

    expect(requestedUrl.searchParams.get("latitude")).toBe("43.9096367");
    expect(requestedUrl.searchParams.get("longitude")).toBe("-110.52399853");
    expect(weather?.retrievalStatus).toBe("saved-fixture");
    expect(weather?.summary).toMatch(/Two Ocean Lake/);
  });

  it("attaches live civil-twilight context when weather and daylight calls succeed", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));

      if (url.hostname === "api.open-meteo.com") {
        return {
          ok: true,
          status: 200,
          json: async () => ({
            timezone: "America/Denver",
            current: {
              temperature_2m: 70,
              wind_speed_10m: 8,
              weather_code: 1,
            },
            daily: {
              time: ["2026-06-15"],
              temperature_2m_max: [74],
              temperature_2m_min: [44],
              precipitation_probability_max: [10],
              wind_speed_10m_max: [12],
              weather_code: [1],
            },
          }),
        };
      }

      expect(url.hostname).toBe("api.sunrise-sunset.org");
      expect(url.searchParams.get("date")).toBe("2026-06-15");
      expect(url.searchParams.get("formatted")).toBe("0");
      expect(url.searchParams.get("tzid")).toBe("America/Denver");

      return {
        ok: true,
        status: 200,
        json: async () => ({
          status: "OK",
          tzid: "America/Denver",
          results: {
            sunrise: "2026-06-15T05:38:37-06:00",
            sunset: "2026-06-15T21:08:20-06:00",
            day_length: 55783,
            civil_twilight_begin: "2026-06-15T05:04:20-06:00",
            civil_twilight_end: "2026-06-15T21:42:37-06:00",
          },
        }),
      };
    });

    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", {
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(weather?.daylight?.source).toBe("sunrise-sunset");
    expect(weather?.daylight?.civilTwilightEnd).toBe("2026-06-15T21:42:37-06:00");
  });

  it("requests the selected date and hourly forecast fields", async () => {
    const hourlyTimes = Array.from(
      { length: 24 },
      (_, hour) =>
        `2026-07-28T${hour.toString().padStart(2, "0")}:00`,
    );
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));

      if (url.hostname === "api.open-meteo.com") {
        expect(url.searchParams.get("start_date")).toBe("2026-07-28");
        expect(url.searchParams.get("end_date")).toBe("2026-07-28");
        expect(url.searchParams.has("forecast_days")).toBe(false);
        expect(url.searchParams.get("hourly")).toContain(
          "precipitation_probability",
        );

        return {
          ok: true,
          status: 200,
          json: async () => ({
            timezone: "America/Denver",
            daily: {
              time: ["2026-07-28"],
              temperature_2m_max: [76],
              temperature_2m_min: [46],
              precipitation_probability_max: [20],
              wind_speed_10m_max: [11],
              weather_code: [2],
            },
            hourly: {
              time: hourlyTimes,
              temperature_2m: hourlyTimes.map((_, hour) =>
                hour === 14 ? 76 : 46 + hour,
              ),
              apparent_temperature: hourlyTimes.map((_, hour) => 43 + hour),
              precipitation_probability: hourlyTimes.map((_, hour) =>
                Math.min(hour, 20),
              ),
              wind_speed_10m: hourlyTimes.map((_, hour) =>
                Math.min(3 + hour, 11),
              ),
              weather_code: hourlyTimes.map((_, hour) =>
                hour >= 12 ? 2 : 1,
              ),
            },
          }),
        };
      }

      return {
        ok: false,
        status: 503,
        json: async () => ({}),
      };
    });

    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", {
      plannedDate: "2026-07-28",
      fetcher,
    });

    expect(weather?.plannedDate).toBe("2026-07-28");
    expect(weather?.forecastPeriods).toHaveLength(24);
    expect(weather?.forecastPeriods?.[0]?.time).toBe("2026-07-28T00:00");
    expect(weather?.forecastPeriods?.[14]).toMatchObject({
      time: "2026-07-28T14:00",
      temperatureF: 76,
      condition: "partly cloudy",
    });
    expect(weather?.forecastPeriods?.[23]?.time).toBe("2026-07-28T23:00");
  });

  it("returns unavailable alert context when the NPS key is missing", async () => {
    const fetcher = vi.fn();

    const alerts = await fetchNpsAlertContext("grte", undefined, fetcher);

    expect(fetcher).not.toHaveBeenCalled();
    expect(alerts.hasActiveAlerts).toBe(false);
    expect(alerts.label).toBe("unavailable");
    expect(alerts.retrievalStatus).toBe("unavailable");
    expect(alerts.statusReason).toMatch(/NPS API key/i);
  });

  it("falls back to saved alert context when the NPS request fails", async () => {
    const fetcher = vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      json: async () => ({}),
    });

    const alerts = await fetchNpsAlertContext("grte", "test-key", fetcher);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(alerts.hasActiveAlerts).toBe(false);
    expect(alerts.label).toBe("unavailable");
    expect(alerts.retrievalStatus).toBe("saved-fixture");
  });

  it("bounds a stalled NPS request and returns the saved fallback", async () => {
    vi.useFakeTimers();
    let observedAbort = false;
    const fetcher = vi.fn(
      async (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<never>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              observedAbort = true;
              reject(new DOMException("Timed out", "AbortError"));
            },
            { once: true },
          );
        }),
    );

    const alertsPromise = fetchNpsAlertContext("grte", "test-key", fetcher);
    const expectation = expect(alertsPromise).resolves.toMatchObject({
      hasActiveAlerts: false,
      retrievalStatus: "saved-fixture",
    });

    await vi.advanceTimersByTimeAsync(8_000);
    await expectation;
    expect(observedAbort).toBe(true);
  });

  it("exposes saved fixture helpers with explicit retrieval status", () => {
    expect(buildSavedWeatherFallback("taggart-lake")?.retrievalStatus).toBe(
      "saved-fixture",
    );
    expect(buildSavedAlertFallback("grte").retrievalStatus).toBe("saved-fixture");
  });
});

describe("resolveSupportedParkCode", () => {
  it("resolves the Grand Teton park code from a supported trail id", () => {
    expect(resolveSupportedParkCode({ trailId: "jenny-lake-loop" })).toBe("grte");
    expect(resolveSupportedParkCode({ trailId: "colter-bay-lakeshore-trail" })).toBe(
      "grte",
    );
  });

  it("rejects unsupported trail ids and park codes", () => {
    expect(resolveSupportedParkCode({ trailId: "unknown-trail" })).toBeNull();
    expect(resolveSupportedParkCode({ parkCode: "acad" })).toBeNull();
  });
});
