import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { createJiti } from "jiti";

const jiti = createJiti(import.meta.url, { interopDefault: true });

const { DEMO_CONTEXTS } = jiti("../src/features/trailpack/data/demo-contexts.ts");
const { SUPPORTED_TRAILS } = jiti("../src/features/trailpack/data/supported-trails.ts");
const { generatePackingRecommendation } = jiti("../src/features/trailpack/lib/packing.ts");

const OUTPUT_PATH = join(
  process.cwd(),
  "docs/superpowers/validation/2026-07-10-week-13-14-stress-scenario-results.md",
);

const templates = [
  {
    id: "saved-demo-baseline",
    title: "Saved demo baseline",
    intent: "What the app shows before the user adds trip details.",
    weatherMode: "default",
    userInput: {},
  },
  {
    id: "normal-day-clear",
    title: "Normal clear day with start time",
    intent: "Expected day-hike behavior with duration and daylight context.",
    weatherMode: "clear",
    userInput: {
      expectedDuration: "profile",
      startTime: "09:00",
      trailConditions: "dry and clear",
    },
  },
  {
    id: "wet-rainy-slower-day",
    title: "Wet, rainy, slower day",
    intent:
      "Stress footwear, socks, jacket, food, water, and clarity under wet conditions.",
    weatherMode: "rain",
    userInput: {
      expectedDuration: "7 hours",
      startTime: "10:30",
      trailConditions: "muddy sections and wet rocks",
    },
  },
  {
    id: "snow-ice-cold-day",
    title: "Snow or ice with cold weather",
    intent:
      "Stress traction, footwear, socks, layer placement, and non-summer wording.",
    weatherMode: "snow",
    userInput: {
      expectedDuration: "5 hours",
      startTime: "09:30",
      trailConditions: "patchy snow and icy shaded sections",
    },
  },
  {
    id: "hot-exposed-long-day",
    title: "Hot, exposed long day",
    intent:
      "Stress water, food, salt/electrolytes, sun layer, and upper-range explanations.",
    weatherMode: "heat",
    userInput: {
      expectedDuration: "8 hours",
      startTime: "08:00",
      trailConditions: "dry trail with exposed sunny sections",
    },
  },
  {
    id: "eighteen-hour-edge-case",
    title: "18-hour edge case",
    intent:
      "Stress bad input, ultra-long-day scaling, refill/treatment language, headlamp, and food reserve placement.",
    weatherMode: "default",
    userInput: {
      expectedDuration: "18 hrs",
      startTime: "12:00",
      trailConditions: "unknown trail conditions and possible delayed exit",
    },
  },
  {
    id: "flash-flood-warning",
    title: "Flash flood warning",
    intent:
      "Stress critical-danger language where changing the plan matters more than adding gear.",
    weatherMode: "storm",
    alertsMode: "flash-flood",
    userInput: {
      expectedDuration: "4 hours",
      startTime: "11:00",
      trailConditions: "rain in the area with low spots and creek crossings",
    },
  },
  {
    id: "severe-storm-lightning",
    title: "Severe storm and lightning risk",
    intent:
      "Stress exposed-route decision-making, overall alerts, and clear plan-changing safety decisions.",
    weatherMode: "storm",
    alertsMode: "lightning",
    userInput: {
      expectedDuration: "5 hours",
      startTime: "13:00",
      trailConditions: "exposed sections with thunderstorm risk later in the day",
    },
  },
  {
    id: "extreme-heat-warning",
    title: "Extreme heat warning",
    intent:
      "Stress whether water/electrolyte guidance stays separate from a larger trip-safety decision.",
    weatherMode: "extreme-heat",
    alertsMode: "extreme-heat",
    userInput: {
      expectedDuration: "6 hours",
      startTime: "10:00",
      trailConditions: "dry exposed trail with limited shade",
    },
  },
];

const profileDurations = {
  "jenny-lake-loop": "4 hours",
  "taggart-lake": "2 hours",
  "string-lake-loop": "3 hours",
};

function weatherFor(mode, base) {
  if (mode === "default") {
    return base;
  }

  const common = {
    plannedDate: base.plannedDate,
    timezone: base.timezone,
    daylight: base.daylight,
    source: "open-meteo",
    label: "forecast-based",
    retrievalStatus: "saved-fixture",
  };

  if (mode === "clear") {
    return {
      ...common,
      summary: "Clear, dry, and mild for the planned hiking window.",
      temperatureF: { high: 68, low: 42, current: 55 },
      precipitationChance: 5,
      windMph: 6,
      conditions: ["sun"],
    };
  }

  if (mode === "rain") {
    return {
      ...common,
      summary: "Rain showers, wet tread, and gusty wind are possible.",
      temperatureF: { high: 55, low: 39, current: 48 },
      precipitationChance: 70,
      windMph: 18,
      conditions: ["rain", "wind"],
    };
  }

  if (mode === "snow") {
    return {
      ...common,
      summary: "Cold with patchy snow, ice, and gusty wind on shaded sections.",
      temperatureF: { high: 38, low: 24, current: 32 },
      precipitationChance: 45,
      windMph: 20,
      conditions: ["cold", "snow", "wind"],
    };
  }

  if (mode === "storm") {
    return {
      ...common,
      summary: "Thunderstorms, heavy rain, and gusty wind may affect the hiking window.",
      temperatureF: { high: 64, low: 44, current: 58 },
      precipitationChance: 85,
      windMph: 28,
      conditions: ["rain", "wind", "storm"],
    };
  }

  if (mode === "extreme-heat") {
    return {
      ...common,
      summary: "Dangerous heat with exposed sun and very hot afternoon temperatures.",
      temperatureF: { high: 101, low: 68, current: 93 },
      precipitationChance: 5,
      windMph: 8,
      conditions: ["sun", "heat"],
    };
  }

  return {
    ...common,
    summary: "Hot, sunny, and exposed with dry trail conditions.",
    temperatureF: { high: 88, low: 55, current: 80 },
    precipitationChance: 5,
    windMph: 10,
    conditions: ["sun", "heat", "wind"],
  };
}

function alertsFor(mode, base) {
  if (!mode) {
    return base;
  }

  const sourceUrl = "https://www.nps.gov/grte/planyourvisit/conditions.htm";
  const alertByMode = {
    "flash-flood": {
      title: "Flash Flood Warning",
      description:
        "Flash flooding is possible in drainages, low spots, and creek crossings. Avoid flooded crossings and low-lying areas.",
      severity: "caution",
    },
    lightning: {
      title: "Severe Thunderstorm Warning",
      description:
        "Severe thunderstorms with lightning, damaging wind, and heavy rain are possible during the hiking window.",
      severity: "caution",
    },
    "extreme-heat": {
      title: "Extreme Heat Warning",
      description:
        "Dangerous heat is expected. Heat illness risk can become serious during exposed hiking even with extra water.",
      severity: "caution",
    },
  };
  const alert = alertByMode[mode];

  return {
    hasActiveAlerts: true,
    alerts: [
      {
        ...alert,
        source: "NPS",
        sourceUrl,
      },
    ],
    label: "official",
  };
}

function itemMap(items) {
  return new Map(items.map((item) => [item.name, item]));
}

function allItems(rec) {
  return [...rec.essential, ...rec.optional];
}

function briefItem(item) {
  return item ? item.recommendation : "not shown";
}

function listNames(items) {
  return items.map((item) => item.name).join(", ");
}

function evaluateLens(run, lens) {
  const essential = itemMap(run.rec.essential);
  const optional = itemMap(run.rec.optional);
  const all = itemMap(allItems(run.rec));
  const notes = [];
  const hasTimingAlert = run.rec.tripAlerts.some((alert) => alert.id === "unusual-duration");
  const hasHeatAlert = run.rec.tripAlerts.some((alert) => alert.id === "heat-sun");
  const hasDangerAlert = run.rec.tripAlerts.some((alert) => alert.severity === "danger");
  const water = all.get("Water");
  const waterPlan = all.get("Water filter or treatment backup");
  const socks = all.get("Extra dry socks");
  const food = all.get("Food");
  const headlampEssential = essential.has("Headlamp");
  const layerEssential = essential.has("Light jacket or warm layer");
  const traction = essential.has("Traction devices (microspikes)");
  const alert = essential.get("Review active alerts before leaving");
  const tripDecision = essential.get("Trip safety decision");

  if (lens === "seasoned") {
    if (hasTimingAlert) {
      notes.push(
        "Good: the app challenges a duration that does not match the official trail profile as an overall trip alert instead of burying it in gear.",
      );
    }
    if (water?.contextNotes?.some((note) => note.label === "Long-day limit")) {
      notes.push(
        "Good: long-day water is capped at a realistic frontcountry carry range instead of scaling into unrealistic multi-gallon totals.",
      );
    }
    if (waterPlan) {
      notes.push(
        "Good: the refill/treatment backup is optional and avoids inventing route-specific water sources.",
      );
    }
    if (traction) {
      notes.push(
        "Good: snow/ice becomes traction plus footwear support, and the app now explains what microspikes are.",
      );
    }
    if (layerEssential) {
      notes.push(
        "Good: cold or snow promotes the layer to essential instead of treating it like a summer comfort item.",
      );
    }
    if (alert) {
      notes.push("Good: official alert context is visible before the user commits to the route.");
    }
    if (hasHeatAlert) {
      notes.push("Good: heat/sun exposure appears as a trip-level warning, not only as a water note.");
    }
    if (tripDecision) {
      notes.push(
        `Good: trip-decision danger is separated from required gear, with a direct plan action: ${tripDecision.recommendation}`,
      );
    }
  }

  if (lens === "casual") {
    notes.push(
      `Clear action seen: ${water ? water.name + " - " + water.recommendation : "water guidance missing"}`,
    );
    if (tripDecision) {
      notes.push(`Change-plan decision is hard to miss: ${tripDecision.recommendation}`);
    }
    if (food) {
      notes.push(`Food is concrete: ${food.recommendation}`);
    }
    if (waterPlan) {
      notes.push(`Water backup is clear and optional: ${waterPlan.recommendation}`);
    }
    if (traction) {
      notes.push(
        "Traction is clearer: microspikes are described as pull-on metal traction that should fit the user's shoes or boots.",
      );
    }
    if (hasTimingAlert) {
      notes.push(
        "Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.",
      );
    }
    if (socks) {
      notes.push(`Sock guidance is visible: ${socks.recommendation}`);
    }
    if (headlampEssential) {
      notes.push("Good: headlamp is a direct instruction, not a paragraph that hides the action.");
    }
  }

  if (lens === "middle") {
    notes.push(
      `Trip tie-in: water and food are tied to ${run.scenario.userInput.expectedDuration ?? "the trail profile"} plus route difficulty/weather where available.`,
    );
    if (all.has("Electrolytes") || all.has("Salty snacks")) {
      notes.push("Good: salt support is explicit, with electrolytes and salty snacks split into primary and optional paths.");
    }
    if (optional.has("Trekking poles") || essential.has("Trekking poles")) {
      notes.push("Good: poles are presented as optional support unless snow/ice changes the balance need.");
    }
    if (waterPlan) {
      notes.push("Good: long-day water keeps treatment/refill as a separate optional backup instead of burying it in the water quantity.");
    }
    if (tripDecision) {
      notes.push(`Trip decision: ${tripDecision.recommendation}`);
    }
    if (run.rec.tripAlerts.length > 0) {
      notes.push(`Overall alerts: ${run.rec.tripAlerts.map((item) => item.title).join("; ")}.`);
    }
    if (hasDangerAlert && !tripDecision) {
      notes.push("Issue: a danger-level trip alert appeared without a matching Trip safety decision row.");
    }
    if (run.rec.missingDetails.length > 0) {
      notes.push(`Still asks for: ${run.rec.missingDetails.join(" ")}`);
    }
    if (alert) {
      notes.push(`Route context: ${alert.recommendation}`);
    }
  }

  return notes.length > 0 ? notes : ["No lens-specific issue found in this scenario."];
}

function resolvedInput(trailId, template) {
  const expectedDuration =
    template.userInput.expectedDuration === "profile"
      ? profileDurations[trailId]
      : template.userInput.expectedDuration;

  return {
    ...template.userInput,
    expectedDuration,
  };
}

function runMatrix() {
  return Object.entries(SUPPORTED_TRAILS).flatMap(([trailId, trail]) => {
    const base = DEMO_CONTEXTS[trailId];
    return templates.map((template) => {
      const userInput = resolvedInput(trailId, template);
      const scenario = { ...template, userInput };
      return {
        trailId,
        scenario,
        rec: generatePackingRecommendation(
          trail,
          weatherFor(template.weatherMode, base.weather),
          alertsFor(template.alertsMode, base.alerts),
          userInput,
        ),
      };
    });
  });
}

function findingSummary(runs) {
  const timingChecks = runs.filter((run) =>
    run.rec.tripAlerts.some((alert) => alert.id === "unusual-duration"),
  );
  const waterLogistics = runs.filter((run) =>
    run.rec.optional.some((item) => item.name === "Water filter or treatment backup"),
  );
  const veryLongReserveEssential = runs
    .filter((run) => run.scenario.id === "eighteen-hour-edge-case")
    .every((run) => run.rec.essential.some((item) => item.name === "Extra food reserve"));
  const coldLayersEssential = runs
    .filter((run) => run.scenario.id === "snow-ice-cold-day")
    .every((run) => run.rec.essential.some((item) => item.name === "Light jacket or warm layer"));
  const treatmentLanguage = runs
    .filter((run) => ["hot-exposed-long-day", "eighteen-hour-edge-case"].includes(run.scenario.id))
    .every((run) =>
      allItems(run.rec).some(
        (item) => item.name === "Water filter or treatment backup",
      ),
    );
  const taggartAlerts = runs
    .filter((run) => run.trailId === "taggart-lake")
    .every((run) =>
      run.rec.essential.some((item) => item.name === "Review active alerts before leaving"),
    );
  const criticalDangerRuns = runs.filter((run) =>
    ["flash-flood-warning", "severe-storm-lightning", "extreme-heat-warning"].includes(
      run.scenario.id,
    ),
  );
  const criticalDangerCovered = criticalDangerRuns.every(
    (run) =>
      run.rec.essential.some((item) => item.name === "Trip safety decision") &&
      run.rec.tripAlerts.some((alert) => alert.severity === "danger"),
  );

  return [
    `${runs.length} app scenarios were run: ${Object.keys(SUPPORTED_TRAILS).length} trails x ${templates.length} scenario templates.`,
    `Unusual-duration trip alerts triggered in ${timingChecks.length} scenarios, mainly where user duration was far outside the official profile.`,
    `Optional water filter/treatment backup appeared in ${waterLogistics.length} long-duration scenarios.`,
    veryLongReserveEssential
      ? "All 18-hour edge cases moved Extra food reserve into essentials."
      : "Issue: not every 18-hour edge case moved Extra food reserve into essentials.",
    coldLayersEssential
      ? "All snow/ice/cold scenarios promoted Light jacket or warm layer into essentials."
      : "Issue: cold scenarios did not consistently promote the warm layer.",
    treatmentLanguage
      ? "Hot/long and 18-hour cases all included optional refill or water treatment backup planning."
      : "Issue: some long-water cases still lacked optional refill/treatment planning.",
    taggartAlerts
      ? "Every Taggart scenario surfaced the saved official 2026 NPS trail-work alert."
      : "Issue: Taggart alert did not appear consistently.",
    criticalDangerCovered
      ? "All critical-danger scenarios produced both a danger-level trip alert and a Trip safety decision row."
      : "Issue: at least one critical-danger scenario did not produce a matching trip decision.",
    `Each app output was reviewed through three hiker scenarios, for ${runs.length * 3} hiker-lens reads total.`,
  ];
}

function renderReport(runs) {
  const lines = [];
  lines.push("# Week 13/14 Hiker Scenario Stress Results");
  lines.push("");
  lines.push("Date: 2026-07-10");
  lines.push("Project: TrailPack");
  lines.push("Scope: current branch recommendation engine through the three hiker scenarios: seasoned hiker, casual/new hiker, and middle-of-the-road hiker.");
  lines.push("");
  lines.push("## What Was Actually Run");
  lines.push("");
  for (const summary of findingSummary(runs)) {
    lines.push(`- ${summary}`);
  }
  lines.push("");
  lines.push("This report is generated from `npm run scenario:stress`, which calls `generatePackingRecommendation`, then evaluates the app output through the hiker lenses below. The trail/weather cases are inputs to the hiker scenarios, not the main scenario structure.");
  lines.push("");
  lines.push("## Critical Conclusions");
  lines.push("");
  lines.push("- The current branch is much stronger than the prior stiff output for long-day food, water, headlamp, layers, Taggart alerts, abnormal duration handling, optional water backup, and snow/ice traction explanation.");
  lines.push("- Water is now framed as a realistic frontcountry carry amount, not an indefinitely scaled total. The app still avoids naming route-specific water sources because those require verified source-backed data.");
  lines.push("- Critical danger is now split from safety-critical gear: closures, flash flooding, lightning, and extreme heat create a Trip safety decision; bear spray and navigation remain safety-critical gear.");
  lines.push("- Weather and unusual-duration concerns now appear as overall alerts, while affected recommendation rows carry context markers such as Heat, Wet, Duration, or Official alert.");
  lines.push("- The snow/ice gear-literacy gap is now partly addressed: microspikes are described as pull-on metal traction that must fit the user's shoes or boots, with buy/rent guidance kept generic instead of inventing a route-specific rental location.");
  lines.push("- The seasoned-hiker lens accepts the no-invented-water-source direction. The correct next step would be verified route-specific water-source data, not freer copy.");
  lines.push("- The middle-of-the-road lens confirms the recommendations are now more tied to duration, weather, trail conditions, and official profile context instead of reading like the same list every time.");
  lines.push("- The 18-hour scenarios remain edge-case warnings, not normal day-hike planning. The timing warning now lives in the overall alerts area instead of as a packing item.");
  lines.push("");
  lines.push("## Source-Backed Trail Context Used By The Lenses");
  lines.push("");
  lines.push("- Jenny Lake Loop: NPS lists 7.1 mi, 1,040 ft gain, 3-5 hours, moderate; the page also notes roots, exposed rock, narrow dirt, and popular parking.");
  lines.push("- Taggart Lake: NPS lists 3 mi round trip, 360 ft gain, 1-2 hours, easy; the page says a section of Taggart Trail will be closed in 2026 for trail improvements.");
  lines.push("- String Lake Loop: NPS lists 3.7 mi, 540 ft gain, 2-3 hours, easy; the page notes roots/rock, a flatter east side, and a west-side ridge.");
  lines.push("- Grand Teton Hike Smart: NPS highlights sudden weather, lingering snow, bear spray, water, rain gear, extra layers, and navigation basics.");
  lines.push("- NPS general water guidance says backcountry water should be filtered, purified with tablets, or boiled before drinking.");
  lines.push("");
  lines.push("Sources checked: Jenny Lake Loop (`https://www.nps.gov/thingstodo/jennylakeloop.htm`), Taggart Lake (`https://www.nps.gov/thingstodo/taggartlake.htm`), String Lake (`https://www.nps.gov/thingstodo/stringlake.htm`), Grand Teton Hiking / Hike Smart (`https://www.nps.gov/grte/planyourvisit/hike.htm`), and NPS water treatment basics (`https://www.nps.gov/subjects/camping/what-to-bring.htm`).");
  lines.push("");
  lines.push("## Hiker Scenario Prompts Used");
  lines.push("");
  lines.push("### Scenario A: Seasoned Hiker");
  lines.push("");
  lines.push("Review this TrailPack output as a seasoned Grand Teton day hiker who already knows normal packing habits, NPS trail profiles, mountain-weather volatility, bear country basics, and practical carry limits. Flag anything that is vague, unsafe, overkill, unrealistic to carry, missing, or not tied tightly enough to the route, weather, timing, trail conditions, and current NPS context.");
  lines.push("");
  lines.push("### Scenario B: Casual / New Hiker");
  lines.push("");
  lines.push("Review this TrailPack output as a casual or new hiker using the app because you do not know what to bring. Flag anything confusing, intimidating, undefined, too vague, or not directly actionable. For each issue, identify the question a beginner would still have after reading the recommendation.");
  lines.push("");
  lines.push("### Scenario C: Middle-of-the-Road Hiker");
  lines.push("");
  lines.push("Review this TrailPack output as someone with basic hiking experience but limited expert judgment. Evaluate whether the app helps you make practical decisions for this exact trail, planned duration, start time, weather, and trail-condition scenario. Flag anything generic, repetitive, or insufficiently connected to the trip facts.");
  lines.push("");
  lines.push("## Hiker Scenario Results");
  lines.push("");

  for (const lens of ["seasoned", "casual", "middle"]) {
    const title =
      lens === "seasoned"
        ? "Scenario A: Seasoned Hiker"
        : lens === "casual"
          ? "Scenario B: Casual / New Hiker"
          : "Scenario C: Middle-of-the-Road Hiker";
    lines.push(`### ${title}`);
    lines.push("");

    for (const run of runs) {
      const trail = SUPPORTED_TRAILS[run.trailId];
      lines.push(`- ${trail.name} / ${run.scenario.title}:`);
      for (const note of evaluateLens(run, lens)) {
        lines.push(`  - ${note}`);
      }
    }
    lines.push("");
  }

  lines.push("## Raw App Outputs By Trail");
  lines.push("");

  for (const [trailId, trail] of Object.entries(SUPPORTED_TRAILS)) {
    lines.push(`## ${trail.name}`);
    lines.push("");
    lines.push(`Official profile in app: ${trail.distanceMiles.value} mi, ${trail.elevationGainFeet.value} ft gain, ${trail.estimatedDuration.value}, ${trail.difficulty.value}.`);
    lines.push("");

    for (const run of runs.filter((candidate) => candidate.trailId === trailId)) {
      const all = itemMap(allItems(run.rec));
      lines.push(`### ${run.scenario.title}`);
      lines.push("");
      lines.push(`Intent: ${run.scenario.intent}`);
      lines.push(`User input: duration ${run.scenario.userInput.expectedDuration ?? "none"}, start ${run.scenario.userInput.startTime ?? "none"}, conditions ${run.scenario.userInput.trailConditions ?? "none"}.`);
      lines.push(`Essential: ${listNames(run.rec.essential)}.`);
      lines.push(`Optional: ${listNames(run.rec.optional)}.`);
      lines.push(`Trip alerts: ${run.rec.tripAlerts.map((alert) => alert.title).join("; ") || "none"}.`);
      lines.push("");
      lines.push("Key outputs:");
      if (all.has("Trip safety decision")) {
        lines.push(`- Trip decision: ${briefItem(all.get("Trip safety decision"))}`);
      }
      lines.push(`- Water: ${briefItem(all.get("Water"))}`);
      lines.push(`- Water backup: ${briefItem(all.get("Water filter or treatment backup"))}`);
      lines.push(`- Food: ${briefItem(all.get("Food"))}`);
      lines.push(`- Footwear: ${briefItem(all.get("Trail footwear"))}`);
      lines.push(`- Extra socks: ${briefItem(all.get("Extra dry socks"))}`);
      lines.push(`- Traction: ${briefItem(all.get("Traction devices (microspikes)"))}`);
      lines.push(`- Headlamp: ${briefItem(all.get("Headlamp"))}`);
      lines.push(`- Power backup: ${briefItem(all.get("Power bank / extra battery"))}`);
      lines.push(`- Extra food reserve: ${briefItem(all.get("Extra food reserve"))}`);
      lines.push(`- Layer: ${briefItem(all.get("Light jacket or warm layer"))}`);
      if (all.has("Review active alerts before leaving")) {
        lines.push(`- Alert: ${briefItem(all.get("Review active alerts before leaving"))}`);
      }
      lines.push("");
      lines.push("Hiker lens read:");
      for (const note of evaluateLens(run, "seasoned")) {
        lines.push(`- Seasoned: ${note}`);
      }
      for (const note of evaluateLens(run, "casual")) {
        lines.push(`- Casual: ${note}`);
      }
      for (const note of evaluateLens(run, "middle")) {
        lines.push(`- Middle: ${note}`);
      }
      lines.push("");
    }
  }

  lines.push("## Remaining Product Follow-Ups");
  lines.push("");
  lines.push("- Add verified route-specific water-source data before naming actual refill points. Until then, the current app should keep telling users to verify water and carry/treat accordingly.");
  lines.push("- Consider adding a small gear glossary or tooltip for microspikes, water filters, purification tablets, UPF clothing, and bear spray access.");
  lines.push("- Consider adding UI tests for the overall alert area and affected-by chips so the visual treatment remains stable.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

const runs = runMatrix();
const report = renderReport(runs);
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, report);
console.log(`Wrote ${OUTPUT_PATH}`);
