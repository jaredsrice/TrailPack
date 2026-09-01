import { describe, expect, it } from "vitest";
import type {
  AlertContext,
  PackingItem,
  TripAlert,
  WeatherContext,
} from "@/features/trailpack/types";
import {
  packingItemBasis,
  tripAlertBasis,
} from "./recommendation-basis";

const LIVE_ALERTS: AlertContext = {
  hasActiveAlerts: true,
  alerts: [],
  label: "official",
  retrievalStatus: "live",
};

const LIVE_WEATHER: WeatherContext = {
  summary: "Sunny",
  conditions: ["sun"],
  source: "open-meteo",
  label: "forecast-based",
  retrievalStatus: "live",
};

function packingItem(overrides: Partial<PackingItem> = {}): PackingItem {
  return {
    name: "Test item",
    question: "What should I do?",
    recommendation: "Take the recommended action.",
    why: "It matches the available context.",
    answer: "Take the recommended action. It matches the available context.",
    reason: "Take the recommended action. It matches the available context.",
    sourceLabels: ["inferred"],
    ...overrides,
  };
}

describe("recommendation basis", () => {
  it("identifies a recommendation triggered by a live NPS alert", () => {
    expect(
      packingItemBasis(
        packingItem({
          affectedBy: ["Official alert"],
          sourceLabels: ["official", "inferred"],
        }),
        { alerts: LIVE_ALERTS },
      ),
    ).toBe("Triggered by a live NPS alert.");
  });

  it("identifies live forecast and trip-detail adjustments", () => {
    expect(
      packingItemBasis(
        packingItem({
          sourceLabels: ["forecast-based", "user-provided", "inferred"],
        }),
        { weather: LIVE_WEATHER },
      ),
    ).toBe("Adjusted using the live forecast and your trip details.");
  });

  it("labels saved weather without presenting it as live", () => {
    expect(
      packingItemBasis(
        packingItem({ sourceLabels: ["forecast-based", "inferred"] }),
        {
          weather: {
            ...LIVE_WEATHER,
            retrievalStatus: "saved-fixture",
          },
        },
      ),
    ).toBe(
      "Adjusted using saved example weather because the live forecast was unavailable.",
    );
  });

  it("identifies standard safety guidance", () => {
    expect(
      packingItemBasis(
        packingItem({ sourceLabels: ["official", "inferred"] }),
      ),
    ).toBe(
      "Standard TrailPack safety rule backed by general official guidance.",
    );
  });

  it("identifies the source that triggered an overall alert", () => {
    const alert: TripAlert = {
      id: "closure",
      title: "Closure",
      summary: "A trail is closed.",
      severity: "danger",
      affectedBy: ["Official alert"],
      sourceLabels: ["official"],
    };

    expect(tripAlertBasis(alert, { alerts: LIVE_ALERTS })).toBe(
      "Triggered by a live NPS alert.",
    );
  });
});
