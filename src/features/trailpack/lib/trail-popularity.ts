const POPULARITY_SCHEMA_VERSION = 1;
export const TRAIL_POPULARITY_STORAGE_KEY =
  "trailpack:trail-popularity:v1";

export interface TrailPopularity {
  version: typeof POPULARITY_SCHEMA_VERSION;
  clicks: Record<string, number>;
}

export const EMPTY_TRAIL_POPULARITY: TrailPopularity = {
  version: POPULARITY_SCHEMA_VERSION,
  clicks: {},
};

export function parseTrailPopularity(
  stored: string | null,
  supportedTrailIds: readonly string[],
): TrailPopularity {
  if (!stored) {
    return EMPTY_TRAIL_POPULARITY;
  }

  try {
    const parsed = JSON.parse(stored) as Partial<TrailPopularity>;
    if (
      parsed.version !== POPULARITY_SCHEMA_VERSION ||
      !parsed.clicks ||
      typeof parsed.clicks !== "object" ||
      Array.isArray(parsed.clicks)
    ) {
      return EMPTY_TRAIL_POPULARITY;
    }

    const supported = new Set(supportedTrailIds);
    const clicks: Record<string, number> = {};
    for (const [trailId, count] of Object.entries(parsed.clicks)) {
      if (
        supported.has(trailId) &&
        typeof count === "number" &&
        Number.isSafeInteger(count) &&
        count > 0
      ) {
        clicks[trailId] = count;
      }
    }

    return { version: POPULARITY_SCHEMA_VERSION, clicks };
  } catch {
    return EMPTY_TRAIL_POPULARITY;
  }
}

export function incrementTrailPopularity(
  popularity: TrailPopularity,
  trailId: string,
): TrailPopularity {
  const current = popularity.clicks[trailId] ?? 0;
  return {
    version: POPULARITY_SCHEMA_VERSION,
    clicks: {
      ...popularity.clicks,
      [trailId]: Math.min(current + 1, Number.MAX_SAFE_INTEGER),
    },
  };
}

export function shuffleTrailIds(
  trailIds: readonly string[],
  random: () => number = Math.random,
): string[] {
  const shuffled = [...trailIds];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [
      shuffled[swapIndex],
      shuffled[index],
    ];
  }
  return shuffled;
}

export function getPopularTrailIds(
  popularity: TrailPopularity,
  fallbackOrder: readonly string[],
  limit = 3,
): string[] {
  const fallbackIndex = new Map(
    fallbackOrder.map((trailId, index) => [trailId, index]),
  );
  const clicked = Object.entries(popularity.clicks)
    .filter(([trailId]) => fallbackIndex.has(trailId))
    .sort(
      ([leftId, leftCount], [rightId, rightCount]) =>
        rightCount - leftCount ||
        (fallbackIndex.get(leftId) ?? 0) -
          (fallbackIndex.get(rightId) ?? 0),
    )
    .map(([trailId]) => trailId);

  const selected = new Set(clicked);
  return [
    ...clicked,
    ...fallbackOrder.filter((trailId) => !selected.has(trailId)),
  ].slice(0, limit);
}

export function hasTrailPopularity(popularity: TrailPopularity): boolean {
  return Object.keys(popularity.clicks).length > 0;
}
