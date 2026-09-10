import { TRAIL_CATALOG } from "../data/trail-catalog";
import type { RouteType, TrailProfile } from "../types";

export interface TrailGroup {
  id: string;
  name: string;
  park: string;
  state: string;
  routes: TrailProfile[];
}

/** Discovery groups names; APIs, forecasts and saved lists keep concrete route IDs. */
export function buildTrailGroups(catalog: Readonly<Record<string, TrailProfile>>): Record<string, TrailGroup> {
  const groups: Record<string, TrailGroup> = Object.create(null);
  for (const route of Object.values(catalog)) {
    const id = route.accessRoute?.groupId ?? route.id;
    const name = route.accessRoute?.groupName ?? route.name;
    const existing = groups[id];
    if (existing && (existing.name !== name || existing.park !== route.park || existing.state !== route.state)) {
      throw new Error(`Conflicting trail group metadata for ${id}.`);
    }
    const group = existing ?? { id, name, park: route.park, state: route.state, routes: [] };
    if (group.routes.some((entry) => entry.accessRoute?.label === route.accessRoute?.label)) {
      throw new Error(`Duplicate access label in ${id}.`);
    }
    group.routes.push(route);
    groups[id] = group;
  }
  for (const group of Object.values(groups)) {
    if (!group.routes.some((route) => route.id === group.id)) {
      throw new Error(`Trail group ${group.id} must retain its original route ID.`);
    }
    group.routes.sort((a, b) => Number(b.id === group.id) - Number(a.id === group.id));
  }
  return groups;
}

export const TRAIL_GROUPS = buildTrailGroups(TRAIL_CATALOG);

export function getTrailGroup(id: string): TrailGroup | null {
  return Object.hasOwn(TRAIL_GROUPS, id) ? TRAIL_GROUPS[id] : null;
}

/** Never choose the first of several access options on the hiker's behalf. */
export function resolveGroupRoute(group: TrailGroup, routeId?: string): TrailProfile | null {
  if (routeId !== undefined) return group.routes.find((route) => route.id === routeId) ?? null;
  return group.routes.length === 1 ? group.routes[0] : null;
}

export function formatRouteMiles(route: Pick<TrailProfile, "distanceMiles">): string {
  return `${route.distanceMiles.label === "inferred" ? "~" : ""}${route.distanceMiles.value} mi`;
}

export function formatRouteGain(route: Pick<TrailProfile, "elevationGainFeet">): string {
  return route.elevationGainFeet.value === null ? "Gain unverified" : `${route.elevationGainFeet.value.toLocaleString()} ft gain`;
}

export function describeRouteDistance(route: Pick<TrailProfile, "routeType" | "distanceMiles" | "accessRoute">): string {
  if (route.accessRoute?.transport === "shuttle-out-walk-back" || route.accessRoute?.transport === "walk-out-shuttle-back") {
    return `${formatRouteMiles(route)} hiking · Mixed walk + boat · complete itinerary`;
  }
  const basis: Record<RouteType, string> = {
    "out-and-back": "Out-and-back · return included",
    loop: "Loop · full circuit",
    "point-to-point": "One-way · return not included",
    unknown: "Route type unconfirmed · check return distance",
  };
  // NPS round-trip values are already totals. Never double them here.
  return `${formatRouteMiles(route)} · ${basis[route.routeType]}`;
}

export function describeTrailGroup(group: TrailGroup): string {
  return group.routes.length > 1
    ? `${group.routes.length} access options · choose your approach`
    : `${describeRouteDistance(group.routes[0])} · ${formatRouteGain(group.routes[0])}`;
}
