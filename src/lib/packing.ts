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
 * Deterministic, keyword/number based only. Supported forms:
 *  - single hours: "4 hours" -> 4
 *  - hour ranges:  "4-6 hours" / "5 to 7 hrs" -> larger endpoint (6, 7)
 *  - minutes:      "90 minutes" -> 1.5
 *  - mixed units:  "1 hour 30 minutes" -> 1.5
 *  - decimals:     "5.5 hours" -> 5.5
 *  - invalid text: "a while" -> null
 *
 * Hours and minutes are combined when both appear. For hour ranges the larger
 * endpoint is used so recommendations stay conservative.
 */
export function parseExpectedHours(input?: string): number | null {
  if (!input) {
    return null;
  }

  const normalized = input.toLowerCase();

  let minutes = 0;
  let hasMinutes = false;
  const minuteRegex = /(\d+(?:\.\d+)?)\s*(?:minutes|minute|mins|min)\b/g;
  for (let match = minuteRegex.exec(normalized); match; match = minuteRegex.exec(normalized)) {
    const value = Number.parseFloat(match[1]);
    if (Number.isFinite(value)) {
      minutes += value;
      hasMinutes = true;
    }
  }

  let hours = 0;
  let hasHours = false;
  const hourUnit = "(?:hours|hour|hrs|hr|h)";
  const rangeMatch = normalized.match(
    new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:-|–|—|to)\\s*(\\d+(?:\\.\\d+)?)\\s*${hourUnit}\\b`),
  );
  if (rangeMatch) {
    hours = Math.max(Number.parseFloat(rangeMatch[1]), Number.parseFloat(rangeMatch[2]));
    hasHours = Number.isFinite(hours);
  } else {
    const hourRegex = new RegExp(`(\\d+(?:\\.\\d+)?)\\s*${hourUnit}\\b`, "g");
    const hourValues: number[] = [];
    for (let match = hourRegex.exec(normalized); match; match = hourRegex.exec(normalized)) {
      const value = Number.parseFloat(match[1]);
      if (Number.isFinite(value)) {
        hourValues.push(value);
      }
    }
    if (hourValues.length > 0) {
      hours = Math.max(...hourValues);
      hasHours = true;
    }
  }

  if (hasHours || hasMinutes) {
    const total = (hasHours ? hours : 0) + (hasMinutes ? minutes / 60 : 0);
    return Number.isFinite(total) ? total : null;
  }

  // Fallback: a bare number with no unit is treated as hours.
  const bareNumbers = normalized.match(/\d+(?:\.\d+)?/g);
  if (bareNumbers) {
    const parsed = bareNumbers
      .map((value) => Number.parseFloat(value))
      .filter((value) => Number.isFinite(value));
    if (parsed.length > 0) {
      return Math.max(...parsed);
    }
  }

  return null;
}

export interface TrailConditionFlags {
  muddyOrWet: boolean;
  snowOrIce: boolean;
}

const SNOW_ICE_KEYWORD = /^(snow|ice|icy|verglas|posthol)/;
const MUD_KEYWORD = /^(mud|wet|soggy|flood|puddle)/;
const NEGATORS = new Set(["no", "not", "without", "never", "free", "zero", "none"]);
const CONNECTORS = new Set(["or", "and", "of", "any", "some", "a", "the"]);

function tokenize(text: string): string[] {
  return text.split(/[^a-z0-9']+/).filter(Boolean);
}

const CONDITION_WORD =
  "(?:snow|snowy|ice|icy|verglas|posthol\\w*|mud|muddy|wet|soggy|flood\\w*|puddle\\w*)";

/**
 * Remove explicitly negated condition phrases before keyword detection so a
 * negated mention does not register, while leaving any independent positive
 * mention intact. Handles deterministic suffix/phrase forms:
 *   - "<condition>-free"        (e.g. "snow-free")
 *   - "free of <condition...>"  (e.g. "free of snow and ice")
 *   - "clear of <condition...>" (e.g. "clear of snow")
 */
function stripNegatedConditionPhrases(text: string): string {
  return text
    .replace(new RegExp(`\\b${CONDITION_WORD}\\s*-\\s*free\\b`, "g"), " ")
    .replace(
      new RegExp(
        `\\b(?:free|clear)\\s+of\\s+(?:${CONDITION_WORD}(?:\\s+(?:and|or)\\s+)?)+`,
        "g",
      ),
      " ",
    );
}

/**
 * Returns true when a token matching `matcher` appears and is not negated.
 *
 * Negation is detected by scanning left from a matched keyword: connector words
 * (e.g. "or", "and") and sibling keywords are skipped, so a single negator can
 * cover a list like "no snow or ice". Any other word stops the scan.
 */
function groupPresent(tokens: string[], matcher: RegExp): boolean {
  for (let i = 0; i < tokens.length; i += 1) {
    if (!matcher.test(tokens[i])) {
      continue;
    }

    let negated = false;
    for (let j = i - 1; j >= 0; j -= 1) {
      const token = tokens[j];
      if (NEGATORS.has(token) || token.endsWith("n't")) {
        negated = true;
        break;
      }
      if (CONNECTORS.has(token) || matcher.test(token)) {
        continue;
      }
      break;
    }

    if (!negated) {
      return true;
    }
  }

  return false;
}

/**
 * Split condition text into independent clauses on commas, semicolons, sentence
 * punctuation, and the conjunction "but" so a negator in one clause cannot
 * suppress a positive report in another (e.g. "no snow, icy bridge").
 */
function splitClauses(text: string): string[] {
  return text.split(/[,;.!?]+|\bbut\b/);
}

/**
 * Deterministic keyword scan of the user-provided trail-conditions field.
 *
 * This is the only free-text field allowed to influence traction/footwear
 * recommendations, per the Week 6 data rules (user-reported conditions are a
 * valid stronger signal). It uses fixed keyword matching plus deterministic
 * negation handling ("no snow or ice", "not muddy", "snow-free", "clear of
 * snow"), not AI inference. Negation is scoped per clause, and within a clause
 * each occurrence is evaluated independently, so a negated mention does not
 * suppress a positive one elsewhere.
 */
export function analyzeTrailConditions(input?: string): TrailConditionFlags {
  const normalized = stripNegatedConditionPhrases((input ?? "").toLowerCase());
  const clauses = splitClauses(normalized).map(tokenize);
  const anyClausePresent = (matcher: RegExp): boolean =>
    clauses.some((tokens) => groupPresent(tokens, matcher));

  return {
    snowOrIce: anyClausePresent(SNOW_ICE_KEYWORD),
    muddyOrWet: anyClausePresent(MUD_KEYWORD),
  };
}

type AlertItem = AlertContext["alerts"][number];

/**
 * An alert may back an "official" label only when it is an NPS alert whose
 * sourceUrl is a valid HTTPS URL on nps.gov (or a subdomain of nps.gov).
 *
 * URL parsing is done safely: malformed URLs return false instead of throwing.
 * A URL alone is never treated as proof of an official source, and look-alike
 * hosts such as "nps.gov.example.com" are rejected.
 */
export function isOfficialNpsAlert(alert: AlertItem): boolean {
  if (alert.source !== "NPS" || !alert.sourceUrl) {
    return false;
  }

  let parsed: URL;
  try {
    parsed = new URL(alert.sourceUrl);
  } catch {
    return false;
  }

  if (parsed.protocol !== "https:") {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  return host === "nps.gov" || host.endsWith(".nps.gov");
}

function formatTrailStats(trail: TrailProfile): string {
  return `${trail.distanceMiles.value} mi, ${trail.elevationGainFeet.value} ft gain, ${trail.estimatedDuration.value}`;
}

/**
 * Invariant: an item may only carry the "official" label when it also has a
 * sourceUrl. If the URL is missing, the "official" label is dropped and replaced
 * with an accurate fallback ("unavailable") so provenance is never overstated.
 */
function enforceOfficialProvenance(item: PackingItem): PackingItem {
  if (!item.sourceLabels.includes("official") || item.sourceUrl) {
    return item;
  }

  const withoutOfficial = item.sourceLabels.filter((label) => label !== "official");
  return {
    ...item,
    sourceLabels: withoutOfficial.length > 0 ? withoutOfficial : ["unavailable"],
  };
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
  const shortByProfile = distance <= 3.5 && gain <= 500;
  const hotConditions =
    weather.conditions.includes("heat") ||
    (weather.temperatureF?.high ?? 0) >= 80 ||
    (weather.temperatureF?.current ?? 0) >= 75;

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
    name: shortByProfile ? "Snack or light food" : "Snacks / lunch",
    reason: shortByProfile
      ? `A shorter ${duration.toLowerCase()} hike still calls for quick trail fuel.`
      : `Plan for ${duration} on trail.`,
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

  if (hotConditions) {
    const waterIndex = essential.findIndex((item) => item.name.startsWith("Water:"));
    if (waterIndex !== -1) {
      const existingWater = essential[waterIndex];
      essential[waterIndex] = {
        ...existingWater,
        name: "Water: 2-3 liters",
        reason:
          existingWater.name === "Water: 2-3 liters"
            ? `${existingWater.reason} Warm exposed conditions reinforce the higher water target.`
            : "Warm exposed conditions call for extra hydration support.",
        sourceLabels: Array.from(
          new Set([...existingWater.sourceLabels, "forecast-based"]),
        ),
      };
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
    reason: longByProfile
      ? "Blister care and basic supplies for a longer mountain hike."
      : "Basic blister care and a few small first-aid supplies are still worth carrying.",
    sourceLabels: ["supported-profile", "inferred"],
  });

  if (alerts.hasActiveAlerts) {
    // The aggregate item may only be "official" when EVERY active alert is a
    // verified NPS alert. A single unverified/third-party alert means the whole
    // aggregate cannot claim official provenance.
    const allAlertsOfficial =
      alerts.alerts.length > 0 && alerts.alerts.every(isOfficialNpsAlert);
    essential.push({
      name: "Review active alerts before leaving",
      reason: alerts.alerts.map((alert) => alert.title).join("; "),
      sourceLabels: allAlertsOfficial ? ["official"] : ["unavailable"],
      sourceUrl: allAlertsOfficial ? alerts.alerts[0].sourceUrl : undefined,
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
    essential: essential.map(enforceOfficialProvenance),
    optional: optional.map(enforceOfficialProvenance),
    missingDetails,
    confidenceNote: `${trail.sourceConfidence.summary} Display stats: ${formatTrailStats(trail)}.`,
  };
}

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
      reason: "A conservative fallback list should still include light weather protection.",
      sourceLabels: ["inferred"],
    },
  ];
  const missingDetails: string[] = [];

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
      reason: "Pack a little more food for a long unsupported-hike day.",
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

  if (!userInput.expectedDuration) {
    missingDetails.push(
      "Your expected time out would improve hydration and food sizing for this fallback list.",
    );
  }

  if (!userInput.trailConditions) {
    missingDetails.push(
      "Current trail conditions would improve traction and footwear recommendations.",
    );
  }

  return {
    trailId: "manual-entry",
    trailName: "Manual hike entry",
    generatedAt: new Date().toISOString(),
    essential: essential.map(enforceOfficialProvenance),
    optional: optional.map(enforceOfficialProvenance),
    missingDetails,
    confidenceNote:
      "This is a limited fallback list for an unsupported or incomplete hike profile. Trail distance, elevation gain, route type, and source-backed weather are still missing in the current manual-entry prototype.",
  };
}
