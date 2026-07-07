import type {
  AlertContext,
  PackingItem,
  PackingRecommendation,
  RouteType,
  TrailProfile,
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

type PackingItemInput = Omit<PackingItem, "reason"> & {
  reason?: string;
};

function item(input: PackingItemInput): PackingItem {
  return {
    ...input,
    reason: input.reason ?? input.answer,
  };
}

function uniqueSourceLabels(labels: PackingItem["sourceLabels"]): PackingItem["sourceLabels"] {
  return Array.from(new Set(labels));
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

  essential.push(
    item({
      name: "Supportive trail shoes or hiking shoes",
      question: "What should I wear on my feet?",
      answer: shortByProfile
        ? "Wear comfortable shoes with decent tread. Basic tennis shoes can work for a short, dry, low-gain trail, but grippier trail runners or hiking shoes are better if the trail is wet, rocky, or muddy."
        : `Wear supportive trail runners or hiking shoes with good tread. Basic tennis shoes can work on short, dry, low-gain walks, but this ${trail.difficulty.value.toLowerCase()} ${distance} mi route with ${gain} ft gain makes grippy, supportive footwear the better default.`,
      sourceLabels: ["supported-profile", "inferred"],
    }),
  );

  const longByProfile = distance >= 5 || gain >= 800;
  const longByUserDuration = expectedHours !== null && expectedHours >= 5;

  if (longByProfile || longByUserDuration) {
    const answer = longByUserDuration
      ? `Longer planned day (about ${expectedHours} hr) needs steady hydration.`
      : `Longer effort (${distance} mi, ${duration}) needs steady hydration.`;
    essential.push(
      item({
        name: "Water: 2-3 L per adult",
        question: "How much water should I bring?",
        answer: `Bring 2-3 liters per adult. ${answer} Use the higher end for heat, full sun, slower pacing, or if an adult is carrying backup water for kids. Do not treat this as a group total.`,
        sourceLabels: longByUserDuration
          ? ["user-provided", "supported-profile"]
          : ["supported-profile"],
      }),
    );
  } else {
    essential.push(
      item({
        name: "Water: 1-2 L per person",
        question: "How much water should I bring?",
        answer: `Bring 1-2 liters per person for this ${distance} mi hike. Use the higher end if it is hot, sunny, or your group moves slowly, and do not treat this as a group total.`,
        sourceLabels: ["supported-profile"],
      }),
    );
  }

  essential.push(
    item({
      name: shortByProfile
        ? "Food: 1-2 trail snacks per person"
        : "Food: lunch plus 2-3 snacks per person",
      question: "How much food is enough?",
      answer: shortByProfile
        ? `Bring 1-2 easy trail snacks per person for this ${duration.toLowerCase()} hike, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.`
        : `Pack lunch plus 2-3 trail snacks per person for ${duration} on trail. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks.`,
      sourceLabels: ["supported-profile"],
    }),
  );

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
        question: "Do I need a headlamp with this start time?",
        answer: `${headlampDecision.reason} A small headlamp is more reliable than counting on a phone battery for trail light.`,
        reason: headlampDecision.reason,
        sourceLabels: headlampDecision.sourceLabels,
      }),
    );
  }

  if (expectedHours !== null && expectedHours >= 6) {
    optional.push(
      item({
        name: "Extra food reserve",
        question: "How much extra food should I add for a long day?",
        answer: `Add at least one extra substantial snack per person beyond lunch and your normal trail snacks for an about ${expectedHours} hr day. Choose calorie-dense food you will actually eat, such as a bar, nuts, jerky, dried fruit, or a salty snack.`,
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
  }

  essential.push(
    item({
      name: "Bear spray",
      question: "Do I need bear spray, and where do I get it?",
      answer:
        "Yes. NPS recommends carrying bear spray in Grand Teton, and it should be immediately reachable, not buried in your pack. Bring an EPA-registered can before hiking, or rent/buy one before you reach the trailhead; Bear Aware lists current Jackson and Jackson Hole Airport pickup/drop-off options.",
      sourceLabels: ["official"],
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
        question: "Do I need a jacket for rain or wind?",
        answer: `Bring a light rain shell because the forecast says: ${weather.summary} It keeps rain and wind off without needing a heavy summer layer.`,
        sourceLabels: ["forecast-based"],
      }),
    );
  } else {
    optional.push(
      item({
        name: "Light rain or wind shell",
        question: "Do I need a jacket for rain or wind?",
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
        answer:
          "Bring sunscreen, sunglasses, and a brimmed hat. Alpine sun can still be strong on mild days, especially near lakes, rock, snow patches, or exposed shoreline.",
        sourceLabels: ["forecast-based", "inferred"],
      }),
    );
  }

  if (hotConditions) {
    const waterIndex = essential.findIndex((item) => item.name.startsWith("Water:"));
    if (waterIndex !== -1) {
      const existingWater = essential[waterIndex];
      const answer =
        existingWater.name === "Water: 2-3 L per adult"
          ? `${existingWater.answer} Warm exposed conditions reinforce using the higher end.`
          : "Bring 2-3 liters per adult because warm exposed conditions increase sweat loss. Use the higher end for full sun, slower pacing, or if an adult is carrying backup water for kids. Do not treat this as a group total.";
      essential[waterIndex] = {
        ...existingWater,
        name: "Water: 2-3 L per adult",
        answer,
        reason: answer,
        sourceLabels: uniqueSourceLabels([...existingWater.sourceLabels, "forecast-based"]),
      };
    }

    optional.push(
      item({
        name: "Electrolytes or salty snack",
        question: "Do I need electrolytes?",
        answer:
          "Bring electrolyte tabs, a salty snack, or a sports drink if you expect to sweat. They help replace salt on hot, exposed hiking days and make it easier to keep drinking water.",
        sourceLabels: ["forecast-based", "inferred"],
      }),
    );
    optional.push(
      item({
        name: "Breathable sun layer",
        question: "What should I wear for hot sun?",
        answer:
          "Wear a breathable long-sleeve sun shirt or light layer if you burn easily or will spend hours in exposed sun. It should be light and ventilated, not a heavy warm layer.",
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
        answer:
          "Yes if your trail report is accurate. You reported snow or ice, so microspikes help on slick shaded sections, packed snow, or icy bridges where regular shoe tread can slide.",
        sourceLabels: ["user-provided"],
      }),
    );
    optional.push(
      item({
        name: "Trekking poles",
        question: "Why would I bring trekking poles?",
        answer:
          "Use trekking poles if you have them because you reported snow or ice. They add balance on slick sections and descents, but they do not replace microspikes when traction is needed.",
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
  }

  if (conditions.muddyOrWet) {
    optional.push(
      item({
        name: "Waterproof footwear or gaiters",
        question: "Can I do this in tennis shoes if it is wet or muddy?",
        answer:
          "You reported mud or wet trail, so waterproof hiking shoes, boots, or gaiters are better than basic tennis shoes. Wet cotton socks and slick soles increase blister and slip risk.",
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
  }

  if (
    conditions.muddyOrWet ||
    conditions.snowOrIce ||
    weather.conditions.includes("rain") ||
    weather.conditions.includes("snow")
  ) {
    const sockSourceLabels: PackingItem["sourceLabels"] = [];
    if (conditions.muddyOrWet || conditions.snowOrIce) {
      sockSourceLabels.push("user-provided");
    }
    if (weather.conditions.includes("rain") || weather.conditions.includes("snow")) {
      sockSourceLabels.push("forecast-based");
    }
    sockSourceLabels.push("inferred");

    optional.push(
      item({
        name: "Extra dry socks",
        question: "Should I bring extra socks?",
        answer:
          "Pack one dry pair of socks if rain, mud, snow, or wet trail sections are possible. Dry socks reduce blister risk and give you a simple fix without changing shoes.",
        sourceLabels: uniqueSourceLabels(sockSourceLabels),
      }),
    );
  }

  optional.push(
    item({
      name: "Offline map",
      question: "Do I need a map if I have my phone?",
      answer:
        "Save an offline map before leaving because cell service can be limited in mountain areas. Do not depend on live service for route finding, pickup timing, or checking your return path.",
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
        sourceLabels: allAlertsOfficial ? ["official"] : ["unavailable"],
        sourceUrl: allAlertsOfficial ? alerts.alerts[0].sourceUrl : undefined,
      }),
    );
  }

  if (gain >= 1000 && !conditions.snowOrIce) {
    optional.push(
      item({
        name: "Trekking poles",
        question: "Why would I bring trekking poles?",
        answer: `${gain} ft of elevation gain means descents can be harder on knees. Trekking poles are optional, but they help with balance, steady pacing, rocky steps, and long downhill sections.`,
        sourceLabels: ["supported-profile", "inferred"],
      }),
    );
  }

  optional.push(
    item({
      name: "Light jacket or warm layer",
      question: "Do I need a warm layer in summer?",
      answer:
        "In summer, make this a light jacket, fleece, wind shirt, or rain shell, not a heavy winter coat. Elevation near 6,900 ft, shade, wind, rain, or an evening finish can feel cooler than the valley.",
      sourceLabels: ["supported-profile", "inferred"],
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

  const essential: PackingItem[] = [
    item({
      name: longerByManualFacts ? "Water: 2-3 L per adult" : "Water: 1-2 L per person",
      question: "How much water should I bring?",
      answer: longerByManualFacts
        ? "Bring 2-3 liters per adult because your entered distance or elevation suggests more than a short outing. Use the higher end for heat, full sun, slow pacing, or if an adult is carrying backup water for kids. Do not treat this as a group total."
        : "Bring 1-2 liters per person while TrailPack has only a limited manual profile. Use the higher end if the hike is hot, exposed, slow, or longer than expected, and do not treat this as a group total.",
      sourceLabels: longerByManualFacts ? ["user-provided", "inferred"] : ["missing", "inferred"],
    }),
    item({
      name: longerByManualFacts
        ? "Food: lunch plus 2-3 snacks per person"
        : "Food: 1-2 trail snacks per person",
      question: "How much food is enough?",
      answer: longerByManualFacts
        ? "Pack lunch plus 2-3 trail snacks per person because your entered trail facts suggest more than a short outing. Good options are sandwiches or wraps plus bars, trail mix, jerky, fruit, or salty snacks."
        : "Bring 1-2 easy trail snacks per person as a baseline, such as bars, trail mix, fruit, or a small sandwich for kids who may need breaks.",
      sourceLabels: longerByManualFacts ? ["user-provided", "inferred"] : ["missing", "inferred"],
    }),
    item({
      name: "Sun protection",
      question: "What sun protection should I bring?",
      answer:
        "Bring sunscreen, sunglasses, and a brimmed hat. The manual fallback does not have a source-backed forecast yet, so TrailPack keeps basic sun protection in the list.",
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
      question: "Do I need a jacket for rain or wind?",
      answer:
        "Carry a light jacket, wind shell, or rain shell as a conservative manual-entry fallback. It covers surprise rain, wind, shade, or a slower-than-planned finish without adding much weight.",
      sourceLabels: ["inferred"],
    }),
  ];
  const missingDetails: string[] = [];

  if (expectedHours !== null && expectedHours >= 5) {
    essential[0] = item({
      name: "Water: 2-3 L per adult",
      question: "How much water should I bring?",
      answer: `Bring 2-3 liters per adult because your planned time out is about ${expectedHours} hr. Use the higher end for heat, full sun, slow pacing, or if an adult is carrying backup water for kids. Do not treat this as a group total.`,
      sourceLabels: ["user-provided", "missing"],
    });
  }

  if (expectedHours !== null && expectedHours >= 6) {
    essential.push(
      item({
        name: "Headlamp",
        question: "Do I need a headlamp with this start time?",
        answer: `Bring a small headlamp because an unsupported hike planned for about ${expectedHours} hr can run late, and this manual fallback does not have source-backed civil twilight timing yet.`,
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
    optional.push(
      item({
        name: "Extra food reserve",
        question: "How much extra food should I add for a long day?",
        answer:
          "Add at least one extra substantial snack per person beyond lunch and normal trail snacks for a long unsupported-hike day. Choose calorie-dense food you will actually eat, such as a bar, nuts, jerky, dried fruit, or a salty snack.",
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
  }

  if (conditions.snowOrIce) {
    essential.push(
      item({
        name: "Traction devices (microspikes)",
        question: "Do I need traction?",
        answer:
          "Yes if your trail report is accurate. You reported snow or ice, so microspikes help on slick shaded sections, packed snow, or icy bridges where regular shoe tread can slide.",
        sourceLabels: ["user-provided"],
      }),
    );
  }

  if (conditions.muddyOrWet) {
    optional.push(
      item({
        name: "Waterproof footwear or gaiters",
        question: "Can I do this in tennis shoes if it is wet or muddy?",
        answer:
          "You reported mud or wet trail conditions, so waterproof hiking shoes, boots, or gaiters are better than basic tennis shoes. Wet cotton socks and slick soles increase blister and slip risk.",
        sourceLabels: ["user-provided", "inferred"],
      }),
    );
  }

  if (conditions.muddyOrWet || conditions.snowOrIce) {
    optional.push(
      item({
        name: "Extra dry socks",
        question: "Should I bring extra socks?",
        answer:
          "Pack one dry pair of socks if mud, snow, ice, or wet trail sections are possible. Dry socks reduce blister risk and give you a simple fix without changing shoes.",
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
