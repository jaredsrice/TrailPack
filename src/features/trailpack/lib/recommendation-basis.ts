import type {
  AlertContext,
  PackingItem,
  TripAlert,
  WeatherContext,
} from "@/features/trailpack/types";

export interface RecommendationBasisContext {
  weather?: WeatherContext;
  alerts?: AlertContext;
}

export function packingItemBasis(
  item: PackingItem,
  context: RecommendationBasisContext = {},
): string {
  const alertTriggered = item.affectedBy?.includes("Official alert") ?? false;
  const adjustmentSources: string[] = [];

  if (item.sourceLabels.includes("forecast-based")) {
    adjustmentSources.push(weatherBasis(context.weather));
  }

  if (item.sourceLabels.includes("daylight")) {
    adjustmentSources.push(daylightBasis(context.weather));
  }

  if (item.sourceLabels.includes("user-provided")) {
    adjustmentSources.push("your trip details");
  }

  if (alertTriggered) {
    const alertSource = alertBasis(context.alerts);
    return adjustmentSources.length > 0
      ? `Triggered by ${alertSource}; also adjusted using ${formatList(adjustmentSources)}.`
      : `Triggered by ${alertSource}.`;
  }

  if (adjustmentSources.length > 0) {
    return `Adjusted using ${formatList(adjustmentSources)}.`;
  }

  if (
    item.sourceLabels.includes("supported-profile") ||
    item.sourceLabels.includes("public-source-import")
  ) {
    return "Standard TrailPack rule based on the verified trail profile.";
  }

  if (item.sourceLabels.includes("official")) {
    return "Standard TrailPack safety rule backed by general official guidance.";
  }

  if (item.sourceLabels.includes("unavailable")) {
    return "Standard TrailPack fallback rule; no live source changed this recommendation.";
  }

  return "Standard TrailPack rule.";
}

export function tripAlertBasis(
  alert: TripAlert,
  context: RecommendationBasisContext = {},
): string {
  if (alert.sourceLabels.includes("official")) {
    return `Triggered by ${alertBasis(context.alerts)}.`;
  }

  if (alert.sourceLabels.includes("forecast-based")) {
    return `Triggered by ${weatherBasis(context.weather)}.`;
  }

  if (alert.sourceLabels.includes("user-provided")) {
    return "Triggered by your trip details.";
  }

  return "Standard TrailPack caution.";
}

function alertBasis(alerts?: AlertContext): string {
  switch (alerts?.retrievalStatus) {
    case "live":
      return "a live NPS alert";
    case "saved-fixture":
      return "saved demo alert context because live NPS alerts were unavailable";
    case "unavailable":
      return "fallback alert context because live NPS alerts were unavailable";
    default:
      return "official NPS alert context";
  }
}

function weatherBasis(weather?: WeatherContext): string {
  switch (weather?.retrievalStatus) {
    case "live":
      return "the live forecast";
    case "saved-fixture":
      return "saved example weather because the live forecast was unavailable";
    case "unavailable":
      return "fallback weather context because the live forecast was unavailable";
    default:
      return "the available forecast";
  }
}

function daylightBasis(weather?: WeatherContext): string {
  return weather?.daylight?.retrievalStatus === "live"
    ? "live daylight timing"
    : "the available daylight timing";
}

function formatList(values: string[]): string {
  const uniqueValues = [...new Set(values)];
  if (uniqueValues.length === 1) {
    return uniqueValues[0];
  }

  if (uniqueValues.length === 2) {
    return `${uniqueValues[0]} and ${uniqueValues[1]}`;
  }

  return `${uniqueValues.slice(0, -1).join(", ")}, and ${uniqueValues.at(-1)}`;
}
