import { describe, expect, it } from "vitest";
import {
  analyzeTrailConditions,
  generatePackingRecommendation,
  GRTE_BEAR_SAFETY_URL,
  isOfficialNpsAlert,
  parseExpectedHours,
  type UserHikeInput,
} from "@/lib/packing";
import { JENNY_LAKE_LOOP } from "@/data/supported-trails";
import type { AlertContext, PackingItem, WeatherContext } from "@/types/trailpack";

const CLEAR_WEATHER: WeatherContext = {
  summary: "Clear and mild.",
  precipitationChance: 0,
  conditions: [],
  source: "open-meteo",
  label: "forecast-based",
};

const NO_ALERTS: AlertContext = {
  hasActiveAlerts: false,
  alerts: [],
  label: "unavailable",
};

function build(userInput: UserHikeInput = {}, weather: WeatherContext = CLEAR_WEATHER) {
  return generatePackingRecommendation(JENNY_LAKE_LOOP, weather, NO_ALERTS, userInput);
}

function names(items: PackingItem[]): string[] {
  return items.map((item) => item.name);
}

describe("parseExpectedHours", () => {
  it("returns null when no input is given", () => {
    expect(parseExpectedHours(undefined)).toBeNull();
    expect(parseExpectedHours("")).toBeNull();
    expect(parseExpectedHours("a while")).toBeNull();
  });

  it("parses a single hour value", () => {
    expect(parseExpectedHours("4 hours")).toBe(4);
    expect(parseExpectedHours("about 6 hr")).toBe(6);
  });

  it("uses the larger value of a range to stay conservative", () => {
    expect(parseExpectedHours("4-6 hours")).toBe(6);
    expect(parseExpectedHours("5 to 7 hrs")).toBe(7);
  });

  it("converts bare minutes to hours", () => {
    expect(parseExpectedHours("90 minutes")).toBeCloseTo(1.5, 5);
    expect(parseExpectedHours("45 min")).toBeCloseTo(0.75, 5);
  });

  it("combines mixed hour and minute units", () => {
    expect(parseExpectedHours("1 hour 30 minutes")).toBeCloseTo(1.5, 5);
    expect(parseExpectedHours("2 hours 15 min")).toBeCloseTo(2.25, 5);
    expect(parseExpectedHours("1 hr 45 mins")).toBeCloseTo(1.75, 5);
  });

  it("parses decimal hours", () => {
    expect(parseExpectedHours("5.5 hours")).toBe(5.5);
  });

  it("does not misread mixed units as a large hour count", () => {
    // Regression: "1 hour 30 minutes" must not be read as 30 hours.
    expect(parseExpectedHours("1 hour 30 minutes")).toBeLessThan(2);
  });
});

describe("analyzeTrailConditions", () => {
  it("detects mud and wet keywords", () => {
    expect(analyzeTrailConditions("muddy near the inlet").muddyOrWet).toBe(true);
    expect(analyzeTrailConditions("trail is wet").muddyOrWet).toBe(true);
    expect(analyzeTrailConditions("dry and dusty").muddyOrWet).toBe(false);
  });

  it("detects snow and ice keywords", () => {
    expect(analyzeTrailConditions("patchy snow up high").snowOrIce).toBe(true);
    expect(analyzeTrailConditions("icy in the shade").snowOrIce).toBe(true);
    expect(analyzeTrailConditions("clear trail").snowOrIce).toBe(false);
  });
});

describe("duration rule", () => {
  it("adds a headlamp and extra food for a long planned day (>= 6h)", () => {
    const rec = build({ expectedDuration: "7 hours" });
    expect(names(rec.essential)).toContain("Headlamp");
    expect(names(rec.optional)).toContain("Extra food");
  });

  it("does not add a headlamp for a short planned day", () => {
    const rec = build({ expectedDuration: "2 hours" });
    expect(names(rec.essential)).not.toContain("Headlamp");
    expect(names(rec.optional)).not.toContain("Extra food");
  });

  it("does not add long-day equipment for '1 hour 30 minutes'", () => {
    const rec = build({ expectedDuration: "1 hour 30 minutes" });
    expect(names(rec.essential)).not.toContain("Headlamp");
    expect(names(rec.optional)).not.toContain("Extra food");
    // 1.5 h is below the 5 h water threshold, so no duration-driven water bump.
    expect(
      rec.essential.some(
        (item) => item.name === "Water: 2-3 liters" && item.sourceLabels.includes("user-provided"),
      ),
    ).toBe(false);
  });
});

describe("trail-condition rules", () => {
  it("adds traction devices when snow or ice is reported", () => {
    const rec = build({ trailConditions: "icy switchbacks" });
    expect(names(rec.essential)).toContain("Traction devices (microspikes)");
  });

  it("adds waterproof footwear when mud is reported", () => {
    const rec = build({ trailConditions: "muddy sections" });
    expect(names(rec.optional)).toContain("Waterproof boots or gaiters");
  });

  it("does not add traction for dry conditions", () => {
    const rec = build({ trailConditions: "dry and clear" });
    expect(names(rec.essential)).not.toContain("Traction devices (microspikes)");
    expect(names(rec.optional)).not.toContain("Waterproof boots or gaiters");
  });
});

describe("condition negation", () => {
  it("does not trigger for negated snow/ice phrases", () => {
    for (const phrase of ["no snow or ice", "not icy", "no snow", "without ice"]) {
      expect(analyzeTrailConditions(phrase).snowOrIce, phrase).toBe(false);
    }
  });

  it("does not trigger for negated mud phrases", () => {
    for (const phrase of ["not muddy", "no mud", "no mud or standing water"]) {
      expect(analyzeTrailConditions(phrase).muddyOrWet, phrase).toBe(false);
    }
  });

  it("still triggers for positive condition phrases", () => {
    expect(analyzeTrailConditions("patchy snow").snowOrIce).toBe(true);
    expect(analyzeTrailConditions("icy sections").snowOrIce).toBe(true);
    expect(analyzeTrailConditions("muddy near the inlet").muddyOrWet).toBe(true);
  });

  it("treats suffix and phrase negations as negative", () => {
    expect(analyzeTrailConditions("snow-free").snowOrIce).toBe(false);
    expect(analyzeTrailConditions("ice-free").snowOrIce).toBe(false);
    expect(analyzeTrailConditions("mud-free").muddyOrWet).toBe(false);
    expect(analyzeTrailConditions("free of snow and ice").snowOrIce).toBe(false);
    expect(analyzeTrailConditions("trail is clear of snow").snowOrIce).toBe(false);
    expect(analyzeTrailConditions("no snow or ice").snowOrIce).toBe(false);
    expect(analyzeTrailConditions("not muddy").muddyOrWet).toBe(false);
  });

  it("evaluates each occurrence independently", () => {
    // "snow-free" is negated, but the independent "icy" report stays positive.
    const result = analyzeTrailConditions("snow-free lower trail but icy near the lake");
    expect(result.snowOrIce).toBe(true);
  });

  it("does not add recommendations for negated reports", () => {
    const snow = build({ trailConditions: "no snow or ice" });
    expect(names(snow.essential)).not.toContain("Traction devices (microspikes)");

    const mud = build({ trailConditions: "not muddy" });
    expect(names(mud.optional)).not.toContain("Waterproof boots or gaiters");

    const suffix = build({ trailConditions: "snow-free" });
    expect(names(suffix.essential)).not.toContain("Traction devices (microspikes)");
  });
});

describe("isOfficialNpsAlert", () => {
  function alert(overrides: Partial<AlertContext["alerts"][number]>): AlertContext["alerts"][number] {
    return {
      title: "Test alert",
      description: "Test description.",
      source: "NPS",
      ...overrides,
    };
  }

  it("accepts an NPS alert with a valid https nps.gov URL", () => {
    expect(
      isOfficialNpsAlert(alert({ sourceUrl: "https://www.nps.gov/grte/alerts.htm" })),
    ).toBe(true);
    expect(isOfficialNpsAlert(alert({ sourceUrl: "https://nps.gov/alerts" }))).toBe(true);
  });

  it("rejects an NPS alert without a URL", () => {
    expect(isOfficialNpsAlert(alert({ sourceUrl: undefined }))).toBe(false);
  });

  it("rejects a non-NPS source even with a valid URL", () => {
    expect(
      isOfficialNpsAlert(
        alert({ source: "open-meteo", sourceUrl: "https://open-meteo.com/" }),
      ),
    ).toBe(false);
  });

  it("rejects a malformed URL instead of throwing", () => {
    expect(isOfficialNpsAlert(alert({ sourceUrl: "http s://not a url" }))).toBe(false);
    expect(isOfficialNpsAlert(alert({ sourceUrl: "nps.gov/alerts" }))).toBe(false);
  });

  it("rejects a deceptive look-alike host", () => {
    expect(
      isOfficialNpsAlert(alert({ sourceUrl: "https://nps.gov.example.com/alerts" })),
    ).toBe(false);
  });

  it("rejects a non-https NPS URL", () => {
    expect(isOfficialNpsAlert(alert({ sourceUrl: "http://www.nps.gov/alerts" }))).toBe(false);
  });
});

describe("missing-detail warnings", () => {
  it("clears the duration and condition warnings once provided", () => {
    const rec = build({ expectedDuration: "5 hours", trailConditions: "dry" });
    const joined = rec.missingDetails.join(" ");
    expect(joined).not.toMatch(/expected time out/i);
    expect(joined).not.toMatch(/Current trail conditions/i);
  });

  it("notes details when nothing is provided", () => {
    const rec = build();
    expect(rec.missingDetails.length).toBeGreaterThan(0);
  });
});

describe("source provenance", () => {
  it("backs the bear-spray item with an official NPS source URL", () => {
    const rec = build();
    const bearSpray = rec.essential.find((item) => item.name === "Bear spray");
    expect(bearSpray).toBeDefined();
    expect(bearSpray?.sourceLabels).toContain("official");
    expect(bearSpray?.sourceUrl).toBe(GRTE_BEAR_SAFETY_URL);
  });

  it("does not label the offline-map item as official", () => {
    const rec = build();
    const offlineMap = rec.optional.find((item) => item.name === "Offline map");
    expect(offlineMap).toBeDefined();
    expect(offlineMap?.sourceLabels).not.toContain("official");
    expect(offlineMap?.sourceUrl).toBeUndefined();
  });

  it("only labels items official when they carry a source URL", () => {
    const rec = build();
    for (const item of [...rec.essential, ...rec.optional]) {
      if (item.sourceLabels.includes("official")) {
        expect(item.sourceUrl, `${item.name} should have a source URL`).toBeTruthy();
      }
    }
  });

  it("labels the alert item official and attaches the URL when an alert has one", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "Trail closure near Hidden Falls",
          description: "Section closed for maintenance.",
          severity: "closure",
          source: "NPS",
          sourceUrl: "https://www.nps.gov/grte/planyourvisit/conditions.htm",
        },
      ],
      label: "official",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {});
    const alertItem = rec.essential.find(
      (item) => item.name === "Review active alerts before leaving",
    );
    expect(alertItem).toBeDefined();
    expect(alertItem?.sourceLabels).toContain("official");
    expect(alertItem?.sourceUrl).toBe(
      "https://www.nps.gov/grte/planyourvisit/conditions.htm",
    );
  });

  it("does not label the alert item official when no alert has a URL", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "High water on the connector",
          description: "Use caution at the crossing.",
          severity: "caution",
          source: "NPS",
        },
      ],
      label: "unavailable",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {});
    const alertItem = rec.essential.find(
      (item) => item.name === "Review active alerts before leaving",
    );
    expect(alertItem).toBeDefined();
    expect(alertItem?.sourceLabels).not.toContain("official");
    expect(alertItem?.sourceUrl).toBeUndefined();
  });

  it("never emits an official label without a source URL across inputs", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "Bridge work",
          description: "Temporary detour.",
          source: "NPS",
        },
      ],
      label: "unavailable",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {
      expectedDuration: "8 hours",
      trailConditions: "icy and muddy",
    });
    for (const item of [...rec.essential, ...rec.optional]) {
      if (item.sourceLabels.includes("official")) {
        expect(item.sourceUrl, `${item.name} should have a source URL`).toBeTruthy();
      }
    }
  });

  it("labels the aggregate official when every alert is a verified NPS alert", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "Closure A",
          description: "d1",
          source: "NPS",
          sourceUrl: "https://www.nps.gov/grte/planyourvisit/conditions.htm",
        },
        {
          title: "Closure B",
          description: "d2",
          source: "NPS",
          sourceUrl: "https://www.nps.gov/grte/alerts.htm",
        },
      ],
      label: "official",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {});
    const alertItem = rec.essential.find(
      (item) => item.name === "Review active alerts before leaving",
    );
    expect(alertItem?.sourceLabels).toContain("official");
    expect(alertItem?.sourceUrl).toBe(
      "https://www.nps.gov/grte/planyourvisit/conditions.htm",
    );
    expect(alertItem?.reason).toContain("Closure A");
    expect(alertItem?.reason).toContain("Closure B");
  });

  it("does not label the aggregate official when alerts mix NPS and Open-Meteo", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "NPS closure",
          description: "d1",
          source: "NPS",
          sourceUrl: "https://www.nps.gov/grte/alerts.htm",
        },
        {
          title: "Weather advisory",
          description: "d2",
          source: "open-meteo",
          sourceUrl: "https://open-meteo.com/",
        },
      ],
      label: "official",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {});
    const alertItem = rec.essential.find(
      (item) => item.name === "Review active alerts before leaving",
    );
    expect(alertItem?.sourceLabels).not.toContain("official");
    expect(alertItem?.sourceUrl).toBeUndefined();
    // Every title is still preserved despite the mixed provenance.
    expect(alertItem?.reason).toContain("NPS closure");
    expect(alertItem?.reason).toContain("Weather advisory");
  });

  it("does not label the aggregate official when all alerts are unverified", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        { title: "Community report", description: "d1", source: "user" },
        {
          title: "Third-party note",
          description: "d2",
          source: "open-meteo",
          sourceUrl: "https://open-meteo.com/",
        },
      ],
      label: "unavailable",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {});
    const alertItem = rec.essential.find(
      (item) => item.name === "Review active alerts before leaving",
    );
    expect(alertItem?.sourceLabels).not.toContain("official");
    expect(alertItem?.sourceUrl).toBeUndefined();
    expect(alertItem?.reason).toContain("Community report");
    expect(alertItem?.reason).toContain("Third-party note");
  });

  it("does not label an Open-Meteo alert official even with a URL", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "Wind advisory",
          description: "Gusty conditions expected.",
          source: "open-meteo",
          sourceUrl: "https://open-meteo.com/",
        },
      ],
      label: "forecast-based",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {});
    const alertItem = rec.essential.find(
      (item) => item.name === "Review active alerts before leaving",
    );
    expect(alertItem?.sourceLabels).not.toContain("official");
    expect(alertItem?.sourceUrl).toBeUndefined();
  });

  it("does not label an NPS alert official when its URL is malformed", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "Closure",
          description: "Area closed.",
          source: "NPS",
          sourceUrl: "http s://broken url",
        },
      ],
      label: "unavailable",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {});
    const alertItem = rec.essential.find(
      (item) => item.name === "Review active alerts before leaving",
    );
    expect(alertItem?.sourceLabels).not.toContain("official");
    expect(alertItem?.sourceUrl).toBeUndefined();
  });

  it("does not label an NPS alert official for a deceptive look-alike host", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "Suspicious",
          description: "Phishing-style host.",
          source: "NPS",
          sourceUrl: "https://nps.gov.example.com/alerts",
        },
      ],
      label: "unavailable",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {});
    const alertItem = rec.essential.find(
      (item) => item.name === "Review active alerts before leaving",
    );
    expect(alertItem?.sourceLabels).not.toContain("official");
    expect(alertItem?.sourceUrl).toBeUndefined();
  });

  it("preserves every alert title in the reason", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        { title: "Alert one", description: "d1", source: "NPS" },
        {
          title: "Alert two",
          description: "d2",
          source: "NPS",
          sourceUrl: "https://www.nps.gov/grte/alerts.htm",
        },
      ],
      label: "official",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {});
    const alertItem = rec.essential.find(
      (item) => item.name === "Review active alerts before leaving",
    );
    expect(alertItem?.reason).toContain("Alert one");
    expect(alertItem?.reason).toContain("Alert two");
  });

  it("every official item carries a verified official NPS source URL", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "Trail closure",
          description: "Closed section.",
          source: "NPS",
          sourceUrl: "https://www.nps.gov/grte/planyourvisit/conditions.htm",
        },
      ],
      label: "official",
    };
    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {
      trailConditions: "icy and muddy",
      expectedDuration: "8 hours",
    });

    const officialItems = [...rec.essential, ...rec.optional].filter((item) =>
      item.sourceLabels.includes("official"),
    );
    expect(officialItems.length).toBeGreaterThan(0);

    for (const item of officialItems) {
      expect(item.sourceUrl, `${item.name} should have a source URL`).toBeTruthy();
      const parsed = new URL(item.sourceUrl as string);
      expect(parsed.protocol).toBe("https:");
      const host = parsed.hostname.toLowerCase();
      expect(host === "nps.gov" || host.endsWith(".nps.gov")).toBe(true);
    }
  });
});
