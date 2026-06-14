import { describe, expect, it } from "vitest";
import {
  analyzeTrailConditions,
  generatePackingRecommendation,
  GRTE_BEAR_SAFETY_URL,
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

  it("does not add recommendations for negated reports", () => {
    const snow = build({ trailConditions: "no snow or ice" });
    expect(names(snow.essential)).not.toContain("Traction devices (microspikes)");

    const mud = build({ trailConditions: "not muddy" });
    expect(names(mud.optional)).not.toContain("Waterproof boots or gaiters");
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
      (item) => item.name === "Check official alerts before leaving",
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
      (item) => item.name === "Check official alerts before leaving",
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
});
