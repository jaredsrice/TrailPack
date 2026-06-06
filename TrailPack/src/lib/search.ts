import { SUPPORTED_PARKS, SUPPORTED_TRAILS } from "@/data/supported-trails";

export type SuggestionType = "park" | "trail" | "manual";

export interface SearchSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  subtitle: string;
  parkId?: string;
  trailId?: string;
}

const MANUAL_SUGGESTION: SearchSuggestion = {
  id: "manual-entry",
  type: "manual",
  title: "Enter hike details yourself",
  subtitle: "Manual entry fallback for unsupported trails",
};

export function getSearchSuggestions(query: string): SearchSuggestion[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  const suggestions: SearchSuggestion[] = [];

  for (const park of SUPPORTED_PARKS) {
    if (
      park.name.toLowerCase().includes(normalized) ||
      park.state.toLowerCase().includes(normalized) ||
      normalized.includes("teton") ||
      normalized.includes("jenny")
    ) {
      suggestions.push({
        id: `park-${park.id}`,
        type: "park",
        title: park.name,
        subtitle: `Supported park · ${park.state}`,
        parkId: park.id,
      });
    }
  }

  for (const trail of Object.values(SUPPORTED_TRAILS)) {
    if (
      trail.name.toLowerCase().includes(normalized) ||
      trail.park.toLowerCase().includes(normalized) ||
      normalized.includes("jenny") ||
      normalized.includes("loop")
    ) {
      suggestions.push({
        id: `trail-${trail.id}`,
        type: "trail",
        title: trail.name,
        subtitle: `Supported trail · ${trail.park}`,
        trailId: trail.id,
        parkId: SUPPORTED_PARKS.find((park) => park.trailIds.includes(trail.id))?.id,
      });
    }
  }

  if (
    normalized.includes("manual") ||
    normalized.includes("enter") ||
    normalized.includes("custom")
  ) {
    suggestions.push(MANUAL_SUGGESTION);
  }

  if (suggestions.length === 0) {
    suggestions.push(MANUAL_SUGGESTION);
  }

  const unique = new Map<string, SearchSuggestion>();
  for (const suggestion of suggestions) {
    unique.set(suggestion.id, suggestion);
  }

  return Array.from(unique.values()).slice(0, 6);
}
