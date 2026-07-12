import type {
  AlertContext,
  PackingItem,
  PackingRecommendation,
  RouteType,
  TrailProfile,
  TripAlert,
  WeatherContext,
} from "@/features/trailpack/types";

export interface UserHikeInput {
  plannedDate?: string;
  startTime?: string;
  expectedDuration?: string;
  trailConditions?: string;
  distanceMiles?: string;
  elevationGainFeet?: string;
  routeType?: RouteType;
  notes?: string;
}

/**
 * Official Grand Teton National Park bear-safety page. Verified source used to
 * back the "official" label on the bear-spray recommendation.
 */
export const GRTE_BEAR_SAFETY_URL =
  "https://www.nps.gov/grte/planyourvisit/bear_spray.htm";

/**
 * Bear Aware maintains current regional pickup/drop-off details for bear spray
 * rentals around Grand Teton, Jackson Hole, and Yellowstone.
 */
export const BEAR_AWARE_LOCATIONS_URL = "https://bearaware.com/locations/";

/**
 * NPS Hike Smart includes mosquito/tick bite prevention guidance for hikers.
 */
export const NPS_HIKE_SMART_URL =
  "https://www.nps.gov/articles/hiking-safety.htm";

/**
 * NPS heat guidance calls out salty snacks as a way to replace electrolytes
 * lost through sweat.
 */
export const NPS_HEAT_ILLNESS_URL =
  "https://www.nps.gov/articles/heat-illness.htm";

/**
 * CDC/NIOSH heat-stress guidance covers electrolyte fluids for longer periods
 * of sweating in hot conditions.
 */
export const CDC_HEAT_STRESS_RECOMMENDATIONS_URL =
  "https://www.cdc.gov/niosh/heat-stress/recommendations/index.html";

/**
 * NPS general water guidance for filtering, purifying, or boiling backcountry
 * water before drinking it.
 */
export const NPS_WATER_TREATMENT_URL =
  "https://www.nps.gov/subjects/camping/what-to-bring.htm";

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

function parsePositiveNumber(input?: string): number | null {
  if (!input) {
    return null;
  }

  const match = input.match(/\d+(?:\.\d+)?/);
  if (!match) {
    return null;
  }

  const value = Number.parseFloat(match[0]);
  return Number.isFinite(value) && value > 0 ? value : null;
}

function formatManualNumber(value: number): string {
  return Number.isInteger(value) ? value.toFixed(0) : value.toString();
}

function parseMonthDay(date?: string): { month: number; day: number } | null {
  const match = date?.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) {
    return null;
  }

  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  return { month, day };
}

function isRegionalBugSeason(date?: string): boolean {
  const parsed = parseMonthDay(date);
  if (!parsed) {
    return false;
  }

  const { month, day } = parsed;
  if (month > 3 && month < 8) {
    return true;
  }
  if (month === 3) {
    return day >= 15;
  }
  return month === 8;
}

type PackingItemInput = Omit<PackingItem, "recommendation" | "why" | "answer" | "reason"> & {
  recommendation?: string;
  why?: string;
  answer?: string;
  reason?: string;
};

function splitAnswer(answer: string): Pick<PackingItem, "recommendation" | "why"> {
  const boundary = answer.indexOf(". ");
  if (boundary === -1) {
    return {
      recommendation: answer,
      why: "This recommendation is based on the available TrailPack context.",
    };
  }

  return {
    recommendation: answer.slice(0, boundary + 1),
    why: answer.slice(boundary + 2),
  };
}

function item(input: PackingItemInput): PackingItem {
  const answer =
    input.answer ??
    `${input.recommendation ?? ""} ${input.why ?? ""}`.trim();
  const split = splitAnswer(answer);
  const recommendation = input.recommendation ?? split.recommendation;
  const why = input.why ?? split.why;
  const combinedAnswer = answer || `${recommendation} ${why}`;
  return {
    ...input,
    recommendation,
    why,
    answer: combinedAnswer,
    reason: input.reason ?? combinedAnswer,
  };
}

function uniqueSourceLabels(labels: PackingItem["sourceLabels"]): PackingItem["sourceLabels"] {
  return Array.from(new Set(labels));
}

function uniqueStrings(values: string[]): string[] {
  return Array.from(new Set(values));
}

function getTimezoneSuffix(isoValue?: string): string {
  const match = isoValue?.match(/(Z|[+-]\d{2}:\d{2})$/);
  return match?.[1] ?? "";
}

function parseLocalTimeOnDate({
  date,
  time,
  referenceIso,
}: {
  date?: string;
  time?: string;
  referenceIso?: string;
}): Date | null {
  if (!date || !time) {
    return null;
  }

  const match = time.trim().match(/^(\d{1,2})(?::(\d{2})(?::\d{2})?)?\s*(am|pm)?$/i);
  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = match[2] ? Number.parseInt(match[2], 10) : 0;
  const meridiem = match[3]?.toLowerCase();

  if (minute > 59) {
    return null;
  }

  let hour24 = hour;
  if (meridiem) {
    if (hour < 1 || hour > 12) {
      return null;
    }
    hour24 = hour % 12;
    if (meridiem === "pm") {
      hour24 += 12;
    }
  } else if (hour > 23) {
    return null;
  }

  const timezoneSuffix = getTimezoneSuffix(referenceIso);
  const parsed = new Date(
    `${date}T${hour24.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}:00${timezoneSuffix}`,
  );
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function parseIsoDate(isoValue?: string): Date | null {
  if (!isoValue) {
    return null;
  }

  const parsed = new Date(isoValue);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatClock(isoValue?: string): string | null {
  const match = isoValue?.match(/T(\d{2}):(\d{2})/);
  if (!match) {
    return null;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = match[2];
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minute} ${period}`;
}

interface HeadlampDecision {
  placement: "essential" | "optional";
  reason: string;
  sourceLabels: PackingItem["sourceLabels"];
}

function buildHeadlampDecision(
  weather: WeatherContext,
  expectedHours: number | null,
  startTime?: string,
): HeadlampDecision | null {
  const daylight = weather.daylight;
  const date = daylight?.date ?? weather.plannedDate;
  const start = parseLocalTimeOnDate({
    date,
    time: startTime,
    referenceIso: daylight?.civilTwilightEnd ?? daylight?.sunset,
  });
  const civilTwilightBegin = parseIsoDate(daylight?.civilTwilightBegin);
  const sunset = parseIsoDate(daylight?.sunset);
  const civilTwilightEnd = parseIsoDate(daylight?.civilTwilightEnd);

  if (start && expectedHours !== null && civilTwilightEnd) {
    const finish = new Date(start.getTime() + expectedHours * 60 * 60 * 1000);
    if (civilTwilightBegin && start < civilTwilightBegin) {
      const twilightBegin = formatClock(daylight?.civilTwilightBegin);
      return {
        placement: "essential",
        reason: twilightBegin
          ? `Your planned start is before civil twilight begins around ${twilightBegin}, so you need your own light at the trailhead.`
          : "Your planned start is before usable morning light, so you need your own light at the trailhead.",
        sourceLabels: ["user-provided", "daylight", "inferred"],
      };
    }

    if (finish > civilTwilightEnd) {
      const twilightEnd = formatClock(daylight?.civilTwilightEnd);
      return {
        placement: "essential",
        reason: twilightEnd
          ? `Your planned finish is after civil twilight ends around ${twilightEnd}, so natural light may not be enough.`
          : "Your planned finish is after civil twilight, so natural light may not be enough.",
        sourceLabels: ["user-provided", "daylight", "inferred"],
      };
    }

    if (sunset && finish > sunset) {
      const sunsetText = formatClock(daylight?.sunset);
      const twilightEnd = formatClock(daylight?.civilTwilightEnd);
      return {
        placement: "optional",
        reason:
          sunsetText && twilightEnd
            ? `Your planned finish is after sunset around ${sunsetText} but before civil twilight ends around ${twilightEnd}; pack a small headlamp as a backup.`
            : "Your planned finish is after sunset but before civil twilight ends; pack a small headlamp as a backup.",
        sourceLabels: ["user-provided", "daylight", "inferred"],
      };
    }

    if (expectedHours >= 6) {
      return {
        placement: "optional",
        reason:
          "Your planned finish is before civil twilight ends, so a headlamp is a backup rather than a core item for this daylight window.",
        sourceLabels: ["user-provided", "daylight", "inferred"],
      };
    }

    return null;
  }

  if (expectedHours !== null && expectedHours >= 6) {
    return {
      placement: "essential",
      reason: `A long planned day (about ${expectedHours} hr) raises the chance of finishing near dusk when daylight timing is unknown.`,
      sourceLabels: ["user-provided", "inferred"],
    };
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

function enforceOfficialProvenanceOnAlert(alert: TripAlert): TripAlert {
  if (!alert.sourceLabels.includes("official") || alert.sourceUrl) {
    return alert;
  }

  const withoutOfficial = alert.sourceLabels.filter((label) => label !== "official");
  return {
    ...alert,
    sourceLabels: withoutOfficial.length > 0 ? withoutOfficial : ["unavailable"],
  };
}

function buildInsectRepellentItem(plannedDate?: string): PackingItem {
  const monthName = plannedDate
    ? new Date(`${plannedDate}T00:00:00`).toLocaleString("en-US", { month: "long" })
    : "this season";

  return item({
    name: "Insect repellent",
    question: "Should I bring bug spray?",
    recommendation:
      "Bring EPA-registered insect repellent. Long sleeves, long pants, or bug netting can help if mosquitoes or ticks are heavy.",
    why:
      `NPS Hike Smart recommends repellents, netting, long pants, and sleeved clothing for mosquitoes and ticks. ` +
      `Your ${monthName} date falls in TrailPack's spring and summer bug-season window, so this is a reasonable optional add-on for wet, brushy, or lakeside stretches.`,
    sourceLabels: ["official", "inferred"],
    sourceUrl: NPS_HIKE_SMART_URL,
    links: [{ label: "NPS Hike Smart", url: NPS_HIKE_SMART_URL }],
  });
}

function formatHours(hours: number): string {
  return Number.isInteger(hours) ? hours.toFixed(0) : hours.toFixed(1);
}

function buildUnusualDurationAlert({
  expectedHours,
  trail,
}: {
  expectedHours: number;
  trail: TrailProfile;
}): TripAlert {
  return {
    id: "unusual-duration",
    title: "Unusual duration",
    summary:
      `You entered about ${formatHours(expectedHours)} hr, but the NPS profile for ${trail.name} is ${trail.estimatedDuration.value}. ` +
      "TrailPack is treating this as a side trip, long stop plan, closure detour, or non-standard route unless you shorten the input.",
    severity: "caution",
    affectedBy: ["Duration"],
    sourceLabels: ["user-provided", "supported-profile", "inferred"],
  };
}

function buildWeatherTripAlerts({
  weather,
  hotConditions,
}: {
  weather: WeatherContext;
  hotConditions: boolean;
}): TripAlert[] {
  const tripAlerts: TripAlert[] = [];

  if (hotConditions) {
    tripAlerts.push({
      id: "heat-sun",
      title: "Heat / sun exposure",
      summary:
        "Warm or exposed conditions can make the route feel harder than the mileage suggests. Start earlier, shorten the route, or turn back if heat builds; extra water helps but does not remove heat risk.",
      severity: "caution",
      affectedBy: ["Heat"],
      sourceLabels: ["forecast-based", "inferred"],
    });
  }

  if (weather.conditions.includes("rain") || (weather.precipitationChance ?? 0) >= 40) {
    tripAlerts.push({
      id: "rain-wet-trail",
      title: "Rain / wet trail",
      summary:
        "Wet weather can change footing, layers, socks, and pace. Keep rain protection accessible and expect slick rocks, roots, or muddy sections.",
      severity: "caution",
      affectedBy: ["Weather", "Wet"],
      sourceLabels: ["forecast-based", "inferred"],
    });
  }

  if (weather.conditions.includes("snow") || weather.conditions.includes("cold")) {
    tripAlerts.push({
      id: "cold-snow",
      title: "Cold / snow",
      summary:
        "Cold, snow, or wind can turn a normal day hike into a slower and colder outing. Treat traction, layers, and dry socks as more important than they are on a dry summer day.",
      severity: "caution",
      affectedBy: ["Weather", "Snow/Ice"],
      sourceLabels: ["forecast-based", "inferred"],
    });
  }

  return tripAlerts;
}

function buildActiveAlertTripAlert(alerts: AlertContext): TripAlert | null {
  if (!alerts.hasActiveAlerts || alerts.alerts.length === 0) {
    return null;
  }

  const allAlertsOfficial = alerts.alerts.every(isOfficialNpsAlert);
  const closure = alerts.alerts.some((alert) => alert.severity === "closure");
  const alertTitles = alerts.alerts.map((alert) => alert.title).join("; ");

  return {
    id: "active-alerts",
    title: closure ? "Active closure or trail alert" : "Active trail alert",
    summary:
      `Current alert context includes: ${alertTitles}. Review it before leaving because closures, maintenance, high water, or wildlife activity can change the route and packing plan.`,
    severity: closure ? "danger" : "caution",
    affectedBy: ["Official alert"],
    sourceLabels: allAlertsOfficial ? ["official"] : ["unavailable"],
    sourceUrl: allAlertsOfficial ? alerts.alerts[0].sourceUrl : undefined,
  };
}

function buildWaterLogisticsItem({
  expectedHours,
  sourceLabels,
}: {
  expectedHours: number;
  sourceLabels: PackingItem["sourceLabels"];
}): PackingItem {
  return item({
    name: "Water filter or treatment backup",
    question: "What does refill or water treatment mean?",
    recommendation:
      "Optional unless you plan to refill from an unverified source. If you do, confirm the source before leaving and bring a filter, purification tablets, or a way to boil water.",
    why:
      `For an about ${formatHours(expectedHours)} hr plan, TrailPack recommends a realistic carry amount first. Do not count lake, stream, or spigot water unless you have verified it is available and have a way to make it safe to drink.`,
    affectedBy: ["Duration", "Refill uncertainty"],
    contextNotes: [
      {
        label: "Water safety",
        text: "Clear natural water is not automatically safe. Treat any unverified source before drinking from it.",
      },
    ],
    sourceLabels: uniqueSourceLabels([...sourceLabels, "official", "inferred"]),
    sourceUrl: NPS_WATER_TREATMENT_URL,
    links: [
      {
        label: "NPS water treatment basics",
        url: NPS_WATER_TREATMENT_URL,
      },
    ],
  });
}

function buildExtraSocksItem({
  affectedBy,
  wetOrSnowy,
  longDay,
}: {
  affectedBy: string[];
  wetOrSnowy: boolean;
  longDay: boolean;
}): PackingItem {
  const conditionText = wetOrSnowy
    ? "when rain, mud, snow, or wet trail sections are possible."
    : longDay
      ? "on all-day hikes where hot spots have more time to turn into blisters."
      : "as a small backup if your feet get wet or a shoe starts rubbing.";

  return item({
    name: "Extra dry socks",
    question: "Should I bring extra socks?",
    recommendation: `Pack one dry pair of socks ${conditionText}`,
    why:
      "Wet socks increase friction and blister risk. In cold, rain, snow, or creek splash, a dry pair also helps keep feet warmer and makes the walk out more comfortable.",
    affectedBy: uniqueStrings(affectedBy),
    sourceLabels: ["inferred"],
  });
}

function difficultyLevel(difficulty?: string): "easy" | "moderate" | "hard" | "unknown" {
  const normalized = difficulty?.toLowerCase() ?? "";
  if (
    normalized.includes("strenuous") ||
    normalized.includes("hard") ||
    normalized.includes("difficult")
  ) {
    return "hard";
  }
  if (normalized.includes("moderate")) {
    return "moderate";
  }
  if (normalized.includes("easy")) {
    return "easy";
  }
  return "unknown";
}

function buildWaterItem({
  expectedHours,
  distance,
  gain,
  duration,
  difficulty,
  hotConditions,
  sourceLabels,
}: {
  expectedHours: number;
  distance?: number;
  gain?: number;
  duration?: string;
  difficulty?: string;
  hotConditions: boolean;
  sourceLabels: PackingItem["sourceLabels"];
}): PackingItem {
  const difficultyRating = difficultyLevel(difficulty);
  const hardEffort =
    (distance !== undefined && distance >= 10) ||
    (gain !== undefined && gain >= 1500) ||
    difficultyRating === "hard";
  const veryLongDay = expectedHours >= 10;
  const longDay = expectedHours >= 6;
  let minimumLiters = longDay ? 2 : 1.5;
  let worstCaseLiters = longDay ? 3 : 2.5;

  if (veryLongDay) {
    minimumLiters = 3;
    worstCaseLiters = 4;
  } else if (hotConditions || hardEffort) {
    minimumLiters = 2.5;
    worstCaseLiters = 4;
  }

  if (expectedHours >= 5 && expectedHours < 6) {
    minimumLiters = 2;
    worstCaseLiters = hotConditions ? 3 : 3;
  }

  const effortContext = [
    distance !== undefined ? `${distance} mi` : null,
    gain !== undefined ? `${gain} ft gain` : null,
    difficultyRating !== "unknown" ? `${difficultyRating} difficulty` : null,
    duration ? `${duration} profile estimate` : null,
  ].filter(Boolean).join(", ");
  const affectedBy = [
    "Duration",
    hotConditions ? "Heat" : null,
    hardEffort ? "Route effort" : null,
  ].filter((value): value is string => Boolean(value));
  const contextNotes = [
    {
      label: "Carry vs drink",
      text: "This is how much water to have available, not a requirement to drink every drop. Drink according to thirst.",
    },
    hotConditions
      ? {
          label: "Weather effect",
          text: "Heat or exposed sun makes the higher end more reasonable, but it does not remove heat risk by itself.",
        }
      : null,
    veryLongDay
      ? {
          label: "Long-day limit",
          text: "TrailPack stops increasing the carry number indefinitely. If you expect to need more than this, verify a refill, shorten the route, or start earlier.",
        }
      : null,
  ].filter((value): value is { label: string; text: string } => Boolean(value));

  return item({
    name: "Water",
    question: "How much water should I bring?",
    recommendation:
      `Carry ${minimumLiters}-${worstCaseLiters} liters per adult. ` +
      "Drink according to thirst; you do not need to finish it all. Do not treat this as a group total.",
    why:
      `Your planned time out is about ${formatHours(expectedHours)} hr. TrailPack checked ${effortContext || "the available hike context"} and recommends a realistic frontcountry carry range instead of scaling water indefinitely by time. Use the lower end for cool, shaded, efficient travel and the higher end for heat, full sun, slow pacing, or if an adult is carrying backup water for kids.`,
    affectedBy: uniqueStrings(affectedBy),
    contextNotes,
    sourceLabels: uniqueSourceLabels(sourceLabels),
  });
}

function buildFoodItem({
  expectedHours,
  distance,
  gain,
  duration,
  difficulty,
  weatherConditions,
  sourceLabels,
}: {
  expectedHours: number;
  distance?: number;
  gain?: number;
  duration?: string;
  difficulty?: string;
  weatherConditions?: WeatherContext["conditions"];
  sourceLabels: PackingItem["sourceLabels"];
}): PackingItem {
  const difficultyRating = difficultyLevel(difficulty);
  const routeSnackBump =
    (distance !== undefined && distance >= 10) ||
    (gain !== undefined && gain >= 2000) ||
    difficultyRating === "hard"
      ? 1
      : 0;
  const heatSnackBump = weatherConditions?.includes("heat") ? 1 : 0;
  const meals = Math.max(1, Math.floor(expectedHours / 8));
  const snackMinimum = Math.max(2, Math.ceil(expectedHours / 3));
  const snackWorstCase = Math.max(
    snackMinimum + 1,
    Math.ceil(expectedHours / 2.5) + routeSnackBump + heatSnackBump,
  );
  const effortContext = [
    distance !== undefined ? `${distance} mi` : null,
    gain !== undefined ? `${gain} ft gain` : null,
    difficultyRating !== "unknown" ? `${difficultyRating} difficulty` : null,
    duration ? `${duration} profile estimate` : null,
    weatherConditions && weatherConditions.length > 0 ? `${weatherConditions.join(", ")} weather` : null,
  ].filter(Boolean).join(", ");
  const snackDrivers = [
    routeSnackBump > 0 ? "harder route effort" : null,
    heatSnackBump > 0 ? "heat" : null,
  ].filter(Boolean).join(" and ");

  return item({
    name: "Food",
    question: "How much food should I bring?",
    recommendation:
      `Pack ${meals} ${meals === 1 ? "meal" : "meals"} plus ` +
      `${snackMinimum}-${snackWorstCase} trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, and nuts.`,
    why:
      `Your planned time out is about ${formatHours(expectedHours)} hr, so TrailPack sizes food from time first, then checks ${effortContext || "the available hike context"}.` +
      `${snackDrivers ? ` The upper snack count rises for ${snackDrivers}.` : ""} ` +
      "Use the lower end if the day stays on schedule; use the higher end for slow pacing, kids, weather delays, or a longer-than-planned exit.",
    affectedBy: uniqueStrings([
      "Duration",
      heatSnackBump > 0 ? "Heat" : null,
      routeSnackBump > 0 ? "Route effort" : null,
    ].filter((value): value is string => Boolean(value))),
    sourceLabels: uniqueSourceLabels(sourceLabels),
  });
}

function buildElectrolytesItem({
  primary,
  affectedBy,
  sourceLabels,
}: {
  primary: boolean;
  affectedBy: string[];
  sourceLabels: PackingItem["sourceLabels"];
}): PackingItem {
  return item({
    name: "Electrolytes",
    question: "Do I need electrolytes?",
    recommendation: primary
      ? "Bring an electrolyte option, such as packets, tablets, powder, or a sports drink."
      : "Optional backup: bring electrolyte packets, tablets, powder, or a sports drink if you sweat heavily, prefer a drink mix, or may be out longer than planned.",
    why: primary
      ? "Hot, exposed, or sustained sweating can mean replacing salt matters as much as adding more plain water. Count sports drink as part of your fluid, and do not use electrolytes as a reason to force extra water."
      : "For this plan, salty food is enough for most hikers. Electrolytes are a convenient alternate if food is hard to eat, sweating is heavier than expected, or the day runs long.",
    affectedBy: uniqueStrings(affectedBy),
    contextNotes: [
      {
        label: "Overdrinking caution",
        text: "Electrolytes do not make unlimited water safe. Drink according to thirst.",
      },
    ],
    sourceLabels: uniqueSourceLabels([...sourceLabels, "inferred"]),
    links: [
      {
        label: "CDC/NIOSH heat stress guidance",
        url: CDC_HEAT_STRESS_RECOMMENDATIONS_URL,
      },
    ],
  });
}

function buildSaltySnacksItem({
  primary,
  affectedBy,
  sourceLabels,
}: {
  primary: boolean;
  affectedBy: string[];
  sourceLabels: PackingItem["sourceLabels"];
}): PackingItem {
  return item({
    name: "Salty snacks",
    question: "Should I pack salty snacks?",
    recommendation: primary
      ? "Include at least one salty snack per person, such as pretzels, salted nuts, jerky, chips, crackers, or salty trail mix."
      : "Optional backup: pack a salty snack if you prefer food over drink mix or someone in the group dislikes electrolyte products.",
    why: primary
      ? "Long days need food first, and salty snacks help replace salt lost through sweat while also adding calories. This is the practical default when the hike is long but not a high-heat electrolyte scenario."
      : "Electrolytes are the clearer recommendation for this hot or exposed plan, but salty food is still a practical fallback because it provides salt plus calories.",
    affectedBy: uniqueStrings(affectedBy),
    sourceLabels: uniqueSourceLabels([...sourceLabels, "official", "inferred"]),
    sourceUrl: NPS_HEAT_ILLNESS_URL,
    links: [
      {
        label: "NPS heat illness guidance",
        url: NPS_HEAT_ILLNESS_URL,
      },
    ],
  });
}

function buildSaltSupportItems({
  expectedHours,
  profileHours,
  highHeatConditions,
  sourceLabels,
}: {
  expectedHours: number | null;
  profileHours: number | null;
  highHeatConditions: boolean;
  sourceLabels: PackingItem["sourceLabels"];
}): { essential: PackingItem[]; optional: PackingItem[] } {
  const plannedHours = expectedHours ?? profileHours;
  const longByUserDuration = expectedHours !== null && expectedHours >= 6;
  const sustainedHighHeat = highHeatConditions && plannedHours !== null && plannedHours >= 3;

  if (!longByUserDuration && !sustainedHighHeat) {
    return { essential: [], optional: [] };
  }

  const affectedBy = uniqueStrings([
    sustainedHighHeat ? "Heat" : null,
    longByUserDuration ? "Duration" : null,
  ].filter((value): value is string => Boolean(value)));

  if (sustainedHighHeat) {
    return {
      essential: [
        buildElectrolytesItem({
          primary: true,
          affectedBy,
          sourceLabels,
        }),
      ],
      optional: [
        buildSaltySnacksItem({
          primary: false,
          affectedBy,
          sourceLabels,
        }),
      ],
    };
  }

  return {
    essential: [
      buildSaltySnacksItem({
        primary: true,
        affectedBy,
        sourceLabels,
      }),
    ],
    optional: [
      buildElectrolytesItem({
        primary: false,
        affectedBy,
        sourceLabels,
      }),
    ],
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
  const profileHours = parseExpectedHours(duration);
  const conditions = analyzeTrailConditions(userInput.trailConditions);
  const shortByProfile = distance <= 3.5 && gain <= 500;
  const hotConditions =
    weather.conditions.includes("heat") ||
    (weather.temperatureF?.high ?? 0) >= 80 ||
    (weather.temperatureF?.current ?? 0) >= 75;
  const highHeatConditions =
    weather.conditions.includes("heat") ||
    (weather.temperatureF?.high ?? 0) >= 85 ||
    (weather.temperatureF?.current ?? 0) >= 85;
  const tripAlerts = buildWeatherTripAlerts({ weather, hotConditions });
  const bugSeasonDate =
    userInput.plannedDate ?? weather.plannedDate ?? weather.daylight?.date;

  const footwearSourceLabels: PackingItem["sourceLabels"] = ["supported-profile"];
  const footwearRecommendationParts = [
    shortByProfile
      ? "Wear comfortable shoes with decent tread. Basic tennis shoes can work for a short, dry, low-gain trail, but grippier trail runners or hiking shoes are better if the trail is wet, rocky, or muddy."
      : "Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but grippy, supportive footwear is the better default here.",
  ];
  const footwearWhyParts = [
    shortByProfile
      ? `This is a shorter ${duration.toLowerCase()} hike, so the footwear requirement is lighter when conditions are dry.`
      : `This is a ${trail.difficulty.value.toLowerCase()} ${distance} mi route with ${gain} ft gain, so support and grip matter more than they would on a short flat walk.`,
  ];

  if (conditions.muddyOrWet) {
    footwearSourceLabels.push("user-provided");
    footwearRecommendationParts.push(
      "Use waterproof hiking shoes, boots, or gaiters if the muddy sections are still present.",
    );
    footwearWhyParts.push(
      "You reported mud or wet trail, which makes basic tennis shoes less reliable and raises slip risk.",
    );
  }

  if (conditions.snowOrIce) {
    footwearSourceLabels.push("user-provided");
    footwearRecommendationParts.push(
      "Wear shoes or boots with enough structure and tread to pair with traction devices if the slick sections are real.",
    );
    footwearWhyParts.push(
      "You reported snow or ice, so footwear needs to work with microspikes instead of relying on smooth soles.",
    );
  }

  if (weather.conditions.includes("rain") || weather.conditions.includes("snow")) {
    footwearSourceLabels.push("forecast-based");
    footwearWhyParts.push(
      "The weather context includes wet conditions, so dry backup socks are listed separately below.",
    );
  } else if (conditions.muddyOrWet || conditions.snowOrIce) {
    footwearWhyParts.push(
      "Wet or snowy trail sections make backup socks more useful, so they are listed separately below.",
    );
  }
  footwearSourceLabels.push("inferred");

  essential.push(
    item({
      name: "Trail footwear",
      question: "What footwear setup fits this hike?",
      recommendation: footwearRecommendationParts.join(" "),
      why: footwearWhyParts.join(" "),
      affectedBy: uniqueStrings([
        conditions.muddyOrWet ? "Wet" : null,
        conditions.snowOrIce ? "Snow/Ice" : null,
        weather.conditions.includes("rain") || weather.conditions.includes("snow")
          ? "Weather"
          : null,
      ].filter((value): value is string => Boolean(value))),
      sourceLabels: uniqueSourceLabels(footwearSourceLabels),
    }),
  );

  const longByProfile = distance >= 5 || gain >= 800;
  const longByUserDuration = expectedHours !== null && expectedHours >= 5;
  const unusualDuration =
    expectedHours !== null &&
    profileHours !== null &&
    expectedHours >= 4 &&
    expectedHours >= profileHours * 2;

  if (unusualDuration && expectedHours !== null && profileHours !== null) {
    tripAlerts.push(
      buildUnusualDurationAlert({
        expectedHours,
        trail,
      }),
    );
  }

  if (longByProfile || longByUserDuration) {
    if (longByUserDuration && expectedHours !== null) {
      const waterSourceLabels: PackingItem["sourceLabels"] = hotConditions
        ? ["user-provided", "supported-profile", "forecast-based", "inferred"]
        : ["user-provided", "supported-profile", "inferred"];
      essential.push(
        buildWaterItem({
          expectedHours,
          distance,
          gain,
          duration,
          difficulty: trail.difficulty.value,
          hotConditions,
          sourceLabels: waterSourceLabels,
        }),
      );
      optional.push(
        buildWaterLogisticsItem({
          expectedHours,
          sourceLabels: waterSourceLabels,
        }),
      );
    } else {
      essential.push(
        item({
          name: "Water",
          question: "How much water should I bring?",
          recommendation:
            "Bring 2-3 liters per adult. Do not treat this as a group total.",
          why: `Longer effort (${distance} mi, ${duration}) needs steady hydration. Use the higher end for heat, full sun, slower pacing, or if an adult is carrying backup water for kids.`,
          sourceLabels: ["supported-profile"],
        }),
      );
    }
  } else {
    essential.push(
      item({
        name: "Water",
        question: "How much water should I bring?",
        recommendation:
          "Bring 1-2 liters per person. Do not treat this as a group total.",
        why: `This is a ${distance} mi hike. Use the higher end if it is hot, sunny, or your group moves slowly.`,
        sourceLabels: ["supported-profile"],
      }),
    );
  }

  optional.push(
    buildExtraSocksItem({
      affectedBy: [
        weather.conditions.includes("rain") || conditions.muddyOrWet ? "Wet" : null,
        weather.conditions.includes("snow") || conditions.snowOrIce ? "Snow/Ice" : null,
        expectedHours !== null && expectedHours >= 6 ? "Duration" : null,
      ].filter((value): value is string => Boolean(value)),
      wetOrSnowy:
        weather.conditions.includes("rain") ||
        weather.conditions.includes("snow") ||
        conditions.muddyOrWet ||
        conditions.snowOrIce,
      longDay: expectedHours !== null && expectedHours >= 6,
    }),
  );

  if (expectedHours !== null && expectedHours >= 6) {
    essential.push(
      buildFoodItem({
        expectedHours,
        distance,
        gain,
        duration,
        difficulty: trail.difficulty.value,
        weatherConditions: weather.conditions,
        sourceLabels: ["user-provided", "supported-profile", "inferred"],
      }),
    );
  } else {
    essential.push(
      item({
        name: "Food",
        question: "How much food should I bring?",
        recommendation: shortByProfile
          ? "Bring 1-2 easy trail snacks per person, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks."
          : "Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.",
        why: shortByProfile
          ? `This is a shorter ${duration.toLowerCase()} hike, but quick trail fuel still helps with breaks and delays.`
          : `Plan for ${duration} on trail, so lunch plus snacks is more practical than a single small snack.`,
        sourceLabels: ["supported-profile"],
      }),
    );
  }

  const headlampDecision = buildHeadlampDecision(
    weather,
    expectedHours,
    userInput.startTime,
  );
  if (headlampDecision) {
    const target =
      headlampDecision.placement === "essential" ? essential : optional;
    target.push(
      item({
        name: "Headlamp",
        question: "Do I need a headlamp?",
        recommendation:
          headlampDecision.placement === "essential"
            ? "Bring a small headlamp."
            : "Pack a small headlamp as a backup.",
        why: `${headlampDecision.reason} A small headlamp is more reliable than counting on a phone battery for trail light.`,
        reason: headlampDecision.reason,
        affectedBy: uniqueStrings([
          expectedHours !== null && expectedHours >= 6 ? "Duration" : null,
          userInput.startTime ? "Daylight" : null,
        ].filter((value): value is string => Boolean(value))),
        sourceLabels: headlampDecision.sourceLabels,
      }),
    );
  }

  if (expectedHours !== null && expectedHours >= 6) {
    const foodReserveTarget = expectedHours >= 8 ? essential : optional;
    foodReserveTarget.push(
      item({
        name: "Extra food reserve",
        question: "How much extra food should I add for a long day?",
        recommendation: `Add at least one extra substantial snack per person beyond meals and normal trail snacks for an about ${formatHours(expectedHours)} hr day.`,
        why:
          "This is your delay buffer for slow pacing, weather, a missed turn, or a longer-than-planned exit. Choose calorie-dense food you will actually eat, such as a bar, nuts, jerky, dried fruit, or a salty snack.",
        affectedBy: ["Duration"],
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
  }

  const saltSourceLabels: PackingItem["sourceLabels"] = uniqueSourceLabels([
    expectedHours !== null ? "user-provided" : "supported-profile",
    highHeatConditions ? "forecast-based" : null,
    "inferred",
  ].filter((value): value is PackingItem["sourceLabels"][number] => Boolean(value)));
  const saltSupport = buildSaltSupportItems({
    expectedHours,
    profileHours,
    highHeatConditions,
    sourceLabels: saltSourceLabels,
  });
  essential.push(...saltSupport.essential);
  optional.push(...saltSupport.optional);

  essential.push(
    item({
      name: "Bear spray",
      question: "Do I need bear spray, and where do I get it?",
      recommendation:
        "Carry bear spray where it is immediately reachable, not buried in your pack. Plan on one EPA-registered can per adult, and rent or buy it before you reach the trailhead.",
      why:
        "Grand Teton NPS says visitors in bear country should carry EPA-approved bear spray where it is quickly accessible. One can per adult keeps each adult covered if the group separates, and Bear Aware lists current Jackson and Jackson Hole Airport pickup/drop-off options.",
      affectedBy: ["Wildlife"],
      sourceLabels: ["official", "inferred"],
      sourceUrl: GRTE_BEAR_SAFETY_URL,
      links: [
        { label: "NPS bear spray guidance", url: GRTE_BEAR_SAFETY_URL },
        { label: "Bear Aware rental locations", url: BEAR_AWARE_LOCATIONS_URL },
      ],
    }),
  );

  if (weather.conditions.includes("rain") || (weather.precipitationChance ?? 0) >= 40) {
    essential.push(
      item({
        name: "Rain shell",
        question: "Do I need a jacket or shell?",
        recommendation: "Bring a light rain shell.",
        why: `The forecast says: ${weather.summary} A shell keeps rain and wind off without needing a heavy summer layer.`,
        affectedBy: ["Weather", "Wet"],
        sourceLabels: ["forecast-based"],
      }),
    );
  } else {
    optional.push(
      item({
        name: "Light rain or wind shell",
        question: "Do I need a jacket or shell?",
        answer:
          "Carry a light jacket, wind shell, or rain shell even on clear summer days. Mountain weather can change quickly, and a shell also helps if shade, wind, or an evening finish feels cooler than expected.",
        sourceLabels: ["inferred"],
      }),
    );
  }

  if (weather.conditions.includes("sun") || weather.conditions.includes("heat")) {
    essential.push(
      item({
        name: "Sun protection",
        question: "What sun protection should I bring?",
        recommendation:
          "Bring sunscreen, sunglasses, a brimmed hat, and a lightweight UPF or long-sleeve sun shirt.",
        why:
          "Alpine sun can still be strong on mild days, especially near lakes, rock, snow patches, or exposed shoreline. A breathable sun shirt protects skin without relying only on reapplying sunscreen.",
        affectedBy: hotConditions ? ["Heat"] : ["Weather"],
        sourceLabels: ["forecast-based", "inferred"],
      }),
    );
  }

  if (isRegionalBugSeason(bugSeasonDate)) {
    optional.push(buildInsectRepellentItem(bugSeasonDate));
  }

  if (hotConditions) {
    const waterIndex = essential.findIndex((item) => item.name === "Water");
    if (waterIndex !== -1 && !longByUserDuration) {
      const existingWater = essential[waterIndex];
      const recommendation =
        "Bring 2-3 liters per adult. Do not treat this as a group total.";
      const why = `${existingWater.why} Warm exposed conditions reinforce using the higher end because they increase sweat loss.`;
      essential[waterIndex] = {
        ...existingWater,
        name: "Water",
        recommendation,
        why,
        answer: `${recommendation} ${why}`,
        reason: `${recommendation} ${why}`,
        affectedBy: uniqueStrings([...(existingWater.affectedBy ?? []), "Heat"]),
        contextNotes: [
          ...(existingWater.contextNotes ?? []),
          {
            label: "Weather effect",
            text: "Warm exposed conditions make the higher end more reasonable, but extra water does not remove heat risk by itself.",
          },
        ],
        sourceLabels: uniqueSourceLabels([...existingWater.sourceLabels, "forecast-based"]),
      };
    }

    optional.push(
      item({
        name: "Breathable sun layer",
        question: "What should I wear for hot sun?",
        answer:
          "Wear a breathable long-sleeve sun shirt or light layer if you burn easily or will spend hours in exposed sun. It should be light and ventilated, not a heavy warm layer.",
        affectedBy: ["Heat"],
        sourceLabels: ["forecast-based", "inferred"],
      }),
    );
  }

  // Trail-condition rules from the user-provided conditions field.
  if (conditions.snowOrIce) {
    essential.push(
      item({
        name: "Traction devices (microspikes)",
        question: "Do I need traction?",
        recommendation:
          "Bring pull-on traction devices such as microspikes, and test that they fit your shoes or boots before the hike.",
        why:
          "You reported snow or ice. Microspikes are small metal traction devices that stretch over footwear and bite into packed snow or ice better than regular tread. Buy or rent them from an outdoor gear shop before reaching the trailhead; TrailPack does not know a verified rental counter on this route.",
        affectedBy: ["Snow/Ice", "Trail conditions"],
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
    optional.push(
      item({
        name: "Trekking poles",
        question: "Are trekking poles recommended for this route?",
        recommendation:
          "Use trekking poles if you have them, but do not treat them as a replacement for microspikes.",
        why:
          "You reported snow or ice. Poles add balance on slick sections and descents, while microspikes handle traction.",
        affectedBy: ["Snow/Ice", "Trail conditions"],
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
  }

  optional.push(
    item({
      name: "Offline map",
      question: "Do I need a map if I have my phone?",
      recommendation: "Save an offline map before leaving.",
      why:
        "Cell service can be limited in mountain areas. Do not depend on live service for route finding, pickup timing, or checking your return path.",
      sourceLabels: ["inferred"],
    }),
  );

  essential.push(
    item({
      name: "First-aid basics",
      question: "What first-aid supplies are actually basic?",
      answer: longByProfile
        ? "Carry blister pads or moleskin, a few adhesive bandages, antiseptic wipes, pain reliever, personal medications, and any allergy or asthma supplies. On a longer mountain hike, blister care matters because foot pain can turn a normal exit into a slow one."
        : "Carry blister pads or moleskin, a few adhesive bandages, antiseptic wipes, pain reliever, personal medications, and any allergy or asthma supplies. Even on a shorter hike, small foot or skin problems are easier to fix early.",
      sourceLabels: ["supported-profile", "inferred"],
    }),
  );

  if (alerts.hasActiveAlerts) {
    const activeAlert = buildActiveAlertTripAlert(alerts);
    if (activeAlert) {
      tripAlerts.push(activeAlert);
    }

    // The aggregate item may only be "official" when EVERY active alert is a
    // verified NPS alert. A single unverified/third-party alert means the whole
    // aggregate cannot claim official provenance.
    const allAlertsOfficial =
      alerts.alerts.length > 0 && alerts.alerts.every(isOfficialNpsAlert);
    const alertTitles = alerts.alerts.map((alert) => alert.title).join("; ");
    essential.push(
      item({
        name: "Review active alerts before leaving",
        question: "Are there active NPS alerts I should check?",
        answer: `Review active alerts before leaving: ${alertTitles}. Closures, high water, wildlife activity, or maintenance can change the route and the packing plan.`,
        affectedBy: ["Official alert"],
        sourceLabels: allAlertsOfficial ? ["official"] : ["unavailable"],
        sourceUrl: allAlertsOfficial ? alerts.alerts[0].sourceUrl : undefined,
      }),
    );
  }

  if (gain >= 1000 && !conditions.snowOrIce) {
    optional.push(
      item({
        name: "Trekking poles",
        question: "Are trekking poles recommended for this route?",
        recommendation:
          "Trekking poles are optional, but bring them if you like extra balance or knee support.",
        why: `${gain} ft of elevation gain means descents can be harder on knees. Poles help with balance, steady pacing, rocky steps, and long downhill sections.`,
        affectedBy: ["Route effort"],
        sourceLabels: ["supported-profile", "inferred"],
      }),
    );
  }

  const coldLayerNeeded =
    weather.conditions.includes("cold") ||
    weather.conditions.includes("snow") ||
    (weather.temperatureF?.high ?? Number.POSITIVE_INFINITY) <= 50;
  const layerTarget = coldLayerNeeded ? essential : optional;
  layerTarget.push(
    item({
      name: "Light jacket or warm layer",
      question: "Do I need an extra layer?",
      recommendation: coldLayerNeeded
        ? "Bring an insulating warm layer plus a rain or wind shell."
        : "Bring a light jacket, fleece, wind shirt, or rain shell; not a heavy winter coat.",
      why: coldLayerNeeded
        ? `The forecast says: ${weather.summary} Grand Teton weather can change quickly, and cold, wind, snow, or a slow exit can make a thin backup layer inadequate.`
        : "Elevation near 6,900 ft, shade, wind, rain, or an evening finish can feel cooler than the valley even in summer.",
      affectedBy: coldLayerNeeded ? ["Weather"] : undefined,
      sourceLabels: coldLayerNeeded
        ? ["forecast-based", "inferred"]
        : ["supported-profile", "inferred"],
    }),
  );

  if (!userInput.trailConditions) {
    missingDetails.push(
      "Current trail conditions (muddy, icy, snow) are not known from official data alone.",
    );
  }

  if (!userInput.expectedDuration) {
    missingDetails.push(
      "Your expected time out improves food, water, and daylight/headlamp guidance.",
    );
  }

  if (!userInput.startTime) {
    missingDetails.push(
      "Your start time would improve daylight and headlamp guidance.",
    );
  }

  return {
    trailId: trail.id,
    trailName: trail.name,
    generatedAt: new Date().toISOString(),
    tripAlerts: tripAlerts.map(enforceOfficialProvenanceOnAlert),
    essential: essential.map(enforceOfficialProvenance),
    optional: optional.map(enforceOfficialProvenance),
    missingDetails,
    confidenceNote: `${trail.sourceConfidence.summary} Display stats: ${formatTrailStats(trail)}.`,
  };
}

export function generateManualEntryRecommendation(
  userInput: UserHikeInput = {},
): PackingRecommendation {
  const distanceMiles = parsePositiveNumber(userInput.distanceMiles);
  const elevationGainFeet = parsePositiveNumber(userInput.elevationGainFeet);
  const routeType =
    userInput.routeType && userInput.routeType !== "unknown" ? userInput.routeType : null;
  const expectedHours = parseExpectedHours(userInput.expectedDuration);
  const conditions = analyzeTrailConditions(userInput.trailConditions);
  const longerByManualFacts =
    (distanceMiles !== null && distanceMiles >= 5) ||
    (elevationGainFeet !== null && elevationGainFeet >= 800);
  const manualFootwearSourceLabels: PackingItem["sourceLabels"] = ["inferred"];
  const manualFootwearRecommendationParts = [
    longerByManualFacts
      ? "Wear supportive trail runners or hiking shoes with good tread."
      : "Wear comfortable shoes with decent tread while TrailPack has only a limited manual profile. Basic tennis shoes can work for short, dry, low-gain walks, but grippier trail runners or hiking shoes are the safer default when the route is unknown.",
  ];
  const manualFootwearWhyParts = [
    longerByManualFacts
      ? "Your entered distance or elevation suggests more than a short outing, so grip and support matter more."
      : "The manual fallback does not have a complete source-backed trail profile, so footwear guidance stays conservative.",
  ];
  const manualWaterSourceLabels: PackingItem["sourceLabels"] = [
    "user-provided",
    "missing",
    "inferred",
  ];

  if (conditions.muddyOrWet) {
    manualFootwearSourceLabels.push("user-provided");
    manualFootwearRecommendationParts.push(
      "Use waterproof hiking shoes, boots, or gaiters if the muddy sections are still present.",
    );
    manualFootwearWhyParts.push(
      "You reported mud or wet trail conditions, which makes basic tennis shoes less reliable.",
    );
  }

  if (conditions.snowOrIce) {
    manualFootwearSourceLabels.push("user-provided");
    manualFootwearRecommendationParts.push(
      "Wear shoes or boots with enough structure and tread to pair with traction devices if the slick sections are real.",
    );
    manualFootwearWhyParts.push(
      "You reported snow or ice, so footwear needs to work with microspikes instead of relying on smooth soles.",
    );
  }

  if (conditions.muddyOrWet || conditions.snowOrIce) {
    manualFootwearWhyParts.push(
      "Wet or snowy trail sections make backup socks more useful, so they are listed separately below.",
    );
  }

  const essential: PackingItem[] = [
    expectedHours !== null && expectedHours >= 5
      ? buildWaterItem({
          expectedHours,
          distance: distanceMiles ?? undefined,
          gain: elevationGainFeet ?? undefined,
          hotConditions: false,
          sourceLabels: manualWaterSourceLabels,
        })
      : item({
          name: "Water",
          question: "How much water should I bring?",
          recommendation: longerByManualFacts
            ? "Bring 2-3 liters per adult. Do not treat this as a group total."
            : "Bring 1-2 liters per person. Do not treat this as a group total.",
          why: longerByManualFacts
            ? "Your entered distance or elevation suggests more than a short outing. Use the higher end for heat, full sun, slow pacing, or if an adult is carrying backup water for kids."
            : "TrailPack has only a limited manual profile. Use the higher end if the hike is hot, exposed, slow, or longer than expected.",
          sourceLabels: longerByManualFacts ? ["user-provided", "inferred"] : ["missing", "inferred"],
        }),
    expectedHours !== null && expectedHours >= 6
      ? buildFoodItem({
          expectedHours,
          distance: distanceMiles ?? undefined,
          gain: elevationGainFeet ?? undefined,
          sourceLabels: ["user-provided", "missing", "inferred"],
        })
      : item({
          name: "Food",
          question: "How much food should I bring?",
          recommendation: longerByManualFacts
            ? "Pack lunch plus 2-3 trail snacks per person. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks."
            : "Bring 1-2 easy trail snacks per person as a baseline, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.",
          why: longerByManualFacts
            ? "Your entered trail facts suggest more than a short outing."
            : "The manual fallback is intentionally conservative while trail distance and effort are still incomplete.",
          sourceLabels: longerByManualFacts ? ["user-provided", "inferred"] : ["missing", "inferred"],
        }),
    item({
      name: "Trail footwear",
      question: "What footwear setup fits this hike?",
      recommendation: manualFootwearRecommendationParts.join(" "),
      why: manualFootwearWhyParts.join(" "),
      affectedBy: uniqueStrings([
        conditions.muddyOrWet ? "Wet" : null,
        conditions.snowOrIce ? "Snow/Ice" : null,
      ].filter((value): value is string => Boolean(value))),
      sourceLabels: uniqueSourceLabels(manualFootwearSourceLabels),
    }),
    item({
      name: "Sun protection",
      question: "What sun protection should I bring?",
      recommendation:
        "Bring sunscreen, sunglasses, a brimmed hat, and a lightweight UPF or long-sleeve sun shirt.",
      why:
        "The manual fallback does not have a source-backed forecast yet, so TrailPack keeps basic sun protection in the list. A breathable sun shirt protects skin without relying only on reapplying sunscreen.",
      sourceLabels: ["inferred"],
    }),
    item({
      name: "First-aid basics",
      question: "What first-aid supplies are actually basic?",
      answer:
        "Carry blister pads or moleskin, a few adhesive bandages, antiseptic wipes, pain reliever, personal medications, and any allergy or asthma supplies. These basics are useful even before the hike stats are complete.",
      sourceLabels: ["inferred"],
    }),
  ];
  const optional: PackingItem[] = [
    item({
      name: "Offline map",
      question: "Do I need a map if I have my phone?",
      answer:
        "Save an offline map before leaving. Unsupported hikes may have weaker trail data in TrailPack, and cell service can be limited in mountain areas.",
      sourceLabels: ["inferred"],
    }),
    item({
      name: "Light rain or wind shell",
      question: "Do I need a jacket or shell?",
      answer:
        "Carry a light jacket, wind shell, or rain shell as a conservative manual-entry fallback. It covers surprise rain, wind, shade, or a slower-than-planned finish without adding much weight.",
      sourceLabels: ["inferred"],
    }),
  ];
  const missingDetails: string[] = [];

  if (expectedHours !== null && expectedHours >= 5) {
    optional.push(
      buildWaterLogisticsItem({
        expectedHours,
        sourceLabels: manualWaterSourceLabels,
      }),
    );
  }

  optional.push(
    buildExtraSocksItem({
      affectedBy: [
        conditions.muddyOrWet ? "Wet" : null,
        conditions.snowOrIce ? "Snow/Ice" : null,
        expectedHours !== null && expectedHours >= 6 ? "Duration" : null,
      ].filter((value): value is string => Boolean(value)),
      wetOrSnowy: conditions.muddyOrWet || conditions.snowOrIce,
      longDay: expectedHours !== null && expectedHours >= 6,
    }),
  );

  if (isRegionalBugSeason(userInput.plannedDate)) {
    optional.push(buildInsectRepellentItem(userInput.plannedDate));
  }

  if (expectedHours !== null && expectedHours >= 6) {
    essential.push(
      item({
        name: "Headlamp",
        question: "Do I need a headlamp?",
        recommendation: "Bring a small headlamp.",
        why: `An unsupported hike planned for about ${expectedHours} hr can run late, and this manual fallback does not have source-backed civil twilight timing yet.`,
        affectedBy: ["Duration"],
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
    const manualFoodReserveTarget = expectedHours >= 8 ? essential : optional;
    manualFoodReserveTarget.push(
      item({
        name: "Extra food reserve",
        question: "How much extra food should I add for a long day?",
        recommendation:
          "Add at least one extra substantial snack per person beyond meals and normal trail snacks for a long unsupported-hike day.",
        why:
          "This is your delay buffer for slow pacing, weather, a missed turn, or a longer-than-planned exit. Choose calorie-dense food you will actually eat, such as a bar, nuts, jerky, dried fruit, or a salty snack.",
        affectedBy: ["Duration"],
        sourceLabels: ["user-provided", "inferred"],
      }),
    );

    const saltSupport = buildSaltSupportItems({
      expectedHours,
      profileHours: null,
      highHeatConditions: false,
      sourceLabels: ["user-provided", "missing", "inferred"],
    });
    essential.push(...saltSupport.essential);
    optional.push(...saltSupport.optional);
  }

  if (conditions.snowOrIce) {
    essential.push(
      item({
        name: "Traction devices (microspikes)",
        question: "Do I need traction?",
        recommendation:
          "Bring pull-on traction devices such as microspikes, and test that they fit your shoes or boots before the hike.",
        why:
          "You reported snow or ice. Microspikes are small metal traction devices that stretch over footwear and bite into packed snow or ice better than regular tread. Buy or rent them from an outdoor gear shop before reaching the trailhead; TrailPack does not know a verified rental counter for this manual route.",
        affectedBy: ["Snow/Ice", "Trail conditions"],
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
  }

  if (routeType === "point-to-point") {
    optional.push(
      item({
        name: "Route plan or shuttle check",
        question: "Do I need a pickup or turnaround plan?",
        answer:
          "Yes. A point-to-point manual route may need a shuttle, pickup, second car, or explicit turnaround plan before you start hiking.",
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
  }

  if (distanceMiles === null) {
    missingDetails.push(
      "Trail distance would improve hydration and food sizing for this fallback list.",
    );
  }

  if (elevationGainFeet === null) {
    missingDetails.push(
      "Elevation gain would improve effort-based recommendations for this fallback list.",
    );
  }

  if (!routeType) {
    missingDetails.push(
      "Route type would improve navigation and route-planning recommendations.",
    );
  }

  if (!userInput.expectedDuration) {
    missingDetails.push(
      "Your expected time out would improve hydration and food sizing for this fallback list.",
    );
  }

  if (!userInput.startTime) {
    missingDetails.push(
      "Your start time would improve daylight and headlamp guidance for this fallback list.",
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
    tripAlerts: [],
    essential: essential.map(enforceOfficialProvenance),
    optional: optional.map(enforceOfficialProvenance),
    missingDetails,
    confidenceNote: buildManualConfidenceNote(distanceMiles, elevationGainFeet, routeType),
  };
}

function buildManualConfidenceNote(
  distanceMiles: number | null,
  elevationGainFeet: number | null,
  routeType: RouteType | null,
): string {
  const facts = [
    distanceMiles !== null ? `${formatManualNumber(distanceMiles)} mi` : null,
    elevationGainFeet !== null ? `${formatManualNumber(elevationGainFeet)} ft gain` : null,
    routeType,
  ].filter(Boolean);

  const factSentence =
    facts.length > 0
      ? ` Manual facts used: ${facts.join(", ")}.`
      : " Trail distance, elevation gain, and route type are still missing.";

  return (
    "This is a limited fallback list for an unsupported or incomplete hike profile." +
    factSentence +
    " Source-backed weather is still missing in the current manual-entry prototype."
  );
}
