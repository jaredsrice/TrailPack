import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { performance } from "node:perf_hooks";
import { DEMO_CONTEXTS } from "../src/features/trailpack/data/demo-contexts";
import { TRAIL_CATALOG } from "../src/features/trailpack/data/supported-trails";
import {
  buildAiContractInput,
  buildGuardedAiFallback,
  type AiContractInput,
} from "../src/features/trailpack/lib/ai-contract";
import type { AiReviewQuotaAccess } from "../src/features/trailpack/lib/ai-review-quota";
import { handleAiReviewPost } from "../src/features/trailpack/lib/ai-review-route";
import {
  generatePackingRecommendation,
  type UserHikeInput,
} from "../src/features/trailpack/lib/packing";
import type {
  AlertContext,
  PackingItem,
  PackingRecommendation,
  SourceLabel,
  WeatherContext,
} from "../src/features/trailpack/types";

const DEFAULT_CASE_COUNT = 5_000;
const DEFAULT_SEED = 0x5eedc0de;
const WARMUP_CASES = 200;
const MAX_P95_MS = 25;
const MAX_HEAP_GROWTH_BYTES = 128 * 1024 * 1024;
const MAX_API_P95_MS = 250;
const API_CONCURRENCY_LEVELS = [1, 10, 25, 50] as const;
const API_CONCURRENCY_RUNS = 3;
const OUTPUT_DIRECTORY = join(process.cwd(), ".artifacts/system-stress");

const SOURCE_LABELS = new Set<SourceLabel>([
  "supported-profile",
  "public-source-import",
  "user-provided",
  "forecast-based",
  "daylight",
  "official",
  "inferred",
  "missing",
  "unavailable",
  "future-work",
]);
const WEATHER_CONDITIONS: WeatherContext["conditions"] = [
  "heat",
  "cold",
  "rain",
  "wind",
  "snow",
  "sun",
];
const DURATIONS = [
  undefined,
  "30 minutes",
  "1 hour",
  "2 hours",
  "4 hours",
  "6 hours",
  "8 hours",
  "18 hrs",
  "0 hours",
  "-1 hour",
  "100 hours",
  "unknown",
];
const START_TIMES = [
  undefined,
  "05:00",
  "6 AM",
  "09:30",
  "12:00",
  "18:30",
  "11 PM",
  "25:00",
  "unknown",
];
const TRAIL_CONDITIONS = [
  undefined,
  "dry and clear",
  "wet rocks and muddy sections",
  "patchy snow and ice",
  "deep snow with an unknown route",
  "hot exposed trail with limited shade",
  "thunderstorms and high wind",
  "closure reported near the trailhead",
  "unknown",
];

interface StressCase {
  alerts: AlertContext;
  id: number;
  trailId: string;
  userInput: UserHikeInput;
  weather: WeatherContext;
}

interface FailureSample {
  caseId: number;
  message: string;
  trailId: string;
}

interface ApiConcurrencyResult {
  parallelRequests: number;
  runs: number;
  totalRequests: number;
  successes: number;
  rateLimited: number;
  providerCalls: number;
  durationMs: number;
  throughputPerSecond: number;
  latencyMs: {
    p50: number;
    p95: number;
    p99: number;
    maximum: number;
  };
}

function parseCaseCount(): number {
  const rawValue = process.env.TRAILPACK_STRESS_CASES;
  if (!rawValue) {
    return DEFAULT_CASE_COUNT;
  }

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value < 100 || value > 50_000) {
    throw new Error(
      "TRAILPACK_STRESS_CASES must be an integer between 100 and 50000.",
    );
  }
  return value;
}

function mulberry32(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4_294_967_296;
  };
}

function choose<T>(values: readonly T[], random: () => number): T {
  return values[Math.floor(random() * values.length)] as T;
}

function randomInteger(random: () => number, minimum: number, maximum: number) {
  return Math.floor(random() * (maximum - minimum + 1)) + minimum;
}

function buildWeather(
  base: WeatherContext,
  random: () => number,
): WeatherContext {
  const conditions = WEATHER_CONDITIONS.filter(() => random() < 0.38);
  const high = randomInteger(random, -20, 115);
  const low = randomInteger(random, -30, Math.max(-30, high));

  return {
    ...structuredClone(base),
    summary: `Fixed-seed stress weather: ${conditions.join(", ") || "mild"}.`,
    temperatureF: {
      high,
      low,
      current: randomInteger(random, low, Math.max(low, high)),
    },
    precipitationChance: randomInteger(random, 0, 100),
    windMph: randomInteger(random, 0, 80),
    conditions,
  };
}

function buildAlerts(random: () => number): AlertContext {
  if (random() < 0.52) {
    return {
      hasActiveAlerts: false,
      alerts: [],
      label: "official",
      retrievalStatus: "live",
    };
  }

  const severity = choose(["info", "caution", "closure"] as const, random);
  return {
    hasActiveAlerts: true,
    alerts: [
      {
        title:
          severity === "closure"
            ? "Fixed-seed route closure"
            : "Fixed-seed trail advisory",
        description:
          severity === "closure"
            ? "The route is closed. Choose another open route."
            : "Conditions may require a slower pace or a plan change.",
        severity,
        source: "NPS",
        sourceUrl: "https://www.nps.gov/grte/planyourvisit/conditions.htm",
      },
    ],
    label: "official",
    retrievalStatus: "live",
  };
}

function buildCase(
  id: number,
  trailIds: readonly string[],
  random: () => number,
): StressCase {
  const trailId = choose(trailIds, random);
  const scenario = DEMO_CONTEXTS[trailId as keyof typeof DEMO_CONTEXTS];
  if (!scenario) {
    throw new Error(`Missing deterministic context for ${trailId}.`);
  }

  return {
    id,
    trailId,
    weather: buildWeather(scenario.weather, random),
    alerts: buildAlerts(random),
    userInput: {
      plannedDate: random() < 0.75 ? "2026-08-30" : undefined,
      startTime: choose(START_TIMES, random),
      expectedDuration: choose(DURATIONS, random),
      trailConditions: choose(TRAIL_CONDITIONS, random),
      notes: random() < 0.2 ? "Remember the planned turnaround time." : undefined,
    },
  };
}

function normalizedRecommendation(recommendation: PackingRecommendation): string {
  return JSON.stringify({ ...recommendation, generatedAt: "<ignored>" });
}

function isValidHttpsUrl(value: string | undefined): boolean {
  if (!value) {
    return false;
  }
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

function validateItem(item: PackingItem): string[] {
  const failures: string[] = [];
  for (const [field, value] of Object.entries({
    name: item.name,
    question: item.question,
    recommendation: item.recommendation,
    why: item.why,
    answer: item.answer,
    reason: item.reason,
  })) {
    if (typeof value !== "string" || value.trim().length === 0) {
      failures.push(`${item.name || "unnamed item"} has an empty ${field}.`);
    }
  }

  if (
    item.sourceLabels.length === 0 ||
    item.sourceLabels.some((label) => !SOURCE_LABELS.has(label))
  ) {
    failures.push(`${item.name} has invalid or empty source labels.`);
  }
  if (item.sourceLabels.includes("official") && !isValidHttpsUrl(item.sourceUrl)) {
    failures.push(`${item.name} has an official label without an HTTPS source.`);
  }
  if (item.links?.some((link) => !link.label.trim() || !isValidHttpsUrl(link.url))) {
    failures.push(`${item.name} has an invalid supporting link.`);
  }

  return failures;
}

function validateRecommendation(
  stressCase: StressCase,
  recommendation: PackingRecommendation,
): string[] {
  const failures: string[] = [];
  const allItems = [...recommendation.essential, ...recommendation.optional];
  const itemNames = allItems.map((item) => item.name);
  const alertIds = recommendation.tripAlerts.map((alert) => alert.id);

  if (recommendation.trailId !== stressCase.trailId) {
    failures.push("Recommendation trail ID does not match the requested trail.");
  }
  if (allItems.length === 0) {
    failures.push("Recommendation contains no packing items.");
  }
  if (recommendation.essential.length === 0) {
    failures.push("Recommendation contains an empty essential category.");
  }
  if (recommendation.optional.length === 0) {
    failures.push("Recommendation contains an empty optional category.");
  }
  if (new Set(itemNames).size !== itemNames.length) {
    failures.push("Recommendation contains duplicate packing item names.");
  }
  if (new Set(alertIds).size !== alertIds.length) {
    failures.push("Recommendation contains duplicate trip alert IDs.");
  }
  if (
    new Set(recommendation.missingDetails).size !==
    recommendation.missingDetails.length
  ) {
    failures.push("Recommendation contains duplicate missing-detail prompts.");
  }

  for (const item of allItems) {
    failures.push(...validateItem(item));
  }
  for (const alert of recommendation.tripAlerts) {
    if (!alert.title.trim() || !alert.summary.trim()) {
      failures.push(`${alert.id || "unnamed alert"} has empty alert text.`);
    }
    if (
      alert.sourceLabels.length === 0 ||
      alert.sourceLabels.some((label) => !SOURCE_LABELS.has(label))
    ) {
      failures.push(`${alert.id} has invalid or empty source labels.`);
    }
  }

  if (stressCase.alerts.alerts.some((alert) => alert.severity === "closure")) {
    const tripDecision = recommendation.essential.find(
      (item) => item.name === "Trip safety decision",
    );
    if (!tripDecision) {
      failures.push("A route closure did not produce an essential trip decision.");
    } else if (
      !/do not start the closed route/i.test(tripDecision.recommendation) ||
      !/closure is a trip decision/i.test(tripDecision.why)
    ) {
      failures.push("A route closure produced unsafe or ambiguous trip advice.");
    }
  }

  return failures;
}

function percentile(sortedValues: readonly number[], fraction: number): number {
  const index = Math.min(
    sortedValues.length - 1,
    Math.max(0, Math.ceil(sortedValues.length * fraction) - 1),
  );
  return sortedValues[index] ?? 0;
}

function round(value: number): number {
  return Number(value.toFixed(3));
}

function generationIdFor(serial: number): string {
  return `00000000-0000-4000-8000-${serial.toString(16).padStart(12, "0")}`;
}

function createAtomicQuotaClaim(): (
  generationId: string,
) => Promise<AiReviewQuotaAccess> {
  const claimed = new Set<string>();

  return async (generationId) => {
    const resetAt = "2026-08-31T19:00:00.000Z";
    if (claimed.has(generationId)) {
      return {
        status: "duplicate",
        remaining: 5 - claimed.size,
        resetAt,
        retryAfterSeconds: 1_800,
      };
    }
    if (claimed.size >= 5) {
      return {
        status: "limited",
        remaining: 0,
        resetAt,
        retryAfterSeconds: 1_800,
      };
    }

    claimed.add(generationId);
    return {
      status: "allowed",
      remaining: 5 - claimed.size,
      resetAt,
      retryAfterSeconds: 1_800,
    };
  };
}

function apiRequest(input: AiContractInput, generationId: string): Request {
  return new Request("http://localhost/api/trailpack/ai-review", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ generationId, input }),
  });
}

function latencySummary(values: readonly number[]) {
  const sorted = [...values].sort((left, right) => left - right);
  return {
    p50: round(percentile(sorted, 0.5)),
    p95: round(percentile(sorted, 0.95)),
    p99: round(percentile(sorted, 0.99)),
    maximum: round(sorted.at(-1) ?? 0),
  };
}

async function runApiConcurrencyStress(input: AiContractInput) {
  const previousApiKey = process.env.GEMINI_API_KEY;
  const failures: string[] = [];
  const unique: ApiConcurrencyResult[] = [];
  const heapBefore = process.memoryUsage().heapUsed;
  let duplicateSuccesses = 0;
  let duplicateResponses = 0;
  let duplicateProviderCalls = 0;
  const duplicateLatencies: number[] = [];
  let duplicateStart = 0;

  process.env.GEMINI_API_KEY = "local-system-stress-placeholder";
  try {
    for (const parallelRequests of API_CONCURRENCY_LEVELS) {
      const latencies: number[] = [];
      let successes = 0;
      let rateLimited = 0;
      let providerCalls = 0;
      const levelStart = performance.now();

      for (let run = 0; run < API_CONCURRENCY_RUNS; run += 1) {
        const claimQuota = createAtomicQuotaClaim();
        const requestReview = async (requestedInput: AiContractInput) => {
          providerCalls += 1;
          return {
            outcome: "provider-error" as const,
            provider: {
              name: "gemini" as const,
              model: "gemini-3.5-flash",
            },
            review: buildGuardedAiFallback(requestedInput, [
              "Mocked system-stress provider response.",
            ]),
          };
        };

        const statuses = await Promise.all(
          Array.from({ length: parallelRequests }, async (_, index) => {
            const requestStart = performance.now();
            const response = await handleAiReviewPost(
              apiRequest(
                input,
                generationIdFor(
                  parallelRequests * 10_000 + run * 100 + index + 1,
                ),
              ),
              { claimQuota, requestReview },
            );
            await response.arrayBuffer();
            latencies.push(performance.now() - requestStart);
            return response.status;
          }),
        );

        const runSuccesses = statuses.filter((status) => status === 200).length;
        const runRateLimited = statuses.filter((status) => status === 429).length;
        successes += runSuccesses;
        rateLimited += runRateLimited;
        const expectedSuccesses = Math.min(parallelRequests, 5);
        if (
          runSuccesses !== expectedSuccesses ||
          runRateLimited !== parallelRequests - expectedSuccesses
        ) {
          failures.push(
            `Unique concurrency ${parallelRequests}, run ${run + 1}, returned ${runSuccesses} successes and ${runRateLimited} limits.`,
          );
        }
      }

      const durationMs = performance.now() - levelStart;
      const totalRequests = parallelRequests * API_CONCURRENCY_RUNS;
      if (providerCalls !== Math.min(parallelRequests, 5) * API_CONCURRENCY_RUNS) {
        failures.push(
          `Unique concurrency ${parallelRequests} made ${providerCalls} provider calls.`,
        );
      }
      unique.push({
        parallelRequests,
        runs: API_CONCURRENCY_RUNS,
        totalRequests,
        successes,
        rateLimited,
        providerCalls,
        durationMs: round(durationMs),
        throughputPerSecond: round((totalRequests * 1_000) / durationMs),
        latencyMs: latencySummary(latencies),
      });
    }

    duplicateStart = performance.now();
    for (let run = 0; run < API_CONCURRENCY_RUNS; run += 1) {
      const claimQuota = createAtomicQuotaClaim();
      let runProviderCalls = 0;
      const requestReview = async (requestedInput: AiContractInput) => {
        runProviderCalls += 1;
        return {
          outcome: "provider-error" as const,
          provider: { name: "gemini" as const, model: "gemini-3.5-flash" },
          review: buildGuardedAiFallback(requestedInput, [
            "Mocked duplicate system-stress provider response.",
          ]),
        };
      };
      const duplicateId = generationIdFor(900_000 + run);
      const statuses = await Promise.all(
        Array.from({ length: 50 }, async () => {
          const requestStart = performance.now();
          const response = await handleAiReviewPost(
            apiRequest(input, duplicateId),
            { claimQuota, requestReview },
          );
          await response.arrayBuffer();
          duplicateLatencies.push(performance.now() - requestStart);
          return response.status;
        }),
      );
      const runSuccesses = statuses.filter((status) => status === 200).length;
      const runDuplicates = statuses.filter((status) => status === 409).length;
      duplicateSuccesses += runSuccesses;
      duplicateResponses += runDuplicates;
      duplicateProviderCalls += runProviderCalls;
      if (
        runSuccesses !== 1 ||
        runDuplicates !== 49 ||
        runProviderCalls !== 1
      ) {
        failures.push(
          `Duplicate concurrency run ${run + 1} returned ${runSuccesses} successes, ${runDuplicates} duplicates, and ${runProviderCalls} provider calls.`,
        );
      }
    }
  } finally {
    if (previousApiKey === undefined) {
      delete process.env.GEMINI_API_KEY;
    } else {
      process.env.GEMINI_API_KEY = previousApiKey;
    }
  }

  const duplicateDurationMs = performance.now() - duplicateStart;
  return {
    runsPerLevel: API_CONCURRENCY_RUNS,
    unique,
    duplicate: {
      parallelRequests: 50,
      runs: API_CONCURRENCY_RUNS,
      totalRequests: 50 * API_CONCURRENCY_RUNS,
      successes: duplicateSuccesses,
      duplicates: duplicateResponses,
      providerCalls: duplicateProviderCalls,
      durationMs: round(duplicateDurationMs),
      throughputPerSecond: round(
        (50 * API_CONCURRENCY_RUNS * 1_000) / duplicateDurationMs,
      ),
      latencyMs: latencySummary(duplicateLatencies),
    },
    heapGrowthBytes: process.memoryUsage().heapUsed - heapBefore,
    budgets: { p95Ms: MAX_API_P95_MS, heapGrowthBytes: MAX_HEAP_GROWTH_BYTES },
    failures,
  };
}

async function main() {
const caseCount = parseCaseCount();
const random = mulberry32(DEFAULT_SEED);
const trailIds = Object.keys(DEMO_CONTEXTS);
const cases = Array.from({ length: caseCount }, (_, index) =>
  buildCase(index + 1, trailIds, random),
);

for (let index = 0; index < WARMUP_CASES; index += 1) {
  const stressCase = cases[index % cases.length] as StressCase;
  generatePackingRecommendation(
    TRAIL_CATALOG[stressCase.trailId]!,
    stressCase.weather,
    stressCase.alerts,
    stressCase.userInput,
  );
}

const heapBefore = process.memoryUsage().heapUsed;
const startTime = performance.now();
const latencies: number[] = [];
const failureSamples: FailureSample[] = [];
let failureCount = 0;

for (const stressCase of cases) {
  const trail = TRAIL_CATALOG[stressCase.trailId];
  if (!trail) {
    throw new Error(`Missing trail profile for ${stressCase.trailId}.`);
  }

  const caseStart = performance.now();
  const first = generatePackingRecommendation(
    trail,
    stressCase.weather,
    stressCase.alerts,
    stressCase.userInput,
  );
  latencies.push(performance.now() - caseStart);
  const second = generatePackingRecommendation(
    trail,
    stressCase.weather,
    stressCase.alerts,
    stressCase.userInput,
  );

  const failures = validateRecommendation(stressCase, first);
  if (normalizedRecommendation(first) !== normalizedRecommendation(second)) {
    failures.push("Identical input produced a different recommendation.");
  }

  failureCount += failures.length;
  for (const message of failures) {
    if (failureSamples.length < 20) {
      failureSamples.push({ caseId: stressCase.id, trailId: stressCase.trailId, message });
    }
  }
}

const durationMs = performance.now() - startTime;
const heapAfter = process.memoryUsage().heapUsed;
const sortedLatencies = [...latencies].sort((left, right) => left - right);
const referenceCase = cases[0] as StressCase;
const referenceTrail = TRAIL_CATALOG[referenceCase.trailId];
if (!referenceTrail) {
  throw new Error("The fixed-seed stress workload has no reference trail.");
}
const referenceRecommendation = generatePackingRecommendation(
  referenceTrail,
  referenceCase.weather,
  referenceCase.alerts,
  referenceCase.userInput,
);
const apiConcurrency = await runApiConcurrencyStress(
  buildAiContractInput({
    trail: referenceTrail,
    weather: referenceCase.weather,
    alerts: referenceCase.alerts,
    userInput: referenceCase.userInput,
    recommendation: referenceRecommendation,
  }),
);
const metrics = {
  seed: DEFAULT_SEED,
  cases: caseCount,
  evaluations: caseCount * 2 + WARMUP_CASES,
  trails: trailIds.length,
  failures: failureCount,
  durationMs: round(durationMs),
  throughputPerSecond: round((caseCount * 1_000) / durationMs),
  latencyMs: {
    p50: round(percentile(sortedLatencies, 0.5)),
    p95: round(percentile(sortedLatencies, 0.95)),
    p99: round(percentile(sortedLatencies, 0.99)),
    maximum: round(sortedLatencies.at(-1) ?? 0),
  },
  heapGrowthBytes: heapAfter - heapBefore,
  budgets: {
    p95Ms: MAX_P95_MS,
    heapGrowthBytes: MAX_HEAP_GROWTH_BYTES,
  },
  apiConcurrency,
  failureSamples,
};

mkdirSync(OUTPUT_DIRECTORY, { recursive: true });
writeFileSync(
  join(OUTPUT_DIRECTORY, "latest.json"),
  `${JSON.stringify(metrics, null, 2)}\n`,
);
writeFileSync(
  join(OUTPUT_DIRECTORY, "latest.md"),
  [
    "# TrailPack fixed-seed system stress",
    "",
    `- Seed: \`${metrics.seed}\``,
    `- Cases: ${metrics.cases.toLocaleString()}`,
    `- Evaluations including determinism checks and warmup: ${metrics.evaluations.toLocaleString()}`,
    `- Trails: ${metrics.trails}`,
    `- Invariant failures: ${metrics.failures}`,
    `- Duration: ${metrics.durationMs} ms`,
    `- Throughput: ${metrics.throughputPerSecond.toLocaleString()} cases/second`,
    `- Latency p50/p95/p99/max: ${metrics.latencyMs.p50}/${metrics.latencyMs.p95}/${metrics.latencyMs.p99}/${metrics.latencyMs.maximum} ms`,
    `- Heap growth: ${metrics.heapGrowthBytes.toLocaleString()} bytes`,
    "",
    "## Mocked AI route concurrency",
    "",
    `- Runs per level: ${apiConcurrency.runsPerLevel}`,
    ...apiConcurrency.unique.map(
      (result) =>
        `- ${result.parallelRequests} parallel: ${result.successes} successes, ${result.rateLimited} rate-limited, ${result.providerCalls} provider calls; ${result.throughputPerSecond.toLocaleString()} requests/second; p50/p95/p99/max ${result.latencyMs.p50}/${result.latencyMs.p95}/${result.latencyMs.p99}/${result.latencyMs.maximum} ms`,
    ),
    `- 50 duplicate retries: ${apiConcurrency.duplicate.successes} successes, ${apiConcurrency.duplicate.duplicates} duplicates, ${apiConcurrency.duplicate.providerCalls} provider calls; ${apiConcurrency.duplicate.throughputPerSecond.toLocaleString()} requests/second; p50/p95/p99/max ${apiConcurrency.duplicate.latencyMs.p50}/${apiConcurrency.duplicate.latencyMs.p95}/${apiConcurrency.duplicate.latencyMs.p99}/${apiConcurrency.duplicate.latencyMs.maximum} ms`,
    `- API heap growth: ${apiConcurrency.heapGrowthBytes.toLocaleString()} bytes`,
    "",
  ].join("\n"),
);

const performanceFailure = metrics.latencyMs.p95 > MAX_P95_MS;
const heapFailure = metrics.heapGrowthBytes > MAX_HEAP_GROWTH_BYTES;
const apiPerformanceFailure = apiConcurrency.unique.some(
  (result) => result.latencyMs.p95 > MAX_API_P95_MS,
);
const apiHeapFailure = apiConcurrency.heapGrowthBytes > MAX_HEAP_GROWTH_BYTES;
if (
  failureCount > 0 ||
  performanceFailure ||
  heapFailure ||
  apiConcurrency.failures.length > 0 ||
  apiPerformanceFailure ||
  apiHeapFailure
) {
  console.error(JSON.stringify(metrics, null, 2));
  process.exitCode = 1;
} else {
  console.log(
    `System stress: PASS (${caseCount.toLocaleString()} cases, ${metrics.latencyMs.p95} ms p95, ${metrics.failures} invariant failures).`,
  );
  console.log(`Reports: ${OUTPUT_DIRECTORY}/latest.md and latest.json`);
}
}

void main().catch((error: unknown) => {
  console.error(
    error instanceof Error ? error.message : "System stress failed unexpectedly.",
  );
  process.exitCode = 1;
});
