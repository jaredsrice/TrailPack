import type {
  AlertContext,
  PackingItem,
  PackingRecommendation,
  TrailProfile,
  WeatherContext,
} from "@/types/trailpack";

export interface UserHikeInput {
  plannedDate?: string;
  expectedDuration?: string;
  trailConditions?: string;
  notes?: string;
}

/**
 * Official Grand Teton National Park bear-safety page. Verified source used to
 * back the "official" label on the bear-spray recommendation.
 */
export const GRTE_BEAR_SAFETY_URL =
  "https://www.nps.gov/grte/planyourvisit/bearsafety.htm";

/**
 * Parse an expected-duration free-text field into a conservative number of hours.
 *
 * Deterministic, keyword/number based only. Returns null when no usable number
 * is found. When a range like "4-6 hours" is given, the larger value is used so
 * recommendations stay conservative. Bare minute values are converted to hours.
 */
export function parseExpectedHours(input?: string): number | null {
  if (!input) {
    return null;
  }

  const normalized = input.toLowerCase();

  const minuteMatch = normalized.match(/(\d+(?:\.\d+)?)\s*(?:min|minute|minutes|mins)\b/);
  if (minuteMatch && !/(\d+(?:\.\d+)?)\s*(?:h|hr|hrs|hour|hours)/.test(normalized)) {
    const minutes = Number.parseFloat(minuteMatch[1]);
    return Number.isFinite(minutes) ? minutes / 60 : null;
  }

  const numbers = normalized.match(/\d+(?:\.\d+)?/g);
  if (!numbers || numbers.length === 0) {
    return null;
  }

  const parsed = numbers
    .map((value) => Number.parseFloat(value))
    .filter((value) => Number.isFinite(value));

  if (parsed.length === 0) {
    return null;
  }

  return Math.max(...parsed);
}

export interface TrailConditionFlags {
  muddyOrWet: boolean;
  snowOrIce: boolean;
}

/**
 * Deterministic keyword scan of the user-provided trail-conditions field.
 *
 * This is the only free-text field allowed to influence traction/footwear
 * recommendations, per the Week 6 data rules (user-reported conditions are a
 * valid stronger signal). It uses fixed keyword matching, not AI inference.
 */
export function analyzeTrailConditions(input?: string): TrailConditionFlags {
  const normalized = (input ?? "").toLowerCase();

  const muddyOrWet = /\b(mud|muddy|wet|soggy|flooded|standing water|puddle)\b/.test(
    normalized,
  );
  const snowOrIce = /\b(snow|snowy|ice|icy|verglas|posthol)/.test(normalized);

  return { muddyOrWet, snowOrIce };
}

function formatTrailStats(trail: TrailProfile): string {
  return `${trail.distanceMiles.value} mi, ${trail.elevationGainFeet.value} ft gain, ${trail.estimatedDuration.value}`;
}

export function generatePackingRecommendation(
  trail: TrailProfile,
  weather: WeatherContext,
  alerts: AlertContext,
  userInput: UserHikeInput = {},
): PackingRecommendation {
  const essential: PackingItem[] = [];
  const optional: PackingItem[] = [];
  const missingDetails: string[] = [];

  const distance = trail.distanceMiles.value;
  const gain = trail.elevationGainFeet.value;
  const duration = trail.estimatedDuration.value;

  const expectedHours = parseExpectedHours(userInput.expectedDuration);
  const conditions = analyzeTrailConditions(userInput.trailConditions);

  essential.push({
    name: "Sturdy hiking shoes",
    reason: `${trail.difficulty.value} trail with ${gain} ft gain benefits from supportive footwear.`,
    sourceLabels: ["supported-profile", "inferred"],
  });

  const longByProfile = distance >= 5 || gain >= 800;
  const longByUserDuration = expectedHours !== null && expectedHours >= 5;

  if (longByProfile || longByUserDuration) {
    const reason = longByUserDuration
      ? `Longer planned day (about ${expectedHours} hr) needs steady hydration.`
      : `Longer effort (${distance} mi, ${duration}) needs steady hydration.`;
    essential.push({
      name: "Water: 2-3 liters",
      reason,
      sourceLabels: longByUserDuration
        ? ["user-provided", "supported-profile"]
        : ["supported-profile"],
    });
  } else {
    essential.push({
      name: "Water: 1-2 liters",
      reason: `Bring enough water for a ${distance} mi hike.`,
      sourceLabels: ["supported-profile"],
    });
  }

  essential.push({
    name: "Snacks / lunch",
    reason: `Plan for ${duration} on trail.`,
    sourceLabels: ["supported-profile"],
  });

  // Duration rule: a long planned day raises the chance of finishing near dark.
  if (expectedHours !== null && expectedHours >= 6) {
    essential.push({
      name: "Headlamp",
      reason: `A long planned day (about ${expectedHours} hr) raises the chance of finishing near dusk.`,
      sourceLabels: ["user-provided", "inferred"],
    });
    optional.push({
      name: "Extra food",
      reason: `Pack a little more food for a long day out (about ${expectedHours} hr).`,
      sourceLabels: ["user-provided", "inferred"],
    });
  }

  essential.push({
    name: "Bear spray",
    reason:
      "Grand Teton National Park recommends carrying bear spray in all areas of the park.",
    sourceLabels: ["official"],
    sourceUrl: GRTE_BEAR_SAFETY_URL,
  });

  if (weather.conditions.includes("rain") || (weather.precipitationChance ?? 0) >= 40) {
    essential.push({
      name: "Rain shell",
      reason: weather.summary,
      sourceLabels: ["forecast-based"],
    });
  } else {
    optional.push({
      name: "Light rain shell",
      reason: "Mountain weather can change quickly even on clear days.",
      sourceLabels: ["inferred"],
    });
  }

  if (weather.conditions.includes("sun") || weather.conditions.includes("heat")) {
    essential.push({
      name: "Sun protection",
      reason: "Hat, sunglasses, and sunscreen for exposed alpine miles.",
      sourceLabels: ["forecast-based", "inferred"],
    });
  }

  // Trail-condition rules from the user-provided conditions field.
  if (conditions.snowOrIce) {
    essential.push({
      name: "Traction devices (microspikes)",
      reason: "You reported snow or ice on the trail; traction helps on slick sections.",
      sourceLabels: ["user-provided"],
    });
    optional.push({
      name: "Trekking poles",
      reason: "Poles add stability on reported snow or ice.",
      sourceLabels: ["user-provided", "inferred"],
    });
  }

  if (conditions.muddyOrWet) {
    optional.push({
      name: "Waterproof boots or gaiters",
      reason: "You reported mud or wet trail; waterproof footwear keeps feet dry.",
      sourceLabels: ["user-provided", "inferred"],
    });
  }

  optional.push({
    name: "Offline map",
    reason:
      "Cell service can be limited in mountain areas; consider saving an offline map before you go.",
    sourceLabels: ["inferred"],
  });

  essential.push({
    name: "First-aid basics",
    reason: "Blister care and basic supplies for a moderate full-day loop.",
    sourceLabels: ["supported-profile", "inferred"],
  });

  if (alerts.hasActiveAlerts) {
    essential.push({
      name: "Check official alerts before leaving",
      reason: alerts.alerts.map((alert) => alert.title).join("; "),
      sourceLabels: ["official"],
      sourceUrl: alerts.alerts.find((alert) => alert.sourceUrl)?.sourceUrl,
    });
  }

  if (gain >= 1000 && !conditions.snowOrIce) {
    optional.push({
      name: "Trekking poles",
      reason: `${gain} ft gain can be easier on knees with poles, especially on descent.`,
      sourceLabels: ["supported-profile", "inferred"],
    });
  }

  optional.push({
    name: "Extra warm layer",
    reason: "Elevation near 6,900 ft can feel cooler than the valley.",
    sourceLabels: ["supported-profile", "inferred"],
  });

  if (!userInput.plannedDate) {
    missingDetails.push("Planned hike date would improve weather-based packing.");
  }

  if (!userInput.trailConditions) {
    missingDetails.push(
      "Current trail conditions (muddy, icy, snow) are not known from official data alone.",
    );
  }

  if (!userInput.expectedDuration) {
    missingDetails.push(
      "Your expected time out could add items like a headlamp for a long day.",
    );
  }

  return {
    trailId: trail.id,
    trailName: trail.name,
    generatedAt: new Date().toISOString(),
    essential,
    optional,
    missingDetails,
    confidenceNote: `${trail.sourceConfidence.summary} Display stats: ${formatTrailStats(trail)}.`,
  };
}
