import { afterEach, describe, expect, it, vi } from "vitest";
import { TRAIL_CATALOG } from "@/features/trailpack/data/supported-trails";
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
  vi.unstubAllGlobals();
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
    expect(weather.temperatureF).toEqual({ current: undefined, high: 84, low: 42 });
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

  it("preserves current observations when no planned date is selected", () => {
    const weather = buildWeatherContextFromOpenMeteoResponse({
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
    });

    expect(weather.temperatureF).toEqual({ current: 78, high: 84, low: 42 });
    expect(weather.plannedDate).toBe("2026-07-06");
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

  it("bounds provider-controlled alert counts, text, and source URLs", () => {
    const alerts = buildAlertContextFromNpsResponse({
      data: Array.from({ length: 12 }, (_, index) => ({
        title: ` Alert ${index} ${"t".repeat(2_100)} `,
        description: ` ${"d".repeat(2_100)} `,
        category: "Closure",
        url:
          index === 0
            ? "https://attacker.example@nps.gov/looks-official"
            : "https://www.nps.gov/grte/planyourvisit/conditions.htm",
      })),
    });

    expect(alerts.alerts).toHaveLength(10);
    expect(alerts.alerts.every((alert) => alert.title.length <= 2_000)).toBe(true);
    expect(
      alerts.alerts.every((alert) => alert.description.length <= 2_000),
    ).toBe(true);
    expect(alerts.alerts[0]?.sourceUrl).toBeUndefined();
  });
});

describe("external-context fallbacks", () => {
  describe.each(["daylight", "alerts"] as const)("failed %s response cleanup", (provider) => {
    it.each(["resolves", "rejects", "never settles"] as const)("releases the error body when cancellation %s", async (behavior) => {
      let cancelled = false;
      let reads = 0;
      const failedResponse = new Response(new ReadableStream<Uint8Array>({
        pull() { reads++; },
        cancel() {
          cancelled = true;
          if (behavior === "rejects") return Promise.reject(new Error("private cancellation error"));
          if (behavior === "never settles") return new Promise<void>(() => undefined);
        },
      }, { highWaterMark: 0 }), { status: 503 });
      const pending = provider === "alerts"
        ? fetchNpsAlertContext("grte", "test-key", async () => failedResponse)
        : fetchOpenMeteoWeatherContext("jenny-lake-loop", {
          plannedDate: "2026-06-15",
          fetcher: async (input) => new URL(String(input)).hostname === "api.open-meteo.com"
            ? Response.json({
              timezone: "America/Denver",
              daily: {
                time: ["2026-06-15"],
                temperature_2m_max: [74],
                temperature_2m_min: [44],
                weather_code: [1],
              },
            })
            : failedResponse,
        });
      let timer: ReturnType<typeof setTimeout> | undefined;
      try {
        const result = await Promise.race([
          pending,
          new Promise<null>((resolve) => { timer = setTimeout(() => resolve(null), 100); }),
        ]);
        expect(result, "provider failure must not wait for stream cancellation").not.toBeNull();
        expect(cancelled).toBe(true);
        expect(reads).toBe(0);
        if (provider === "alerts") {
          expect(result).toMatchObject({ retrievalStatus: "saved-fixture", label: "unavailable" });
        } else {
          expect(result).toMatchObject({ retrievalStatus: "live" });
          expect(result).not.toHaveProperty("daylight");
        }
        expect(JSON.stringify(result)).not.toContain("private cancellation error");
      } finally {
        clearTimeout(timer);
        void failedResponse.body?.cancel().catch(() => undefined);
      }
    });
  });

  it.each([
    [400, /rejected the forecast request \(HTTP 400\)/],
    [401, /denied this forecast request \(HTTP 401\)/],
    [403, /denied this forecast request \(HTTP 403\)/],
    [429, /limiting forecast requests/],
    [503, /temporarily unavailable \(HTTP 503\)/],
  ])("explains weather HTTP %s without exposing the provider body", async (status, reason) => {
    const fetcher = vi.fn(async () => new Response("private upstream diagnostic", { status: Number(status) }));
    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", { fetcher });

    expect(fetcher).toHaveBeenCalledOnce();
    expect(weather?.retrievalStatus).toBe("saved-fixture");
    expect(weather?.statusReason).toMatch(reason as RegExp);
    expect(weather?.statusReason).not.toContain("private upstream diagnostic");
    expect(weather?.statusReason?.length).toBeLessThanOrEqual(500);
  });

  it.each([
    ["{", /unreadable forecast response/],
    ["null", /unusable forecast response/],
    ["{}", /no usable forecast values/],
  ])("explains invalid forecast data %s", async (body, reason) => {
    const fetcher = vi.fn(async () => new Response(String(body)));
    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", { fetcher });

    expect(weather?.retrievalStatus).toBe("saved-fixture");
    expect(weather?.statusReason).toMatch(reason as RegExp);
  });

  it("explains a connection failure without reflecting exception details", async () => {
    const fetcher = vi.fn().mockRejectedValue(new Error("private network detail"));
    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", { fetcher });

    expect(weather?.statusReason).toMatch(/could not be reached from TrailPack/);
    expect(weather?.statusReason).not.toContain("private network detail");
  });

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

  it("does not mix a current observation into an explicitly dated forecast", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      const url = new URL(String(input));
      if (url.hostname === "api.open-meteo.com") {
        expect(url.searchParams.has("current")).toBe(false);
        return Response.json({
          timezone: "America/Denver",
          current: {
            temperature_2m: 100,
            wind_speed_10m: 45,
            weather_code: 95,
          },
          daily: {
            time: ["2026-07-28"],
            temperature_2m_max: [72],
            temperature_2m_min: [50],
            precipitation_probability_max: [10],
            wind_speed_10m_max: [8],
            weather_code: [2],
          },
        });
      }
      return new Response(null, { status: 503 });
    });

    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", {
      plannedDate: "2026-07-28",
      fetcher,
    });

    expect(weather).toMatchObject({
      plannedDate: "2026-07-28",
      retrievalStatus: "live",
      temperatureF: { high: 72, low: 50 },
      precipitationChance: 10,
      windMph: 8,
    });
    expect(weather?.temperatureF?.current).toBeUndefined();
    expect(weather?.conditions).not.toEqual(expect.arrayContaining(["heat", "rain", "wind"]));
  });

  it("falls back when Open-Meteo does not return the explicitly requested date", async () => {
    const fetcher = vi.fn(async () => Response.json({
      timezone: "America/Denver",
      current: { temperature_2m: 70, wind_speed_10m: 5, weather_code: 1 },
      daily: {
        time: ["2026-07-27"],
        temperature_2m_max: [72],
        temperature_2m_min: [50],
        weather_code: [2],
      },
    }));

    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", {
      plannedDate: "2026-07-28",
      fetcher,
    });

    expect(fetcher).toHaveBeenCalledOnce();
    expect(weather).toMatchObject({
      plannedDate: "2026-07-28",
      retrievalStatus: "saved-fixture",
      label: "forecast-based",
    });
    expect(weather?.statusReason).toMatch(/no usable forecast values/i);
  });

  it("selects the matching day from a multi-day Open-Meteo response", async () => {
    const fetcher = vi.fn(async (input: RequestInfo | URL) => {
      if (new URL(String(input)).hostname !== "api.open-meteo.com") {
        return new Response(null, { status: 503 });
      }
      return Response.json({
        timezone: "America/Denver",
        daily: {
          time: ["2026-07-27", "2026-07-28"],
          temperature_2m_max: [99, 72],
          temperature_2m_min: [80, 50],
          precipitation_probability_max: [80, 10],
          wind_speed_10m_max: [30, 8],
          weather_code: [95, 2],
        },
      });
    });

    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", {
      plannedDate: "2026-07-28",
      fetcher,
    });

    expect(weather).toMatchObject({
      plannedDate: "2026-07-28",
      retrievalStatus: "live",
      temperatureF: { high: 72, low: 50 },
      precipitationChance: 10,
      windMph: 8,
    });
    expect(weather?.conditions).not.toEqual(expect.arrayContaining(["heat", "rain", "wind"]));
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

  it.each(Object.keys(TRAIL_CATALOG))("attempts the live weather provider for %s using its own coordinates", async (trailId) => {
    const fetcher = vi.fn().mockResolvedValue(new Response("Unavailable", { status: 503 }));
    const weather = await fetchOpenMeteoWeatherContext(trailId, { fetcher, plannedDate: "2026-09-03" });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const requestedUrl = new URL(String(fetcher.mock.calls[0]?.[0]));
    const coordinates = TRAIL_CATALOG[trailId].coordinates!;
    expect(requestedUrl.searchParams.get("latitude")).toBe(String(coordinates.lat));
    expect(requestedUrl.searchParams.get("longitude")).toBe(String(coordinates.lng));
    expect(requestedUrl.searchParams.get("start_date")).toBe("2026-09-03");
    expect(weather?.retrievalStatus).not.toBe("live");
  });

  it.each(["lunch-tree-hill", "christian-pond-loop"])("does not invent a saved forecast for new trail %s", async (trailId) => {
    const fetcher = vi.fn(async () => new Response("Unavailable", { status: 503 }));
    const weather = await fetchOpenMeteoWeatherContext(trailId, { fetcher });
    expect(weather).toMatchObject({ retrievalStatus: "unavailable", label: "unavailable", conditions: [] });
    expect(weather?.temperatureF).toBeUndefined();
    expect(weather?.statusReason).not.toMatch(/saved example conditions/);
  });

  it("bounds a stalled Open-Meteo request and returns the saved fallback", async () => {
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

    const weatherPromise = fetchOpenMeteoWeatherContext("jenny-lake-loop", {
      fetcher,
    });
    const expectation = expect(weatherPromise).resolves.toMatchObject({
      retrievalStatus: "saved-fixture",
      statusReason: expect.stringContaining("did not respond within 15 seconds"),
    });

    await vi.advanceTimersByTimeAsync(8_000);
    expect(observedAbort).toBe(false);
    await vi.advanceTimersByTimeAsync(6_999);
    expect(observedAbort).toBe(false);
    await vi.advanceTimersByTimeAsync(1);
    await expectation;
    expect(observedAbort).toBe(true);
  });

  it("keeps the weather deadline active while reading the response body", async () => {
    vi.useFakeTimers();
    let observedAbort = false;
    const fetcher = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) =>
      new Response(new ReadableStream<Uint8Array>({
        start(controller) {
          init?.signal?.addEventListener("abort", () => {
            observedAbort = true;
            controller.error(new DOMException("Timed out", "AbortError"));
          }, { once: true });
        },
      })),
    );

    const weatherPromise = fetchOpenMeteoWeatherContext("jenny-lake-loop", { fetcher });
    await vi.advanceTimersByTimeAsync(14_999);
    expect(observedAbort).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    await expect(weatherPromise).resolves.toMatchObject({
      retrievalStatus: "saved-fixture",
      statusReason: expect.stringContaining("did not respond within 15 seconds"),
    });
    expect(observedAbort).toBe(true);
    expect(fetcher).toHaveBeenCalledTimes(1);
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

  it.each([0, 14_000])("bounds stalled daylight without discarding a live forecast arriving after %i ms", async (forecastDelay) => {
    vi.useFakeTimers();
    let observedAbort = false;
    let forecastSignal: AbortSignal | null | undefined;
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        const url = new URL(String(input));
        if (url.hostname === "api.open-meteo.com") {
          forecastSignal = init?.signal;
          if (forecastDelay) {
            await new Promise((resolve) => setTimeout(resolve, forecastDelay));
          }
          return {
            ok: true,
            status: 200,
            json: async () => ({
              timezone: "America/Denver",
              daily: {
                time: ["2026-06-15"],
                temperature_2m_max: [74],
                temperature_2m_min: [44],
                weather_code: [1],
              },
            }),
          };
        }

        return new Promise<never>((_resolve, reject) => {
          init?.signal?.addEventListener(
            "abort",
            () => {
              observedAbort = true;
              reject(new DOMException("Timed out", "AbortError"));
            },
            { once: true },
          );
        });
      },
    );

    const weatherPromise = fetchOpenMeteoWeatherContext("jenny-lake-loop", {
      fetcher,
    });
    await vi.advanceTimersByTimeAsync(forecastDelay + 2_999);
    expect(fetcher).toHaveBeenCalledTimes(2);
    expect(observedAbort).toBe(false);
    expect(forecastSignal?.aborted).toBe(false);
    await vi.advanceTimersByTimeAsync(1);

    const weather = await weatherPromise;
    expect(weather).toMatchObject({ retrievalStatus: "live" });
    expect(weather?.daylight).toBeUndefined();
    expect(observedAbort).toBe(true);
    expect(forecastSignal?.aborted).toBe(false);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("rejects oversized upstream weather and alert payloads", async () => {
    const oversizedWeather = vi.fn(async () =>
      new Response(JSON.stringify({ timezone: "x".repeat(300_000) })),
    );
    const oversizedAlerts = vi.fn(async () =>
      new Response(
        JSON.stringify({
          data: [
            {
              title: "Alert",
              description: "x".repeat(300_000),
            },
          ],
        }),
      ),
    );

    await expect(
      fetchOpenMeteoWeatherContext("jenny-lake-loop", {
        fetcher: oversizedWeather,
      }),
    ).resolves.toMatchObject({ retrievalStatus: "saved-fixture" });
    await expect(
      fetchNpsAlertContext("grte", "test-key", oversizedAlerts),
    ).resolves.toMatchObject({ retrievalStatus: "saved-fixture" });
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

  it("bounds successful NPS requests with the shared Next.js data cache", async () => {
    const fetcher = vi.fn<typeof fetch>(
      async () => Response.json({ total: "0", data: [] }),
    );
    vi.stubGlobal("fetch", fetcher);

    const alerts = await fetchNpsAlertContext("grte", "test-key");

    expect(alerts).toMatchObject({
      hasActiveAlerts: false,
      label: "official",
      retrievalStatus: "live",
    });
    expect(fetcher).toHaveBeenCalledOnce();
    expect(fetcher.mock.calls[0]?.[1]).toMatchObject({
      next: { revalidate: 300 },
    });
  });

  describe("NPS alert envelope validation", () => {
    const validAlert = {
      title: "Trail bridge closure",
      description: "Check the posted detour.",
      category: "Park Closure",
      parkCode: "grte",
      url: "https://www.nps.gov/grte/planyourvisit/conditions.htm",
    };

    it.each([
      { name: "missing envelope fields", value: {} },
      { name: "missing data", value: { total: "0" } },
      { name: "nonarray data", value: { total: "0", data: {} } },
      { name: "missing total", value: { data: [] } },
      { name: "malformed total", value: { total: "unknown", data: [] } },
      { name: "negative total", value: { total: -1, data: [] } },
      { name: "positive total with no records", value: { total: "1", data: [] } },
      { name: "total below returned count", value: { total: "0", data: [validAlert] } },
      { name: "null record", value: { total: "1", data: [null] } },
      { name: "empty record", value: { total: "1", data: [{}] } },
      { name: "blank title", value: { total: "1", data: [{ ...validAlert, title: " " }] } },
      { name: "wrong description type", value: { total: "1", data: [{ ...validAlert, description: null }] } },
      { name: "unknown severity category", value: { total: "1", data: [{ ...validAlert, category: "Unknown" }] } },
      { name: "wrong URL type", value: { total: "1", data: [{ ...validAlert, url: {} }] } },
      { name: "different park", value: { total: "1", data: [{ ...validAlert, parkCode: "acad" }] } },
      { name: "mixed valid and malformed records", value: { total: "2", data: [validAlert, null] } },
    ])("does not report official clear or partial data for $name", async ({ value }) => {
      const result = await fetchNpsAlertContext("grte", "test-key", async () => Response.json(value));
      expect(result).toMatchObject({ label: "unavailable", retrievalStatus: "saved-fixture", alerts: [] });
      expect(result.statusReason).toMatch(/could not be checked/i);
    });

    it.each(["0", 0])("keeps an explicit zero total %j as official clear", async total => {
      const result = await fetchNpsAlertContext("grte", "test-key", async () => Response.json({ total, data: [] }));
      expect(result).toMatchObject({ hasActiveAlerts: false, label: "official", retrievalStatus: "live", alerts: [] });
    });

    it.each(["Danger", "Caution", "Information", "Park Closure"])("retains a usable %s alert with optional blank URL", async category => {
      const result = await fetchNpsAlertContext("grte", "test-key", async () => Response.json({
        total: "1", data: [{ ...validAlert, category, url: "", lastIndexedDate: "2026-09-12 10:00:00.0" }],
      }));
      expect(result).toMatchObject({ hasActiveAlerts: true, label: "official", retrievalStatus: "live" });
      expect(result.alerts).toHaveLength(1);
      expect(result.alerts[0]).toMatchObject({ title: "Trail bridge closure", source: "NPS" });
      expect(result.alerts[0].sourceUrl).toBeUndefined();
    });
  });

  it.each([
    {
      name: "HTTP 500",
      response: () => new Response("private upstream detail", { status: 500 }),
    },
    {
      name: "malformed JSON",
      response: () => new Response("{", { status: 200 }),
    },
  ])("uses the labeled saved fallback for NPS $name", async ({ response }) => {
    const alerts = await fetchNpsAlertContext(
      "grte",
      "test-key",
      vi.fn(async () => response()),
    );

    expect(alerts).toMatchObject({
      hasActiveAlerts: false,
      label: "unavailable",
      retrievalStatus: "saved-fixture",
    });
    expect(JSON.stringify(alerts)).not.toContain("private upstream detail");
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

    await vi.advanceTimersByTimeAsync(5_000);
    await expectation;
    expect(observedAbort).toBe(true);
  });

  it("exposes saved fixture helpers with explicit retrieval status", () => {
    expect(buildSavedWeatherFallback("taggart-lake")?.retrievalStatus).toBe(
      "saved-fixture",
    );
    expect(buildSavedAlertFallback().retrievalStatus).toBe("saved-fixture");
  });
});

describe("resolveSupportedParkCode", () => {
  it("resolves every supported trail to the Grand Teton park code", () => {
    expect(Object.keys(TRAIL_CATALOG).length).toBeGreaterThan(0);
    for (const trailId of Object.keys(TRAIL_CATALOG)) {
      expect(resolveSupportedParkCode({ trailId })).toBe("grte");
    }
  });

  it("rejects unsupported trail ids and park codes", () => {
    expect(resolveSupportedParkCode({ trailId: "unknown-trail" })).toBeNull();
    expect(resolveSupportedParkCode({ parkCode: "acad" })).toBeNull();
    expect(
      resolveSupportedParkCode({ trailId: "unknown-trail", parkCode: "grte" }),
    ).toBeNull();
    expect(
      resolveSupportedParkCode({ trailId: "jenny-lake-loop", parkCode: "acad" }),
    ).toBeNull();
  });
});
