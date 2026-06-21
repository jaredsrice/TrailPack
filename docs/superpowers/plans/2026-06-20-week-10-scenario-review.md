# Week 10 Scenario Review Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete Week 10 by evaluating five proposal-aligned scenarios, fixing the in-scope weaknesses that make those scenarios or the live demo less defensible, and saving concise milestone review notes.

**Architecture:** Keep the current TrailPack prototype narrow and data-driven. Make only targeted rule, demo-context, and manual-fallback improvements that directly strengthen the Week 10 evaluation scenarios. Use TDD for every behavior change, then validate through the real UI and record the final scenario outcomes in one saved review note.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest

---

### Task 1: Tighten the short-hike and hot/exposed scenario behavior

**Files:**
- Modify: `src/lib/packing.test.ts`
- Modify: `src/lib/packing.ts`
- Modify: `src/data/demo-contexts.ts`
- Modify: `src/data/demo-contexts.test.ts`
- Test: `src/lib/packing.test.ts`
- Test: `src/data/demo-contexts.test.ts`

- [ ] **Step 1: Write the failing tests**

Add a short-hike food regression and a hot/exposed scenario regression to `src/lib/packing.test.ts`:

```ts
import { DEMO_CONTEXTS } from "@/data/demo-contexts";
import { JENNY_LAKE_LOOP, STRING_LAKE_LOOP, TAGGART_LAKE } from "@/data/supported-trails";

describe("scenario polish", () => {
  it("uses lighter food wording for a short easy hike", () => {
    const rec = generatePackingRecommendation(
      TAGGART_LAKE,
      DEMO_CONTEXTS["taggart-lake"].weather,
      NO_ALERTS,
      {},
    );
    expect(names(rec.essential)).toContain("Snack or light food");
    expect(names(rec.essential)).not.toContain("Snacks / lunch");
  });

  it("adds heat support for a hot exposed scenario", () => {
    const rec = generatePackingRecommendation(
      STRING_LAKE_LOOP,
      DEMO_CONTEXTS["string-lake-loop"].weather,
      NO_ALERTS,
      {},
    );
    expect(names(rec.essential)).toContain("Water: 2-3 liters");
    expect(names(rec.optional)).toContain("Electrolytes or salty snack");
    expect(names(rec.optional)).toContain("Breathable sun layer");
  });
});
```

Update `src/data/demo-contexts.test.ts` so the saved String Lake weather becomes an explicit hot/exposed scenario:

```ts
it("stores the exact String Lake Loop scenario values", () => {
  expect(DEMO_CONTEXTS["string-lake-loop"].weather).toMatchObject({
    summary: "Hot, sunny, and breezy around the exposed String Lake shoreline.",
    temperatureF: { high: 84, low: 52, current: 74 },
    precipitationChance: 5,
    windMph: 14,
    conditions: ["sun", "heat", "wind"],
  });
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
npx vitest run src/lib/packing.test.ts src/data/demo-contexts.test.ts
```

Expected:

- short-hike test fails because the engine still emits `Snacks / lunch`
- hot/exposed test fails because the saved String Lake scenario is not hot yet and
  there are no heat-specific recommendations
- String Lake demo-context test fails because the saved weather values still use
  the older mild scenario

- [ ] **Step 3: Write the minimal implementation**

Update `src/data/demo-contexts.ts` so String Lake becomes the hot/exposed saved
scenario:

```ts
"string-lake-loop": {
  weather: {
    plannedDate: "2026-06-15",
    summary: "Hot, sunny, and breezy around the exposed String Lake shoreline.",
    temperatureF: { high: 84, low: 52, current: 74 },
    precipitationChance: 5,
    windMph: 14,
    conditions: ["sun", "heat", "wind"],
    source: "open-meteo",
    label: "forecast-based",
  },
  alerts: NO_ALERTS,
},
```

Update `src/lib/packing.ts` so short hikes use lighter food wording and hot
scenarios add targeted support:

```ts
const shortByProfile = distance <= 3.5 && gain <= 500;
const hotConditions =
  weather.conditions.includes("heat") ||
  (weather.temperatureF?.high ?? 0) >= 80 ||
  (weather.temperatureF?.current ?? 0) >= 75;

essential.push({
  name: shortByProfile ? "Snack or light food" : "Snacks / lunch",
  reason: shortByProfile
    ? `A shorter ${duration.toLowerCase()} hike still calls for quick trail fuel.`
    : `Plan for ${duration} on trail.`,
  sourceLabels: ["supported-profile"],
});

if (hotConditions) {
  const baseWater = essential.find((item) => item.name.startsWith("Water:"));
  if (baseWater) {
    baseWater.name = "Water: 2-3 liters";
    baseWater.reason = `Warm exposed conditions call for extra hydration support.`;
    baseWater.sourceLabels = Array.from(
      new Set([...baseWater.sourceLabels, "forecast-based"]),
    );
  }

  optional.push({
    name: "Electrolytes or salty snack",
    reason: "Warm sun-exposed hiking can increase sweat loss.",
    sourceLabels: ["forecast-based", "inferred"],
  });

  optional.push({
    name: "Breathable sun layer",
    reason: "Light breathable coverage helps on a hot exposed trail.",
    sourceLabels: ["forecast-based", "inferred"],
  });
}
```

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:

```bash
npx vitest run src/lib/packing.test.ts src/data/demo-contexts.test.ts
```

Expected:

- PASS with the new short-hike wording
- PASS with the new hot/exposed recommendations
- PASS with the updated String Lake saved scenario

- [ ] **Step 5: Commit**

```bash
git add src/lib/packing.ts src/lib/packing.test.ts src/data/demo-contexts.ts src/data/demo-contexts.test.ts
git commit -m "feat: polish week 10 short and hot hike scenarios"
```

### Task 2: Add a limited manual fallback list for the incomplete-data scenario

**Files:**
- Modify: `src/lib/packing.test.ts`
- Modify: `src/lib/packing.ts`
- Modify: `src/components/TrailPackShell.tsx`
- Test: `src/lib/packing.test.ts`

- [ ] **Step 1: Write the failing tests**

Add focused tests for a new manual fallback recommendation function in
`src/lib/packing.test.ts`:

```ts
import {
  analyzeTrailConditions,
  generateManualEntryRecommendation,
  generatePackingRecommendation,
  GRTE_BEAR_SAFETY_URL,
  isOfficialNpsAlert,
  parseExpectedHours,
  type UserHikeInput,
} from "@/lib/packing";

describe("manual entry fallback", () => {
  it("builds a limited baseline list for unsupported hikes", () => {
    const rec = generateManualEntryRecommendation({});
    expect(rec.trailId).toBe("manual-entry");
    expect(rec.trailName).toBe("Manual hike entry");
    expect(names(rec.essential)).toContain("Water: 1-2 liters");
    expect(names(rec.essential)).toContain("Snack or light food");
    expect(names(rec.essential)).toContain("First-aid basics");
    expect(rec.confidenceNote).toMatch(/limited fallback/i);
  });

  it("asks only for the missing details that would improve the fallback list", () => {
    const rec = generateManualEntryRecommendation({});
    expect(rec.missingDetails.join(" ")).toMatch(/distance/i);
    expect(rec.missingDetails.join(" ")).toMatch(/elevation/i);
    expect(rec.missingDetails.join(" ")).toMatch(/trail conditions/i);
  });

  it("still responds to provided duration and trail conditions", () => {
    const rec = generateManualEntryRecommendation({
      expectedDuration: "7 hours",
      trailConditions: "icy and muddy",
    });
    expect(names(rec.essential)).toContain("Headlamp");
    expect(names(rec.essential)).toContain("Traction devices (microspikes)");
    expect(names(rec.optional)).toContain("Extra food");
    expect(names(rec.optional)).toContain("Waterproof boots or gaiters");
  });
});
```

- [ ] **Step 2: Run the focused tests to verify they fail**

Run:

```bash
npx vitest run src/lib/packing.test.ts
```

Expected:

- FAIL because `generateManualEntryRecommendation` does not exist yet

- [ ] **Step 3: Write the minimal implementation**

Add `generateManualEntryRecommendation` to `src/lib/packing.ts`:

```ts
export function generateManualEntryRecommendation(
  userInput: UserHikeInput = {},
): PackingRecommendation {
  const essential: PackingItem[] = [
    {
      name: "Water: 1-2 liters",
      reason: "Use a limited baseline while trail distance and effort are still unknown.",
      sourceLabels: ["missing", "inferred"],
    },
    {
      name: "Snack or light food",
      reason: "A simple baseline list should still include quick trail fuel.",
      sourceLabels: ["missing", "inferred"],
    },
    {
      name: "Sun protection",
      reason: "A generic day-hike fallback should still cover basic sun exposure.",
      sourceLabels: ["inferred"],
    },
    {
      name: "First-aid basics",
      reason: "Carry a basic safety item even before the hike stats are complete.",
      sourceLabels: ["inferred"],
    },
  ];
  const optional: PackingItem[] = [
    {
      name: "Offline map",
      reason: "Unsupported hikes should still keep a simple navigation fallback.",
      sourceLabels: ["inferred"],
    },
    {
      name: "Light rain shell",
      reason: "A conservative fallback list should include light weather protection.",
      sourceLabels: ["inferred"],
    },
  ];

  const expectedHours = parseExpectedHours(userInput.expectedDuration);
  const conditions = analyzeTrailConditions(userInput.trailConditions);

  if (expectedHours !== null && expectedHours >= 5) {
    essential[0] = {
      name: "Water: 2-3 liters",
      reason: `A longer planned day (about ${expectedHours} hr) needs more hydration.`,
      sourceLabels: ["user-provided", "missing"],
    };
  }

  if (expectedHours !== null && expectedHours >= 6) {
    essential.push({
      name: "Headlamp",
      reason: `A long planned day (about ${expectedHours} hr) can run late.`,
      sourceLabels: ["user-provided", "inferred"],
    });
    optional.push({
      name: "Extra food",
      reason: `Pack a little more food for a long unsupported-hike day.`,
      sourceLabels: ["user-provided", "inferred"],
    });
  }

  if (conditions.snowOrIce) {
    essential.push({
      name: "Traction devices (microspikes)",
      reason: "You reported snow or ice on the trail.",
      sourceLabels: ["user-provided"],
    });
  }

  if (conditions.muddyOrWet) {
    optional.push({
      name: "Waterproof boots or gaiters",
      reason: "You reported mud or wet trail conditions.",
      sourceLabels: ["user-provided", "inferred"],
    });
  }

  return {
    trailId: "manual-entry",
    trailName: "Manual hike entry",
    generatedAt: new Date().toISOString(),
    essential,
    optional,
    missingDetails: [
      "Trail distance or expected duration would improve hydration and food sizing.",
      "Elevation gain or route type would improve effort-based recommendations.",
      "Current trail conditions would improve traction and footwear recommendations.",
    ],
    confidenceNote:
      "This is a limited fallback list for an unsupported or incomplete hike profile. It uses only baseline day-hike guidance plus any details you provide.",
  };
}
```

Update `src/components/TrailPackShell.tsx` so manual mode still renders the
detail prompts and a visible fallback packing list:

```ts
import {
  generateManualEntryRecommendation,
  generatePackingRecommendation,
  type UserHikeInput,
} from "@/lib/packing";

const recommendation = useMemo(() => {
  if (mode === "manual") {
    return generateManualEntryRecommendation(userInput);
  }

  if (!selectedTrail || !selectedScenario) {
    return null;
  }

  return generatePackingRecommendation(
    selectedTrail,
    {
      ...selectedScenario.weather,
      plannedDate: userInput.plannedDate ?? selectedScenario.weather.plannedDate,
    },
    selectedScenario.alerts,
    userInput,
  );
}, [mode, selectedScenario, selectedTrail, userInput]);
```

Also change the rendering gate so `MissingDetailPrompts` appears for
`selectedTrail || mode === "manual"`.

- [ ] **Step 4: Run the focused tests to verify they pass**

Run:

```bash
npx vitest run src/lib/packing.test.ts
```

Expected:

- PASS with the new manual fallback recommendation coverage

- [ ] **Step 5: Commit**

```bash
git add src/lib/packing.ts src/lib/packing.test.ts src/components/TrailPackShell.tsx
git commit -m "feat: add incomplete-data fallback packing list"
```

### Task 3: Run the Week 10 scenario review, save the milestone note, and refresh repo docs

**Files:**
- Create: `docs/superpowers/validation/2026-06-20-week-10-scenario-review.md`
- Modify: `README.md`
- Modify: `CHANGELOG.md`

- [ ] **Step 1: Run the automated baseline**

Run:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Expected:

- all commands pass

- [ ] **Step 2: Run the five UI scenarios and capture findings**

Use the local app and review:

1. `Taggart Lake` as the short low-risk hike
2. `String Lake Loop` as the hot/exposed hike
3. `Jenny Lake Loop` with saved weather as the cool/rainy/windy scenario
4. `Jenny Lake Loop` with `7 hours` and `icy and muddy` as the steep/slippery scenario
5. `Manual entry` as the incomplete-data scenario

Capture for each:

- expected categories
- actual visible output
- weaknesses found
- disposition: `fix now`, `defer`, `acceptable`

- [ ] **Step 3: Write the Week 10 review note**

Create `docs/superpowers/validation/2026-06-20-week-10-scenario-review.md`
with:

```md
# Week 10 Scenario Review

- proposal target summary
- automated verification results
- five scenario sections
- weaknesses fixed during Week 10
- weaknesses deferred to later weeks
- milestone conclusion
```

- [ ] **Step 4: Refresh repo-facing docs**

Update `README.md` and `CHANGELOG.md` only if the repo state or milestone claims
materially changed. At minimum, add the saved Week 10 review note to the
changelog if it exists.

- [ ] **Step 5: Run final verification**

Run:

```bash
git diff --check
npm run lint
npm run typecheck
npm test
npm run build
```

Expected:

- no diff formatting errors
- all verification commands pass

- [ ] **Step 6: Commit**

```bash
git add docs/superpowers/validation/2026-06-20-week-10-scenario-review.md README.md CHANGELOG.md
git commit -m "docs: record week 10 scenario review"
```
