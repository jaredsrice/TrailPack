import {
  getSupportedParkForTrail,
  SUPPORTED_PARKS,
} from "@/features/trailpack/data/supported-trails";
import { TRAIL_GROUPS } from "./trail-groups";

export type SuggestionType = "park" | "trail" | "public-trail" | "manual";

export interface SearchSuggestion {
  id: string;
  type: SuggestionType;
  title: string;
  subtitle: string;
  parkId?: string;
  trailId?: string;
  includesEstimates?: boolean;
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
    const searchablePark = `${park.name} ${park.state}`.toLowerCase();
    if (searchablePark.includes(normalized)) {
      suggestions.push({
        id: `park-${park.id}`,
        type: "park",
        title: park.name,
        subtitle: `Supported park · ${park.state}`,
        parkId: park.id,
      });
    }
  }

  for (const group of Object.values(TRAIL_GROUPS)) {
    const trail = group.routes[0];
    const searchableTrail = `${group.name} ${group.park} ${group.state} ${group.routes.map((route) => `${route.name} ${route.accessRoute?.label ?? ""}`).join(" ")}`.toLowerCase();
    if (searchableTrail.includes(normalized)) {
      const isPublicImport = trail.profileKind === "public-source-import";
      suggestions.push({
        id: `trail-${group.id}`,
        type: isPublicImport ? "public-trail" : "trail",
        title: group.name,
        subtitle: group.routes.length > 1
          ? `${group.routes.length} access options · ${group.park}`
          : isPublicImport
          ? `Verified NPS + USGS import · ${trail.park}`
          : `Supported trail · ${trail.park}`,
        trailId: group.id,
        ...(group.routes.some((route) => route.distanceMiles.label === "inferred") ? { includesEstimates: true } : {}),
        parkId: getSupportedParkForTrail(trail.id)?.id,
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
