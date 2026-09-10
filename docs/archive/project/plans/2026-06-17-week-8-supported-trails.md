# Week 8 Supported Trails Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand TrailPack's Week 8 thin vertical slice from one saved Grand Teton trail to three saved Grand Teton trail-and-weather scenarios without changing the core user flow.

**Architecture:** Keep the current prototype data-driven. Add two new `TrailProfile` entries to the supported trail catalog, add a small saved demo-context catalog keyed by trail id, and keep the existing rule-based packing engine unchanged unless a test shows a true integration gap. Verify discoverability and output through pure-data tests plus final app verification.

**Tech Stack:** Next.js App Router, React, TypeScript, Vitest

---

### Task 1: Add the new supported trail profiles and verify they are discoverable

**Files:**
- Modify: `src/data/supported-trails.ts`
- Modify: `src/data/supported-trails.test.ts`
- Modify: `src/lib/packing.test.ts`
- Create: `src/lib/search.test.ts`
- Test: `src/data/supported-trails.test.ts`
- Test: `src/lib/packing.test.ts`
- Test: `src/lib/search.test.ts`

- [ ] **Step 1: Write the failing tests**

Update `src/data/supported-trails.test.ts` to cover the new supported trails and park inventory:

```ts
import { describe, expect, it } from "vitest";
import {
  JENNY_LAKE_LOOP,
  STRING_LAKE_LOOP,
  SUPPORTED_PARKS,
  SUPPORTED_TRAILS,
  TAGGART_LAKE,
} from "@/data/supported-trails";

describe("supported trail inventory", () => {
  it("keeps all three Grand Teton trails under the supported park", () => {
    expect(SUPPORTED_PARKS).toHaveLength(1);
    expect(SUPPORTED_PARKS[0].id).toBe("grand-teton");
    expect(SUPPORTED_PARKS[0].trailIds).toEqual([
      "jenny-lake-loop",
      "taggart-lake",
      "string-lake-loop",
    ]);
    expect(Object.keys(SUPPORTED_TRAILS).sort()).toEqual([
      "jenny-lake-loop",
      "string-lake-loop",
      "taggart-lake",
    ]);
  });
});

describe("Taggart Lake profile", () => {
  it("uses official NPS values for the short out-and-back hike", () => {
    expect(TAGGART_LAKE.distanceMiles.value).toBe(3.0);
    expect(TAGGART_LAKE.elevationGainFeet.value).toBe(360);
    expect(TAGGART_LAKE.estimatedDuration.value).toBe("1-2 Hours");
    expect(TAGGART_LAKE.difficulty.value).toBe("Easy");
    expect(TAGGART_LAKE.routeType).toBe("out-and-back");
  });

  it("stores the validated USGS distance comparison", () => {
    expect(TAGGART_LAKE.distanceMiles.computedValue).toBe(2.958);
    expect(TAGGART_LAKE.sourceConfidence.status).toBe(
      "official_nps_with_usgs_geometry_ok",
    );
    expect(TAGGART_LAKE.sourceConfidence.distanceMatch).toBe("ok");
  });
});

describe("String Lake Loop profile", () => {
  it("uses official NPS values for the moderate bridge scenario", () => {
    expect(STRING_LAKE_LOOP.distanceMiles.value).toBe(3.7);
    expect(STRING_LAKE_LOOP.elevationGainFeet.value).toBe(540);
    expect(STRING_LAKE_LOOP.estimatedDuration.value).toBe("2-3 Hours");
    expect(STRING_LAKE_LOOP.difficulty.value).toBe("Easy");
    expect(STRING_LAKE_LOOP.routeType).toBe("loop");
  });

  it("stores the validated USGS bridge distance comparison", () => {
    expect(STRING_LAKE_LOOP.distanceMiles.computedValue).toBe(3.708);
    expect(STRING_LAKE_LOOP.sourceConfidence.status).toBe(
      "official_nps_with_moderate_usgs_bridge",
    );
    expect(STRING_LAKE_LOOP.sourceConfidence.distanceMatch).toBe("moderate_bridge");
  });
});
```

Update `src/lib/packing.test.ts` so the recommendation engine is exercised against every supported trail:

```ts
import { JENNY_LAKE_LOOP, STRING_LAKE_LOOP, TAGGART_LAKE } from "@/data/supported-trails";

describe("supported trail coverage", () => {
  it("produces a visible packing list for each supported trail", () => {
    for (const trail of [JENNY_LAKE_LOOP, TAGGART_LAKE, STRING_LAKE_LOOP]) {
      const rec = generatePackingRecommendation(trail, CLEAR_WEATHER, NO_ALERTS, {});
      expect(rec.trailName).toBe(trail.name);
      expect(rec.essential.length).toBeGreaterThan(0);
      expect(rec.optional.length).toBeGreaterThan(0);
    }
  });
});
```

Create `src/lib/search.test.ts` to verify the new trails are discoverable through the current search function:

```ts
import { describe, expect, it } from "vitest";
import { getSearchSuggestions } from "@/lib/search";

describe("getSearchSuggestions", () => {
  it("finds Taggart Lake as a supported trail", () => {
    const suggestions = getSearchSuggestions("taggart");
    expect(suggestions.some((item) => item.trailId === "taggart-lake")).toBe(true);
  });

  it("finds String Lake Loop as a supported trail", () => {
    const suggestions = getSearchSuggestions("string");
    expect(suggestions.some((item) => item.trailId === "string-lake-loop")).toBe(true);
  });

  it("still finds the supported park for a teton query", () => {
    const suggestions = getSearchSuggestions("teton");
    expect(suggestions.some((item) => item.parkId === "grand-teton")).toBe(true);
  });
});
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
npx vitest run src/data/supported-trails.test.ts src/lib/packing.test.ts src/lib/search.test.ts
```

Expected:

- `FAIL` because `TAGGART_LAKE` and `STRING_LAKE_LOOP` are not exported yet
- `FAIL` because the supported trail inventory still only contains Jenny Lake Loop
- `FAIL` because search cannot discover trails that do not yet exist in the catalog

- [ ] **Step 3: Write the minimal implementation**

Update `src/data/supported-trails.ts` with the new profiles and the expanded park inventory:

```ts
export const SUPPORTED_PARKS: SupportedPark[] = [
  {
    id: "grand-teton",
    name: "Grand Teton National Park",
    state: "Wyoming",
    trailIds: ["jenny-lake-loop", "taggart-lake", "string-lake-loop"],
  },
];

export const TAGGART_LAKE: TrailProfile = {
  id: "taggart-lake",
  name: "Taggart Lake",
  park: "Grand Teton National Park",
  state: "Wyoming",
  distanceMiles: {
    value: 3.0,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
    label: "official",
    computedValue: 2.958,
    computedSource: "USGS",
    computedSourceUrl: "USGS National Digital Trails",
  },
  elevationGainFeet: {
    value: 360,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
    label: "official",
  },
  estimatedDuration: {
    value: "1-2 Hours",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
    label: "official",
  },
  difficulty: {
    value: "Easy",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
    label: "official",
  },
  routeType: "out-and-back",
  sourceConfidence: {
    status: "official_nps_with_usgs_geometry_ok",
    summary:
      "Official NPS trail stats are the display values. The validated USGS route length is a close match for the short out-and-back route.",
    distanceMatch: "ok",
    gainMatch: "unknown",
    lastChecked: "2026-06-17",
  },
  npsSourceUrl: "https://www.nps.gov/thingstodo/taggartlake.htm",
};

export const STRING_LAKE_LOOP: TrailProfile = {
  id: "string-lake-loop",
  name: "String Lake Loop",
  park: "Grand Teton National Park",
  state: "Wyoming",
  distanceMiles: {
    value: 3.7,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
    label: "official",
    computedValue: 3.708,
    computedSource: "USGS",
    computedSourceUrl: "USGS National Digital Trails",
  },
  elevationGainFeet: {
    value: 540,
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
    label: "official",
  },
  estimatedDuration: {
    value: "2-3 Hours",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
    label: "official",
  },
  difficulty: {
    value: "Easy",
    source: "NPS",
    sourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
    label: "official",
  },
  routeType: "loop",
  sourceConfidence: {
    status: "official_nps_with_moderate_usgs_bridge",
    summary:
      "Official NPS trail stats are the display values. The validated USGS route length is close but should still be treated as a bridge estimate rather than an exact one-to-one match.",
    distanceMatch: "moderate_bridge",
    gainMatch: "unknown",
    lastChecked: "2026-06-17",
  },
  npsSourceUrl: "https://www.nps.gov/thingstodo/stringlake.htm",
};

export const SUPPORTED_TRAILS: Record<string, TrailProfile> = {
  "jenny-lake-loop": JENNY_LAKE_LOOP,
  "taggart-lake": TAGGART_LAKE,
  "string-lake-loop": STRING_LAKE_LOOP,
};
```

No change is required in `src/lib/search.ts` if the tests pass after the catalog expands, because the function already derives trail suggestions from `SUPPORTED_TRAILS`.

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npx vitest run src/data/supported-trails.test.ts src/lib/packing.test.ts src/lib/search.test.ts
```

Expected:

- `PASS` for the new supported trail inventory
- `PASS` for the new trail discoverability checks
- `PASS` for the rule-based packing output on all three supported trails

- [ ] **Step 5: Commit**

```bash
git add src/data/supported-trails.ts src/data/supported-trails.test.ts src/lib/packing.test.ts src/lib/search.test.ts
git commit -m "feat: add additional supported trail profiles"
```

### Task 2: Add saved weather scenarios and wire them into the shell

**Files:**
- Create: `src/data/demo-contexts.ts`
- Create: `src/data/demo-contexts.test.ts`
- Modify: `src/components/TrailPackShell.tsx`
- Test: `src/data/demo-contexts.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/data/demo-contexts.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { DEMO_CONTEXTS } from "@/data/demo-contexts";
import { SUPPORTED_TRAILS } from "@/data/supported-trails";

describe("saved demo contexts", () => {
  it("provides one saved demo scenario for every supported trail", () => {
    expect(Object.keys(DEMO_CONTEXTS).sort()).toEqual(Object.keys(SUPPORTED_TRAILS).sort());
  });

  it("keeps weather demo data deterministic and trail-specific", () => {
    expect(DEMO_CONTEXTS["taggart-lake"].weather.summary).toMatch(/sun/i);
    expect(DEMO_CONTEXTS["string-lake-loop"].weather.conditions).toContain("wind");
    expect(DEMO_CONTEXTS["jenny-lake-loop"].weather.conditions).toContain("rain");
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run:

```bash
npx vitest run src/data/demo-contexts.test.ts
```

Expected:

- `FAIL` because `@/data/demo-contexts` does not exist yet

- [ ] **Step 3: Write the minimal implementation**

Create `src/data/demo-contexts.ts`:

```ts
import type { AlertContext, WeatherContext } from "@/types/trailpack";

export interface DemoScenario {
  weather: WeatherContext;
  alerts: AlertContext;
}

const NO_ALERTS: AlertContext = {
  hasActiveAlerts: false,
  alerts: [],
  label: "unavailable",
};

export const DEMO_CONTEXTS: Record<string, DemoScenario> = {
  "jenny-lake-loop": {
    weather: {
      plannedDate: "2026-06-15",
      summary: "Partly sunny with a chance of afternoon showers in the Tetons.",
      temperatureF: { high: 68, low: 42, current: 55 },
      precipitationChance: 35,
      windMph: 12,
      conditions: ["sun", "rain", "wind"],
      source: "open-meteo",
      label: "forecast-based",
    },
    alerts: NO_ALERTS,
  },
  "taggart-lake": {
    weather: {
      plannedDate: "2026-06-15",
      summary: "Sunny and mild with a cool start at the trailhead.",
      temperatureF: { high: 72, low: 48, current: 58 },
      precipitationChance: 10,
      windMph: 8,
      conditions: ["sun"],
      source: "open-meteo",
      label: "forecast-based",
    },
    alerts: NO_ALERTS,
  },
  "string-lake-loop": {
    weather: {
      plannedDate: "2026-06-15",
      summary: "Mostly sunny and breezy near the ridge above String Lake.",
      temperatureF: { high: 70, low: 45, current: 56 },
      precipitationChance: 15,
      windMph: 16,
      conditions: ["sun", "wind"],
      source: "open-meteo",
      label: "forecast-based",
    },
    alerts: NO_ALERTS,
  },
};
```

Update `src/components/TrailPackShell.tsx` so it pulls saved scenarios by trail id instead of using one shared weather block:

```ts
import { DEMO_CONTEXTS } from "@/data/demo-contexts";

const selectedScenario = selectedTrail ? DEMO_CONTEXTS[selectedTrail.id] : null;

const recommendation = useMemo(() => {
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
}, [selectedTrail, selectedScenario, userInput]);
```

Also update the manual-entry copy in `src/components/TrailPackShell.tsx` so it reflects the Week 8 multi-trail prototype:

```tsx
<p className="mt-2 text-sm text-amber-900">
  Manual entry is still the fallback for unsupported hikes. Week 8 now supports
  Jenny Lake Loop, Taggart Lake, and String Lake Loop in Grand Teton National Park.
</p>
```

- [ ] **Step 4: Run the tests to verify they pass**

Run:

```bash
npx vitest run src/data/demo-contexts.test.ts src/data/supported-trails.test.ts src/lib/packing.test.ts src/lib/search.test.ts
```

Expected:

- `PASS` for the saved weather scenarios
- `PASS` for the expanded supported trail catalog and search discoverability

- [ ] **Step 5: Commit**

```bash
git add src/data/demo-contexts.ts src/data/demo-contexts.test.ts src/components/TrailPackShell.tsx
git commit -m "feat: add saved demo contexts for supported trails"
```

### Task 3: Refresh the single-trail copy and verify the Week 8 slice end to end

**Files:**
- Modify: `README.md`
- Test: `src/data/demo-contexts.test.ts`
- Test: `src/data/supported-trails.test.ts`
- Test: `src/lib/packing.test.ts`
- Test: `src/lib/search.test.ts`

- [ ] **Step 1: Update the README copy**

Change the single-trail wording in `README.md`:

```md
Search for `Jenny Lake`, `Taggart`, or `String Lake`, then select one of the supported trails.
```

and:

```md
- Jenny Lake Loop, Taggart Lake, and String Lake Loop are the complete supported trail profiles in the current prototype.
```

- [ ] **Step 2: Verify the app locally**

Run:

```bash
npm run dev
```

Manual check:

- Search for `Jenny Lake` and confirm the Jenny scenario still renders.
- Search for `Taggart` and confirm the shorter out-and-back scenario renders.
- Search for `String` and confirm the breezier loop scenario renders.
- Use the park flow (`Grand Teton`) and confirm all three supported trail buttons appear.
- Confirm the missing-detail prompts still appear before the packing list.
- Confirm the packing list is visible for each trail.

- [ ] **Step 3: Run the full verification suite**

Run:

```bash
npm run lint
npx tsc --noEmit
npx vitest run
npm run build
```

Expected:

- `PASS` from ESLint
- `PASS` from TypeScript
- `PASS` from Vitest
- `PASS` from Next.js production build

- [ ] **Step 4: Commit**

```bash
git add README.md
git commit -m "docs: update Week 8 supported trail demo copy"
```
