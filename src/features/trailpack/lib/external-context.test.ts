import { describe, expect, it, vi } from "vitest";
import {
  buildAlertContextFromNpsResponse,
  buildSavedAlertFallback,
  buildSavedWeatherFallback,
  buildWeatherContextFromOpenMeteoResponse,
  fetchNpsAlertContext,
  fetchOpenMeteoWeatherContext,
  resolveSupportedParkCode,
} from "@/features/trailpack/lib/external-context";

describe("buildWeatherContextFromOpenMeteoResponse", () => {
  it("normalizes Open-Meteo forecast data into TrailPack weather context", () => {
    const weather = buildWeatherContextFromOpenMeteoResponse(
      {
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
      },
      "2026-07-06",
    );

    expect(weather.label).toBe("forecast-based");
    expect(weather.source).toBe("open-meteo");
    expect(weather.retrievalStatus).toBe("live");
    expect(weather.temperatureF).toEqual({ current: 78, high: 84, low: 42 });
    expect(weather.precipitationChance).toBe(55);
    expect(weather.windMph).toBe(24);
    expect(weather.conditions).toEqual(expect.arrayContaining(["heat", "rain", "wind"]));
    expect(weather.summary).toContain("84°F high");
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

    const weather = await fetchOpenMeteoWeatherContext("jenny-lake-loop", fetcher);

    expect(fetcher).toHaveBeenCalledOnce();
    expect(weather).not.toBeNull();
    expect(weather?.retrievalStatus).toBe("saved-fixture");
    expect(weather?.summary).toMatch(/Partly sunny/);
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
  });

  it("rejects unsupported trail ids and park codes", () => {
    expect(resolveSupportedParkCode({ trailId: "unknown-trail" })).toBeNull();
    expect(resolveSupportedParkCode({ parkCode: "acad" })).toBeNull();
  });
});
