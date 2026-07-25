import { describe, expect, it } from "vitest";
import { buildForecastTimelineMarkers } from "@/features/trailpack/lib/forecast-timeline";

const DAYLIGHT = {
  date: "2026-07-28",
  civilTwilightBegin: "2026-07-28T05:31:00-06:00",
  sunrise: "2026-07-28T06:07:00-06:00",
  sunset: "2026-07-28T20:50:00-06:00",
  civilTwilightEnd: "2026-07-28T21:23:00-06:00",
  source: "sunrise-sunset",
  retrievalStatus: "live",
} as const;

describe("forecast timeline markers", () => {
  it("orders daylight boundaries and a plain-language planned start", () => {
    const markers = buildForecastTimelineMarkers({
      daylight: DAYLIGHT,
      startTime: "10 AM",
    });

    expect(markers).toEqual([
      expect.objectContaining({
        kind: "first-light",
        label: "First light",
        time: "5:31 AM",
        hour: 5,
      }),
      expect.objectContaining({
        kind: "sunrise",
        label: "Sunrise",
        time: "6:07 AM",
        hour: 6,
      }),
      expect.objectContaining({
        kind: "start",
        label: "Your start",
        time: "10:00 AM",
        hour: 10,
      }),
      expect.objectContaining({
        kind: "sunset",
        label: "Sunset",
        time: "8:50 PM",
        hour: 20,
      }),
      expect.objectContaining({
        kind: "last-light",
        label: "Last light",
        time: "9:23 PM",
        hour: 21,
      }),
    ]);
  });

  it("accepts native time values with optional seconds", () => {
    expect(
      buildForecastTimelineMarkers({ startTime: "14:30:00" }),
    ).toEqual([
      expect.objectContaining({
        kind: "start",
        time: "2:30 PM",
        hour: 14,
        minute: 30,
      }),
    ]);
  });

  it("omits a start marker when the user time cannot be interpreted", () => {
    expect(
      buildForecastTimelineMarkers({
        daylight: DAYLIGHT,
        startTime: "after lunch",
      }).some((marker) => marker.kind === "start"),
    ).toBe(false);
  });
});
