import type {
  AlertContext,
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

function formatTrailStats(trail: TrailProfile): string {
  return `${trail.distanceMiles.value} mi, ${trail.elevationGainFeet.value} ft gain, ${trail.estimatedDuration.value}`;
}

export function generatePackingRecommendation(
  trail: TrailProfile,
  weather: WeatherContext,
  alerts: AlertContext,
  userInput: UserHikeInput = {},
): PackingRecommendation {
  const essential: PackingRecommendation["essential"] = [];
  const optional: PackingRecommendation["optional"] = [];
  const missingDetails: string[] = [];

  const distance = trail.distanceMiles.value;
  const gain = trail.elevationGainFeet.value;
  const duration = trail.estimatedDuration.value;

  essential.push({
    name: "Sturdy hiking shoes",
    reason: `${trail.difficulty.value} trail with ${gain} ft gain benefits from supportive footwear.`,
    sourceLabels: ["supported-profile", "official"],
  });

  if (distance >= 5 || gain >= 800) {
    essential.push({
      name: "Water: 2-3 liters",
      reason: `Longer effort (${distance} mi, ${duration}) needs steady hydration.`,
      sourceLabels: ["supported-profile", "official"],
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
    sourceLabels: ["supported-profile", "official"],
  });

  essential.push({
    name: "Bear spray",
    reason: "Grand Teton is grizzly country; carry bear spray and know how to use it.",
    sourceLabels: ["official", "supported-profile"],
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

  essential.push({
    name: "Offline map",
    reason: "Cell service is limited around Jenny Lake; save a map before you go.",
    sourceLabels: ["supported-profile", "future-work"],
  });

  essential.push({
    name: "First-aid basics",
    reason: "Blister care and basic supplies for a moderate full-day loop.",
    sourceLabels: ["supported-profile"],
  });

  if (alerts.hasActiveAlerts) {
    essential.push({
      name: "Check official alerts before leaving",
      reason: alerts.alerts.map((alert) => alert.title).join("; "),
      sourceLabels: ["official"],
    });
  }

  if (gain >= 1000) {
    optional.push({
      name: "Trekking poles",
      reason: `${gain} ft gain can be easier on knees with poles, especially on descent.`,
      sourceLabels: ["supported-profile"],
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
      "Your expected pace could refine snack and water amounts.",
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
