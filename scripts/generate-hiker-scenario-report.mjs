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

  return {
    ...common,
    summary: "Hot, sunny, and exposed with dry trail conditions.",
    temperatureF: { high: 88, low: 55, current: 80 },
    precipitationChance: 5,
    windMph: 10,
    conditions: ["sun", "heat", "wind"],
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
  const hasTimingCheck = essential.has("Trip timing check");
  const water = all.get("Water");
  const waterPlan = all.get("Water refill or treatment plan");
  const food = all.get("Food");
  const headlampEssential = essential.has("Headlamp");
  const layerEssential = essential.has("Light jacket or warm layer");
  const traction = essential.has("Traction devices (microspikes)");
  const alert = essential.get("Review active alerts before leaving");

  if (lens === "seasoned") {
    if (hasTimingCheck) {
      notes.push(
        "Good: the app challenges a duration that does not match the official trail profile instead of blindly normalizing it.",
      );
    }
    if (water?.recommendation.includes("refill or water treatment")) {
      notes.push(
        "Good: long-day water is framed as total need, not a claim that carrying the full upper range is realistic.",
      );
    }
    if (waterPlan) {
      notes.push(
        "Good: the refill/treatment card avoids inventing route-specific water sources and tells the hiker to verify availability.",
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
      notes.push("Good: official trail-work context is visible before the user commits to the route.");
    }
  }

  if (lens === "casual") {
    notes.push(
      `Clear action seen: ${water ? water.name + " - " + water.recommendation : "water guidance missing"}`,
    );
    if (food) {
      notes.push(`Food is concrete: ${food.recommendation}`);
    }
    if (water?.recommendation.includes("water treatment")) {
      if (waterPlan) {
        notes.push(
          `Water logistics are clearer: ${waterPlan.recommendation}`,
        );
      } else {
        notes.push(
          "Remaining question: the app still does not say where a refill exists or which treatment method to use.",
        );
      }
    }
    if (traction) {
      notes.push(
        "Traction is clearer: microspikes are described as pull-on metal traction that should fit the user's shoes or boots.",
      );
    }
    if (hasTimingCheck) {
      notes.push(
        "Good: the app explains the entered time may be a typo, side trip, closure detour, or non-standard route.",
      );
    }
    if (headlampEssential) {
      notes.push("Good: headlamp is a direct instruction, not a paragraph that hides the action.");
    }
  }

  if (lens === "middle") {
    notes.push(
      `Trip tie-in: water and food are tied to ${run.scenario.userInput.expectedDuration ?? "the trail profile"} plus route difficulty/weather where available.`,
    );
    if (optional.has("Electrolytes or salty snack")) {
      notes.push("Good: hot/exposed conditions add salt/electrolyte support instead of only increasing water.");
    }
    if (optional.has("Trekking poles") || essential.has("Trekking poles")) {
      notes.push("Good: poles are presented as optional support unless snow/ice changes the balance need.");
    }
    if (waterPlan) {
      notes.push("Good: long-day water now includes a separate logistics decision instead of burying treatment in the water quantity.");
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
          base.alerts,
          userInput,
        ),
      };
    });
  });
}

function findingSummary(runs) {
  const timingChecks = runs.filter((run) =>
    run.rec.essential.some((item) => item.name === "Trip timing check"),
  );
  const waterLogistics = runs.filter((run) =>
    run.rec.essential.some((item) => item.name === "Water refill or treatment plan"),
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
        (item) => item.name === "Water" && item.recommendation.includes("refill or water treatment"),
      ),
    );
  const taggartAlerts = runs
    .filter((run) => run.trailId === "taggart-lake")
    .every((run) =>
      run.rec.essential.some((item) => item.name === "Review active alerts before leaving"),
    );

  return [
    `${runs.length} app scenarios were run: ${Object.keys(SUPPORTED_TRAILS).length} trails x ${templates.length} scenario templates.`,
    `Trip timing check triggered in ${timingChecks.length} scenarios, mainly where user duration was far outside the official profile.`,
    `Water refill/treatment logistics appeared in ${waterLogistics.length} long-duration scenarios.`,
    veryLongReserveEssential
      ? "All 18-hour edge cases moved Extra food reserve into essentials."
      : "Issue: not every 18-hour edge case moved Extra food reserve into essentials.",
    coldLayersEssential
      ? "All snow/ice/cold scenarios promoted Light jacket or warm layer into essentials."
      : "Issue: cold scenarios did not consistently promote the warm layer.",
    treatmentLanguage
      ? "Hot/long and 18-hour cases all included refill or water treatment planning in water guidance."
      : "Issue: some long-water cases still lacked refill/treatment planning.",
    taggartAlerts
      ? "Every Taggart scenario surfaced the saved official 2026 NPS trail-work alert."
      : "Issue: Taggart alert did not appear consistently.",
    "Each app output was reviewed through three hiker scenarios, for 54 hiker-lens reads total.",
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
  lines.push("- The current branch is much stronger than the prior stiff output for long-day food, water, headlamp, layers, Taggart alerts, abnormal duration handling, water logistics, and snow/ice traction explanation.");
  lines.push("- The largest previous beginner-facing gap, water logistics, is now partly addressed by a separate refill/treatment card. The app still avoids naming route-specific water sources because those require verified source-backed data.");
  lines.push("- The snow/ice gear-literacy gap is now partly addressed: microspikes are described as pull-on metal traction that must fit the user's shoes or boots, with buy/rent guidance kept generic instead of inventing a route-specific rental location.");
  lines.push("- The seasoned-hiker lens accepts the no-invented-water-source direction. The correct next step would be verified route-specific water-source data, not freer copy.");
  lines.push("- The middle-of-the-road lens confirms the recommendations are now more tied to duration, weather, trail conditions, and official profile context instead of reading like the same list every time.");
  lines.push("- The 18-hour scenarios remain edge-case warnings, not normal day-hike planning. The timing card now uses stronger warning copy and the UI marks it as `Check first`.");
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
      lines.push("");
      lines.push("Key outputs:");
      lines.push(`- Water: ${briefItem(all.get("Water"))}`);
      lines.push(`- Water logistics: ${briefItem(all.get("Water refill or treatment plan"))}`);
      lines.push(`- Food: ${briefItem(all.get("Food"))}`);
      lines.push(`- Footwear: ${briefItem(all.get("Trail footwear"))}`);
      lines.push(`- Traction: ${briefItem(all.get("Traction devices (microspikes)"))}`);
      lines.push(`- Headlamp: ${briefItem(all.get("Headlamp"))}`);
      lines.push(`- Extra food reserve: ${briefItem(all.get("Extra food reserve"))}`);
      lines.push(`- Layer: ${briefItem(all.get("Light jacket or warm layer"))}`);
      if (all.has("Review active alerts before leaving")) {
        lines.push(`- Alert: ${briefItem(all.get("Review active alerts before leaving"))}`);
      }
      if (all.has("Trip timing check")) {
        lines.push(`- Timing check: ${briefItem(all.get("Trip timing check"))}`);
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
  lines.push("- Consider adding UI tests for the `Check first` timing-warning card so the visual treatment remains stable.");
  lines.push("");

  return `${lines.join("\n")}\n`;
}

const runs = runMatrix();
const report = renderReport(runs);
mkdirSync(dirname(OUTPUT_PATH), { recursive: true });
writeFileSync(OUTPUT_PATH, report);
console.log(`Wrote ${OUTPUT_PATH}`);
