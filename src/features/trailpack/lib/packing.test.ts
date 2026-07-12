import { describe, expect, it } from "vitest";
import {
  analyzeTrailConditions,
  BEAR_AWARE_LOCATIONS_URL,
  CDC_HEAT_STRESS_RECOMMENDATIONS_URL,
  generateManualEntryRecommendation,
  generatePackingRecommendation,
  GRTE_BEAR_SAFETY_URL,
  NPS_HEAT_ILLNESS_URL,
  NPS_HIKE_SMART_URL,
  NPS_TEN_ESSENTIALS_URL,
  NPS_WATER_TREATMENT_URL,
  isOfficialNpsAlert,
  parseExpectedHours,
  type UserHikeInput,
} from "@/features/trailpack/lib/packing";
import {
  JENNY_LAKE_LOOP,
  STRING_LAKE_LOOP,
  SUPPORTED_TRAILS,
  TAGGART_LAKE,
} from "@/features/trailpack/data/supported-trails";
import { DEMO_CONTEXTS } from "@/features/trailpack/data/demo-contexts";
import type {
  AlertContext,
  PackingItem,
  PackingRecommendation,
  WeatherContext,
} from "@/features/trailpack/types";

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

const JENNY_SUMMER_DAYLIGHT_WEATHER: WeatherContext = {
  ...CLEAR_WEATHER,
  plannedDate: "2026-06-15",
  timezone: "America/Denver",
  daylight: {
    date: "2026-06-15",
    sunrise: "2026-06-15T05:38:37-06:00",
    sunset: "2026-06-15T21:08:20-06:00",
    civilTwilightBegin: "2026-06-15T05:04:20-06:00",
    civilTwilightEnd: "2026-06-15T21:42:37-06:00",
    dayLengthSeconds: 55783,
    timezone: "America/Denver",
    source: "sunrise-sunset",
    retrievalStatus: "live",
  },
};

const EXTREME_HEAT_WEATHER: WeatherContext = {
  ...CLEAR_WEATHER,
  summary: "Extreme heat warning with exposed sun and very hot afternoon temperatures.",
  temperatureF: { high: 101, low: 68, current: 93 },
  precipitationChance: 0,
  conditions: ["sun", "heat"],
  label: "forecast-based",
};

function build(userInput: UserHikeInput = {}, weather: WeatherContext = CLEAR_WEATHER) {
  return generatePackingRecommendation(JENNY_LAKE_LOOP, weather, NO_ALERTS, userInput);
}

function names(items: PackingItem[]): string[] {
  return items.map((item) => item.name);
}

function allItems(rec: PackingRecommendation): PackingItem[] {
  return [...rec.essential, ...rec.optional];
}

function itemNamed(rec: PackingRecommendation, itemName: string): PackingItem {
  const item = allItems(rec).find((candidate) => candidate.name === itemName);
  expect(item, `${itemName} should be present`).toBeDefined();
  return item as PackingItem;
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
  it("adds a headlamp and extra food for a long planned day (>= 6h) when daylight context is missing", () => {
    const rec = build({ expectedDuration: "7 hours" });
    expect(names(rec.essential)).toContain("Headlamp");
    expect(names(rec.optional)).toContain("Extra food reserve");
  });

  it("does not make a headlamp essential when summer daylight covers the plan", () => {
    const rec = build(
      { expectedDuration: "7 hours", startTime: "10:00" },
      JENNY_SUMMER_DAYLIGHT_WEATHER,
    );

    expect(names(rec.essential)).not.toContain("Headlamp");
    const headlamp = rec.optional.find((item) => item.name === "Headlamp");
    expect(headlamp?.reason).toMatch(/backup/i);
    expect(headlamp?.reason).toMatch(/before civil twilight ends/i);
  });

  it("accepts native time inputs that include seconds", () => {
    const rec = build(
      { expectedDuration: "7 hours", startTime: "10:00:00" },
      JENNY_SUMMER_DAYLIGHT_WEATHER,
    );

    expect(names(rec.essential)).not.toContain("Headlamp");
    const headlamp = rec.optional.find((item) => item.name === "Headlamp");
    expect(headlamp?.reason).toMatch(/backup/i);
  });

  it("accepts plain-language AM and PM start times", () => {
    const rec = build(
      { expectedDuration: "7 hours", startTime: "10 AM" },
      JENNY_SUMMER_DAYLIGHT_WEATHER,
    );

    expect(names(rec.essential)).not.toContain("Headlamp");
    const headlamp = rec.optional.find((item) => item.name === "Headlamp");
    expect(headlamp?.reason).toMatch(/backup/i);
  });

  it("adds an optional headlamp when the plan ends after sunset but before civil twilight", () => {
    const rec = build(
      { expectedDuration: "30 minutes", startTime: "20:45" },
      JENNY_SUMMER_DAYLIGHT_WEATHER,
    );

    expect(names(rec.essential)).not.toContain("Headlamp");
    const headlamp = rec.optional.find((item) => item.name === "Headlamp");
    expect(headlamp?.reason).toMatch(/after sunset/i);
    expect(headlamp?.sourceLabels).toEqual(["user-provided", "daylight", "inferred"]);
  });

  it("makes a headlamp essential when the plan ends after civil twilight", () => {
    const rec = build(
      { expectedDuration: "4 hours", startTime: "18:30" },
      JENNY_SUMMER_DAYLIGHT_WEATHER,
    );

    const headlamp = rec.essential.find((item) => item.name === "Headlamp");
    expect(headlamp?.reason).toMatch(/after civil twilight/i);
    expect(headlamp?.sourceLabels).toEqual(["user-provided", "daylight", "inferred"]);
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
        (item) =>
          item.name === "Water" &&
          item.sourceLabels.includes("user-provided"),
      ),
    ).toBe(false);
  });

  it("scales food and water for an 18 hour supported-trail day", () => {
    const rec = build({ expectedDuration: "18 hrs" });

    const timing = rec.tripAlerts.find((alert) => alert.id === "unusual-duration");
    expect(timing).toBeDefined();
    expect(timing?.summary).toMatch(/18 hr/i);
    expect(timing?.summary).toMatch(/3-5 Hours/i);
    expect(timing?.summary).toMatch(/side trip|closure detour|non-standard route/i);

    const water = itemNamed(rec, "Water");
    expect(water.recommendation).toMatch(/3-4 liters per adult/i);
    expect(water.recommendation).toMatch(/Drink according to thirst/i);
    expect(water.why).toMatch(/18 hr/i);
    expect(water.why).toMatch(/distance|1040 ft|moderate/i);
    expect(water.contextNotes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ label: "Long-day limit" }),
      ]),
    );

    const logistics = itemNamed(rec, "Water filter or treatment backup");
    expect(names(rec.optional)).toContain("Water filter or treatment backup");
    expect(logistics.recommendation).toMatch(/filter|purification tablets|boil/i);
    expect(logistics.recommendation).toMatch(/Optional/i);
    expect(logistics.why).toMatch(/verified/i);
    expect(logistics.why).not.toMatch(/Jenny Lake has water|String Lake has water|Taggart Lake has water/i);
    expect(logistics.sourceLabels).toContain("official");
    expect(logistics.sourceUrl).toBe(NPS_WATER_TREATMENT_URL);

    const food = itemNamed(rec, "Food");
    expect(food.recommendation).toMatch(/2 meals/i);
    expect(food.recommendation).toMatch(/6-8 trail snacks per person/i);
    expect(food.why).toMatch(/18 hr/i);
    expect(food.why).toMatch(/7\.1 mi|1040 ft|moderate/i);
    expect(names(rec.essential)).toContain("Extra food reserve");
    expect(names(rec.optional)).not.toContain("Extra food reserve");
  });

  it("flags planned times that are far outside the supported trail profile", () => {
    const rec = generatePackingRecommendation(
      TAGGART_LAKE,
      DEMO_CONTEXTS["taggart-lake"].weather,
      NO_ALERTS,
      { expectedDuration: "7 hours" },
    );

    const timing = rec.tripAlerts.find((alert) => alert.id === "unusual-duration");
    expect(names(rec.essential)).not.toContain("Trip timing check");
    expect(timing).toBeDefined();
    expect(timing?.summary).toMatch(/7 hr/i);
    expect(timing?.summary).toMatch(/1-2 Hours/i);
    expect(timing?.summary).toMatch(/side trip|non-standard route/i);
  });

  it("raises the long-day water upper range for hot or exposed weather", () => {
    const rec = generatePackingRecommendation(
      STRING_LAKE_LOOP,
      DEMO_CONTEXTS["string-lake-loop"].weather,
      NO_ALERTS,
      { expectedDuration: "18 hrs" },
    );

    const water = itemNamed(rec, "Water");
    expect(water.recommendation).toMatch(/3-4 liters per adult/i);
    expect(water.why).toMatch(/heat|full sun/i);
    expect(rec.tripAlerts.map((alert) => alert.id)).toContain("heat-sun");
  });
});

describe("trail-condition rules", () => {
  it("adds traction devices when snow or ice is reported", () => {
    const rec = build({ trailConditions: "icy switchbacks" });
    expect(names(rec.essential)).toContain("Traction devices (microspikes)");
    const traction = itemNamed(rec, "Traction devices (microspikes)");
    expect(traction.recommendation).toMatch(/pull-on traction/i);
    expect(traction.recommendation).toMatch(/fit your shoes or boots/i);
    expect(traction.why).toMatch(/small metal traction devices/i);
    expect(traction.why).toMatch(/buy or rent/i);
  });

  it("adds waterproof footwear when mud is reported", () => {
    const rec = build({ trailConditions: "muddy sections" });
    expect(names(rec.essential)).toContain("Trail footwear");
    expect(names(rec.optional)).not.toContain("Waterproof footwear or gaiters");
    expect(names(rec.optional)).toContain("Extra dry socks");
    const footwear = itemNamed(rec, "Trail footwear");
    expect(footwear.answer).toMatch(/waterproof hiking shoes|gaiters/i);
    const socks = itemNamed(rec, "Extra dry socks");
    expect(socks.recommendation).toMatch(/Pack one dry pair/i);
    expect(socks.why).toMatch(/blister risk/i);
  });

  it("does not add traction for dry conditions", () => {
    const rec = build({ trailConditions: "dry and clear" });
    expect(names(rec.essential)).not.toContain("Traction devices (microspikes)");
    expect(names(rec.optional)).not.toContain("Waterproof footwear or gaiters");
    expect(names(rec.optional)).toContain("Extra dry socks");
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

  it("scopes negation per clause", () => {
    expect(analyzeTrailConditions("no snow, icy bridge").snowOrIce).toBe(true);
    expect(analyzeTrailConditions("no snow. ice on the rocks").snowOrIce).toBe(true);
    expect(analyzeTrailConditions("no snow but icy switchbacks").snowOrIce).toBe(true);
    expect(
      analyzeTrailConditions("no standing water, wet rocks everywhere").muddyOrWet,
    ).toBe(true);
    expect(analyzeTrailConditions("no snow or ice").snowOrIce).toBe(false);
    expect(analyzeTrailConditions("no mud or standing water").muddyOrWet).toBe(false);
  });

  it("adds microspikes when a later clause reports ice", () => {
    const rec = build({ trailConditions: "no snow, icy bridge" });
    expect(names(rec.essential)).toContain("Traction devices (microspikes)");
  });

  it("does not add recommendations for negated reports", () => {
    const snow = build({ trailConditions: "no snow or ice" });
    expect(names(snow.essential)).not.toContain("Traction devices (microspikes)");

    const mud = build({ trailConditions: "not muddy" });
    expect(names(mud.optional)).not.toContain("Waterproof footwear or gaiters");

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
    const rec = build({
      expectedDuration: "5 hours",
      startTime: "10:00",
      trailConditions: "dry",
    });
    const joined = rec.missingDetails.join(" ");
    expect(joined).not.toMatch(/expected time out/i);
    expect(joined).not.toMatch(/start time/i);
    expect(joined).not.toMatch(/Current trail conditions/i);
  });

  it("notes details when nothing is provided", () => {
    const rec = build();
    expect(rec.missingDetails.length).toBeGreaterThan(0);
    expect(rec.missingDetails.join(" ")).toMatch(/start time/i);
  });

  it("does not require a planned date before showing packing guidance", () => {
    const rec = build();
    expect(rec.missingDetails.join(" ")).not.toMatch(/planned hike date/i);
  });
});

describe("scenario polish", () => {
  it("uses lighter food wording for a short easy hike", () => {
    const rec = generatePackingRecommendation(
      TAGGART_LAKE,
      DEMO_CONTEXTS["taggart-lake"].weather,
      NO_ALERTS,
      {},
    );
    expect(names(rec.essential)).toContain("Food");
    const food = itemNamed(rec, "Food");
    expect(food.answer).toMatch(/1-2 easy trail snacks per person/i);
    expect(food.answer).not.toMatch(/lunch plus 2-3/i);
    const firstAid = rec.essential.find((item) => item.name === "First-aid basics");
    expect(firstAid?.reason).not.toMatch(/moderate full-day loop/i);
  });

  it("adds heat support for a hot exposed scenario", () => {
    const rec = generatePackingRecommendation(
      STRING_LAKE_LOOP,
      DEMO_CONTEXTS["string-lake-loop"].weather,
      NO_ALERTS,
      {},
    );
    expect(names(rec.essential)).toContain("Water");
    const water = itemNamed(rec, "Water");
    expect(water.answer).toMatch(/2-3 liters per adult/i);
    expect(names(rec.essential)).toContain("Electrolytes");
    expect(names(rec.optional)).toContain("Salty snacks");
    expect(names(rec.optional)).not.toContain("Electrolytes");
    expect(itemNamed(rec, "Electrolytes").links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: CDC_HEAT_STRESS_RECOMMENDATIONS_URL }),
      ]),
    );
    expect(itemNamed(rec, "Salty snacks").sourceUrl).toBe(NPS_HEAT_ILLNESS_URL);
    expect(names(rec.optional)).toContain("Breathable sun layer");
    const firstAid = rec.essential.find((item) => item.name === "First-aid basics");
    expect(firstAid?.reason).not.toMatch(/full-day loop/i);
  });

  it("uses salty snacks as the primary salt source for a long non-hot day", () => {
    const rec = generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      DEMO_CONTEXTS["jenny-lake-loop"].weather,
      NO_ALERTS,
      { expectedDuration: "12 hours" },
    );

    expect(names(rec.essential)).toContain("Salty snacks");
    expect(names(rec.optional)).toContain("Electrolytes");
    expect(names(rec.essential)).not.toContain("Electrolytes");
    expect(itemNamed(rec, "Salty snacks").recommendation).toMatch(/at least one salty snack/i);
    expect(itemNamed(rec, "Electrolytes").recommendation).toMatch(/Optional backup/i);
  });
});

describe("seasonal insect guidance", () => {
  it("adds optional insect repellent during regional bug season", () => {
    const rec = generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      DEMO_CONTEXTS["jenny-lake-loop"].weather,
      NO_ALERTS,
      {},
    );

    const repellent = itemNamed(rec, "Insect repellent");
    expect(names(rec.optional)).toContain("Insect repellent");
    expect(repellent.question).toBe("Should I bring bug spray?");
    expect(repellent.recommendation).toMatch(/EPA-registered insect repellent/i);
    expect(repellent.recommendation).toMatch(/long sleeves|netting|pants/i);
    expect(repellent.why).toMatch(/NPS Hike Smart/i);
    expect(repellent.why).toMatch(/mosquitoes|ticks/i);
    expect(repellent.why).toMatch(/June|spring|summer/i);
    expect(repellent.why).not.toMatch(/Yellowstone/i);
    expect(repellent.sourceLabels).toContain("official");
    expect(repellent.sourceUrl).toBe(NPS_HIKE_SMART_URL);
    expect(repellent.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "NPS Hike Smart",
          url: NPS_HIKE_SMART_URL,
        }),
      ]),
    );
    expect(repellent.links).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: expect.stringMatching(/Yellowstone/i),
        }),
      ]),
    );
  });

  it("does not add insect repellent outside regional bug season", () => {
    const winterWeather: WeatherContext = {
      ...CLEAR_WEATHER,
      plannedDate: "2026-12-15",
    };

    const rec = generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      winterWeather,
      NO_ALERTS,
      {},
    );

    expect(names(rec.optional)).not.toContain("Insect repellent");
  });

  it("uses manual planned dates for seasonal insect guidance", () => {
    const summer = generateManualEntryRecommendation({ plannedDate: "2026-07-01" });
    expect(names(summer.optional)).toContain("Insect repellent");

    const winter = generateManualEntryRecommendation({ plannedDate: "2026-12-01" });
    expect(names(winter.optional)).not.toContain("Insect repellent");
  });
});

describe("question-answer recommendation copy", () => {
  it("gives every generated item a concrete question and answer", () => {
    const scenarios = [
      build({ expectedDuration: "7 hours", trailConditions: "muddy and icy" }),
      generatePackingRecommendation(
        TAGGART_LAKE,
        DEMO_CONTEXTS["taggart-lake"].weather,
        NO_ALERTS,
        {},
      ),
      generateManualEntryRecommendation({
        expectedDuration: "7 hours",
        trailConditions: "muddy",
        distanceMiles: "6",
        elevationGainFeet: "900",
      }),
    ];

    for (const rec of scenarios) {
      for (const item of allItems(rec)) {
        expect(item.question?.trim(), `${item.name} needs a question`).toBeTruthy();
        expect(item.recommendation?.trim(), `${item.name} needs a recommendation`).toBeTruthy();
        expect(item.why?.trim(), `${item.name} needs a why`).toBeTruthy();
        expect(item.answer?.trim(), `${item.name} needs an answer`).toBeTruthy();
        expect(item.answer, `${item.name} should not use vague food wording`).not.toMatch(
          /pack (a little )?more food/i,
        );
        expect(item.recommendation, `${item.name} should lead with the action`).not.toMatch(
          /\b(because|since|due to)\b/i,
        );
      }
    }
  });

  it("answers the main Jenny Lake packing questions with specifics", () => {
    const rec = generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      DEMO_CONTEXTS["jenny-lake-loop"].weather,
      NO_ALERTS,
      {},
    );

    const shoes = itemNamed(rec, "Trail footwear");
    expect(shoes.question).toBe("What footwear setup fits this hike?");
    expect(shoes.recommendation).toMatch(/trail runners|hiking shoes/i);
    expect(shoes.why).toMatch(/7\.1 mi|1040 ft|moderate/i);
    expect(shoes.answer).toMatch(/trail runners|hiking shoes/i);
    expect(shoes.answer).toMatch(/tennis shoes/i);

    const socks = itemNamed(rec, "Extra dry socks");
    expect(socks.question).toBe("Should I bring extra socks?");
    expect(socks.recommendation).toMatch(/Pack one dry pair/i);
    expect(socks.why).toMatch(/Wet socks increase friction and blister risk/i);

    const water = itemNamed(rec, "Water");
    expect(water.question).toBe("How much water should I bring?");
    expect(water.recommendation).toMatch(/2-3 liters per adult/i);
    expect(water.recommendation).toMatch(/not.*group total/i);
    expect(water.why).toMatch(/7\.1 mi|3-5 hours/i);
    expect(water.why).not.toMatch(/Bring 2-3 liters/i);
    expect(water.answer).toMatch(/2-3 liters per adult/i);
    expect(water.answer).toMatch(/not.*group total/i);

    const food = itemNamed(rec, "Food");
    expect(food.question).toBe("How much food should I bring?");
    expect(food.recommendation).toMatch(/lunch plus 2-3 trail snacks per person/i);
    expect(food.why).toMatch(/3-5 hours/i);
    expect(food.answer).toMatch(/lunch plus 2-3 trail snacks per person/i);
    expect(food.answer).toMatch(/bars|trail mix|sandwich/i);

    const firstAid = itemNamed(rec, "First-aid basics");
    expect(firstAid.question).toBe("What first-aid supplies are actually basic?");
    expect(firstAid.answer).toMatch(/blister pads|moleskin/i);
    expect(firstAid.answer).toMatch(/bandages/i);
    expect(firstAid.answer).toMatch(/antiseptic wipes/i);
    expect(firstAid.answer).toMatch(/pain reliever/i);
    expect(firstAid.answer).toMatch(/personal medications/i);

    const bearSpray = itemNamed(rec, "Bear spray");
    expect(bearSpray.question).toBe("Do I need bear spray, and where do I get it?");
    expect(bearSpray.recommendation).toMatch(/carry bear spray/i);
    expect(bearSpray.recommendation).toMatch(/one.*can.*per adult/i);
    expect(bearSpray.recommendation).toMatch(/rent|buy/i);
    expect(bearSpray.why).toMatch(/NPS/i);
    expect(bearSpray.why).toMatch(/Grand Teton/i);
    expect(bearSpray.answer).toMatch(/NPS/i);
    expect(bearSpray.answer).toMatch(/immediately reachable|not buried/i);
    expect(bearSpray.answer).toMatch(/rent|buy/i);
    expect(bearSpray.links).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          label: "NPS bear spray guidance",
          url: GRTE_BEAR_SAFETY_URL,
        }),
        expect.objectContaining({
          label: "Bear Aware rental locations",
          url: BEAR_AWARE_LOCATIONS_URL,
        }),
      ]),
    );

    const sunProtection = itemNamed(rec, "Sun protection");
    expect(sunProtection.recommendation).toMatch(/UPF|long-sleeve sun shirt/i);
    expect(sunProtection.recommendation).toMatch(/sunscreen|sunglasses|hat/i);

    const navigation = itemNamed(rec, "Navigation / offline map");
    expect(navigation.question).toBe("What navigation should I carry?");
    expect(navigation.recommendation).toMatch(/offline map|GPS route/i);
    expect(navigation.recommendation).toMatch(/battery/i);
    expect(navigation.why).toMatch(/NPS Ten Essentials/i);
    expect(navigation.sourceUrl).toBe(NPS_TEN_ESSENTIALS_URL);

    const poles = itemNamed(rec, "Trekking poles");
    expect(poles.question).toBe("Are trekking poles recommended for this route?");
    expect(poles.recommendation).toMatch(/optional/i);
    expect(poles.why).toMatch(/1040 ft|descent|knees/i);
    expect(poles.answer).toMatch(/knee|descent/i);

    const layer = itemNamed(rec, "Light jacket or warm layer");
    expect(layer.question).toBe("Do I need an extra layer?");
    expect(layer.recommendation).toMatch(/light jacket|fleece|wind shirt|rain shell/i);
    expect(layer.answer).toMatch(/light jacket|wind|rain shell/i);
  });

  it("makes the warm layer essential in cold or snowy weather without summer wording", () => {
    const coldWeather: WeatherContext = {
      ...CLEAR_WEATHER,
      summary: "Cold with patchy snow and gusty wind on shaded trail sections.",
      temperatureF: { high: 38, low: 24, current: 32 },
      conditions: ["cold", "snow", "wind"],
    };
    const rec = build({ trailConditions: "patchy snow and ice" }, coldWeather);

    const layer = itemNamed(rec, "Light jacket or warm layer");
    expect(names(rec.essential)).toContain("Light jacket or warm layer");
    expect(layer.recommendation).toMatch(/insulating warm layer/i);
    expect(layer.recommendation).toMatch(/rain or wind shell/i);
    expect(layer.why).toMatch(/cold|snow|wind/i);
    expect(layer.answer).not.toMatch(/summer/i);
  });

  it("sizes short-hike food as snacks per person", () => {
    const rec = generatePackingRecommendation(
      TAGGART_LAKE,
      DEMO_CONTEXTS["taggart-lake"].weather,
      NO_ALERTS,
      {},
    );

    const food = itemNamed(rec, "Food");
    expect(food.question).toBe("How much food should I bring?");
    expect(food.answer).toMatch(/1-2/i);
    expect(food.answer).toMatch(/per person/i);
  });

  it("keeps wet or snowy sock guidance as a nearby optional item", () => {
    const rec = build({ trailConditions: "muddy with patchy snow" });

    expect(names(rec.optional)).not.toContain("Waterproof footwear or gaiters");
    expect(names(rec.optional)).toContain("Extra dry socks");
    const footwear = itemNamed(rec, "Trail footwear");
    expect(footwear.recommendation).toMatch(/waterproof hiking shoes|gaiters/i);
    expect(footwear.why).toMatch(/mud|snow|backup socks/i);
    expect(footwear.answer).toMatch(/waterproof hiking shoes|gaiters/i);
    const socks = itemNamed(rec, "Extra dry socks");
    expect(socks.recommendation).toMatch(/rain, mud, snow/i);
    expect(socks.why).toMatch(/blister risk/i);
  });

  it("keeps user-facing item names as recommendation topics, not visible questions", () => {
    const rec = build({ expectedDuration: "7 hours", trailConditions: "muddy" });

    expect(names(rec.essential)).toContain("Water");
    expect(names(rec.essential)).toContain("Food");
    expect(names(rec.essential)).toContain("Trail footwear");

    for (const item of allItems(rec)) {
      expect(item.name, `${item.name} should be a topic label`).not.toMatch(/\?/);
      expect(item.name, `${item.name} should not expose the hidden prompt`).not.toMatch(
        /^(what|why|how|do|should|can)\b/i,
      );
    }

    expect(itemNamed(rec, "Water").question).toMatch(/\?$/);
    expect(itemNamed(rec, "Food").question).toMatch(/\?$/);
  });
});

describe("manual entry fallback", () => {
  it("builds a limited baseline list for unsupported hikes", () => {
    const rec = generateManualEntryRecommendation({});
    expect(rec.trailId).toBe("manual-entry");
    expect(rec.trailName).toBe("Manual hike entry");
    expect(names(rec.essential)).toContain("Water");
    expect(names(rec.essential)).toContain("Food");
    expect(names(rec.essential)).toContain("First-aid basics");
    expect(rec.confidenceNote).toMatch(/limited fallback/i);
  });

  it("asks for manual trail facts that would improve the fallback list", () => {
    const rec = generateManualEntryRecommendation({});
    const joined = rec.missingDetails.join(" ");
    expect(joined).toMatch(/expected time/i);
    expect(joined).toMatch(/trail conditions/i);
    expect(joined).toMatch(/distance/i);
    expect(joined).toMatch(/elevation/i);
    expect(joined).toMatch(/route type/i);
  });

  it("responds to provided duration and trail conditions", () => {
    const rec = generateManualEntryRecommendation({
      expectedDuration: "7 hours",
      trailConditions: "icy and muddy",
    });
    expect(names(rec.essential)).toContain("Headlamp");
    expect(names(rec.essential)).toContain("Traction devices (microspikes)");
    expect(names(rec.optional)).toContain("Water filter or treatment backup");
    expect(names(rec.optional)).toContain("Extra food reserve");
    expect(names(rec.optional)).not.toContain("Waterproof footwear or gaiters");
    expect(names(rec.optional)).toContain("Extra dry socks");
    expect(names(rec.essential)).toContain("Salty snacks");
    expect(names(rec.optional)).toContain("Electrolytes");
    expect(itemNamed(rec, "Extra dry socks").why).toMatch(/blister risk/i);
    const joined = rec.missingDetails.join(" ");
    expect(joined).not.toMatch(/expected time/i);
    expect(joined).not.toMatch(/trail conditions/i);
  });

  it("uses manual distance and elevation gain to size water and food", () => {
    const rec = generateManualEntryRecommendation({
      distanceMiles: "6.2",
      elevationGainFeet: "900",
      routeType: "loop",
    });

    expect(names(rec.essential)).toContain("Water");
    expect(names(rec.essential)).toContain("Food");
    expect(rec.confidenceNote).toMatch(/6.2 mi/);
    expect(rec.confidenceNote).toMatch(/900 ft/);
    expect(rec.confidenceNote).toMatch(/loop/i);

    const joined = rec.missingDetails.join(" ");
    expect(joined).not.toMatch(/distance/i);
    expect(joined).not.toMatch(/elevation/i);
    expect(joined).not.toMatch(/route type/i);
  });

  it("scales manual fallback food and water for an 18 hour day", () => {
    const rec = generateManualEntryRecommendation({
      expectedDuration: "18 hrs",
      distanceMiles: "7",
      elevationGainFeet: "1000",
    });

    const water = itemNamed(rec, "Water");
    expect(water.recommendation).toMatch(/3-4 liters per adult/i);
    expect(water.recommendation).toMatch(/Drink according to thirst/i);
    const logistics = itemNamed(rec, "Water filter or treatment backup");
    expect(names(rec.optional)).toContain("Water filter or treatment backup");
    expect(logistics.recommendation).toMatch(/filter|purification tablets|boil/i);
    expect(logistics.why).toMatch(/verified/i);
    expect(logistics.sourceUrl).toBe(NPS_WATER_TREATMENT_URL);

    const food = itemNamed(rec, "Food");
    expect(food.recommendation).toMatch(/2 meals/i);
    expect(food.recommendation).toMatch(/6-8 trail snacks per person/i);

    expect(names(rec.essential)).toContain("Extra food reserve");
    expect(names(rec.optional)).not.toContain("Extra food reserve");
  });

  it("adds a route-planning item for point-to-point manual hikes", () => {
    const rec = generateManualEntryRecommendation({
      routeType: "point-to-point",
    });

    expect(names(rec.optional)).toContain("Route plan or shuttle check");
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

  it("backs the navigation item with the official NPS Ten Essentials source", () => {
    const rec = build();
    const navigation = rec.essential.find(
      (item) => item.name === "Navigation / offline map",
    );

    expect(navigation).toBeDefined();
    expect(navigation?.sourceLabels).toContain("official");
    expect(navigation?.sourceLabels).toContain("inferred");
    expect(navigation?.sourceUrl).toBe(NPS_TEN_ESSENTIALS_URL);
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

  it("separates required preparedness from trip-decision danger", () => {
    const rec = build();

    expect(names(rec.essential)).toContain("Bear spray");
    expect(names(rec.essential)).not.toContain("Trip safety decision");

    const bearSpray = itemNamed(rec, "Bear spray");
    expect(bearSpray.recommendation).toMatch(/Carry bear spray/i);
    expect(bearSpray.why).not.toMatch(/delay|reroute|do not start/i);
  });

  it("adds a trip safety decision for flash flood warnings", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "Flash Flood Warning",
          description:
            "Flash flooding is possible in drainages, low spots, and creek crossings.",
          severity: "caution",
          source: "NPS",
          sourceUrl: "https://www.nps.gov/grte/planyourvisit/conditions.htm",
        },
      ],
      label: "official",
    };

    const rec = generatePackingRecommendation(JENNY_LAKE_LOOP, CLEAR_WEATHER, alerts, {});
    const decision = itemNamed(rec, "Trip safety decision");
    const footwear = itemNamed(rec, "Trail footwear");
    const alert = rec.tripAlerts.find((item) => item.id === "active-alerts");

    expect(alert?.severity).toBe("danger");
    expect(alert?.title).toMatch(/Flash flood/i);
    expect(alert?.affectedBy).toEqual(
      expect.arrayContaining(["Critical danger", "Flash flood", "Official alert"]),
    );
    expect(decision.recommendation).toMatch(/Do not start/i);
    expect(decision.recommendation).toMatch(/Delay|turn back/i);
    expect(decision.why).toMatch(/gear does not make/i);
    expect(decision.why).toMatch(/different from non-negotiable gear like bear spray/i);
    expect(decision.affectedBy).toEqual(
      expect.arrayContaining(["Critical danger", "Flash flood", "Official alert"]),
    );
    expect(footwear.recommendation).toMatch(/grippier trail runners|hiking shoes/i);
    expect(footwear.recommendation).toMatch(/flood|storm alerts/i);
    expect(footwear.affectedBy).toContain("Official alert");
    expect(decision.sourceLabels).toContain("official");
    expect(decision.sourceUrl).toBe("https://www.nps.gov/grte/planyourvisit/conditions.htm");
  });

  it("adds a trip safety decision for closure alerts", () => {
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
    const decision = itemNamed(rec, "Trip safety decision");

    expect(decision.recommendation).toMatch(/Do not start the closed route/i);
    expect(decision.why).toMatch(/A closure is a trip decision/i);
    expect(names(rec.essential)).toContain("Review active alerts before leaving");
  });

  it("adds a forecast-based trip safety decision for dangerous heat", () => {
    const rec = generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      EXTREME_HEAT_WEATHER,
      NO_ALERTS,
      { expectedDuration: "4 hours" },
    );
    const decision = itemNamed(rec, "Trip safety decision");
    const dangerAlert = rec.tripAlerts.find((item) => item.id === "dangerous-heat");

    expect(dangerAlert?.severity).toBe("danger");
    expect(dangerAlert?.affectedBy).toEqual(
      expect.arrayContaining(["Critical danger", "Extreme heat", "Heat"]),
    );
    expect(decision.recommendation).toMatch(/Do not treat extra water/i);
    expect(decision.recommendation).toMatch(/Start much earlier|move the hike/i);
    expect(decision.sourceLabels).toContain("forecast-based");
    expect(decision.sourceLabels).not.toContain("official");
    expect(names(rec.essential)).not.toContain("Review active alerts before leaving");
  });

  it("uses official extreme heat alerts without duplicating the forecast heat alert", () => {
    const alerts: AlertContext = {
      hasActiveAlerts: true,
      alerts: [
        {
          title: "Extreme Heat Warning",
          description:
            "Dangerous heat is expected. Heat illness risk can become serious during exposed hiking even with extra water.",
          severity: "caution",
          source: "NPS",
          sourceUrl: "https://www.nps.gov/grte/planyourvisit/conditions.htm",
        },
      ],
      label: "official",
    };

    const rec = generatePackingRecommendation(
      JENNY_LAKE_LOOP,
      EXTREME_HEAT_WEATHER,
      alerts,
      { expectedDuration: "4 hours" },
    );
    const activeAlert = rec.tripAlerts.find((item) => item.id === "active-alerts");
    const decision = itemNamed(rec, "Trip safety decision");

    expect(activeAlert?.title).toMatch(/Extreme heat danger/i);
    expect(activeAlert?.affectedBy).toEqual(
      expect.arrayContaining(["Critical danger", "Extreme heat", "Heat", "Official alert"]),
    );
    expect(rec.tripAlerts.some((item) => item.id === "dangerous-heat")).toBe(false);
    expect(decision.sourceLabels).toContain("official");
  });

  it("surfaces the saved Taggart 2026 NPS trail-work alert", () => {
    const scenario = DEMO_CONTEXTS["taggart-lake"];
    const rec = generatePackingRecommendation(
      TAGGART_LAKE,
      scenario.weather,
      scenario.alerts,
      {},
    );

    const alertItem = rec.essential.find(
      (item) => item.name === "Review active alerts before leaving",
    );
    expect(alertItem).toBeDefined();
    expect(alertItem?.sourceLabels).toContain("official");
    expect(alertItem?.sourceUrl).toBe("https://www.nps.gov/thingstodo/taggartlake.htm");
    expect(alertItem?.answer).toMatch(/Taggart Trail 2026 construction closure/i);
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

describe("supported trail coverage", () => {
  it("generates recommendations for every supported trail profile", () => {
    for (const trail of Object.values(SUPPORTED_TRAILS)) {
      const rec = generatePackingRecommendation(trail, CLEAR_WEATHER, NO_ALERTS, {});
      expect(rec.trailName).toBe(trail.name);
      expect(rec.essential.length).toBeGreaterThan(0);
      expect(rec.optional.length).toBeGreaterThan(0);
    }
  });
});
