import type {
  AlertContext,
  PackingItem,
  PackingRecommendation,
  TripAlert,
  WeatherContext,
} from "@/features/trailpack/types";
import {
  packingItemBasis,
  tripAlertBasis,
  type RecommendationBasisContext,
} from "@/features/trailpack/lib/recommendation-basis";
import { SourceBadge } from "./SourceBadge";
import { TrailPackIcon } from "./TrailPackIcon";

type Priority = "Essential" | "Optional";
type PrioritizedItem = PackingItem & {
  priority: Priority;
  alertImpactTags: string[];
  criticalKind: "trip-decision" | "safety-critical" | null;
};

const GROUP_ORDER = [
  "Critical Safety",
  "Food & Water",
  "Footwear & Traction",
  "Clothing & Weather",
  "Safety & Navigation",
  "Comfort & Backups",
] as const;

type GroupTitle = (typeof GROUP_ORDER)[number];

const FOOD_WATER_ITEM_ORDER = new Map([
  ["Water", 0],
  ["Water filter or treatment backup", 1],
  ["Food", 2],
  ["Extra food reserve", 3],
  ["Electrolytes", 4],
  ["Salty snacks", 4],
]);

const CRITICAL_SAFETY_ITEM_ORDER = new Map([
  ["Trip safety decision", 0],
  ["Review active alerts before leaving", 1],
  ["Bear spray", 2],
  ["Navigation / offline map", 3],
]);

export function PackingListOutput({
  recommendation,
  weather,
  alerts,
}: {
  recommendation: PackingRecommendation;
  weather?: WeatherContext;
  alerts?: AlertContext;
}) {
  const groups = groupRecommendationItems(recommendation);
  const basisContext = { weather, alerts };
  // Keep the NPS action in Critical Safety, not a second overview warning.
  // Only omit it when an equivalent row actually survived presentation grouping.
  const hasAlertGuidance = groups.some((group) =>
    group.items.some((item) =>
      item.name === "Review active alerts before leaving" ||
      (item.criticalKind === "trip-decision" && item.affectedBy?.includes("Official alert")),
    ),
  );
  const overviewAlerts = hasAlertGuidance
    ? recommendation.tripAlerts.filter((alert) => alert.id !== "active-alerts")
    : recommendation.tripAlerts;

  return (
    <section
      id="packing-list"
      className="packing-section"
      aria-labelledby="packing-list-heading"
    >
      <div className="section-heading-row">
        <div>
          <p className="section-kicker">Today&apos;s TrailPack</p>
          <h2 id="packing-list-heading" className="section-title">
            <span className="sr-only">Packing list for </span>
            {recommendation.trailName}
          </h2>
          <p className="section-subtitle">
            Ordered by decision impact, with each recommendation tied to its
            rule and source context.
          </p>
        </div>
        <p className="generated-at">
          Rule-based list · {new Date(recommendation.generatedAt).toLocaleString()}
        </p>
      </div>

      <p className="packing-confidence">
        {recommendation.confidenceNote}
      </p>
      <div className="packing-safety-note">
        <TrailPackIcon name="shield" className="h-5 w-5 shrink-0" />
        <p>
          Suggested list only, not a complete safety checklist. Adjust for your
          group, health needs, experience, route changes, current conditions,
          and official park guidance.
        </p>
      </div>

      <TripAlerts
        alerts={overviewAlerts}
        basisContext={basisContext}
      />

      <div className="packing-groups">
        {groups.map((group) => (
          <RecommendationGroup
            key={group.title}
            title={group.title}
            items={group.items}
            basisContext={basisContext}
          />
        ))}
      </div>

    </section>
  );
}

function TripAlerts({
  alerts,
  basisContext,
}: {
  alerts: TripAlert[];
  basisContext: RecommendationBasisContext;
}) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="trip-alerts">
      <div className="trip-alerts-heading">
        <h3>
          <TrailPackIcon name="alert" className="h-5 w-5" />
          Overall alerts
        </h3>
        <span>
          {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
        </span>
      </div>
      <ul className="trip-alert-list">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`rounded-md border px-3 py-3 ${alertClassName(alert.severity)}`}
          >
            <div className="trip-alert-title">
              <TrailPackIcon name="alert" className="h-4 w-4" />
              <p className="text-sm font-semibold">{alert.title}</p>
            </div>
            <p className="trip-alert-summary">{alert.summary}</p>
            <div className="trip-alert-source-line">
              <span>{tripAlertBasis(alert, basisContext)}</span>
              {alert.sourceUrl ? (
                <a
                  href={alert.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="source-link"
                >
                  View official alert
                </a>
              ) : null}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

function RecommendationGroup({
  title,
  items,
  basisContext,
}: {
  title: GroupTitle;
  items: PrioritizedItem[];
  basisContext: RecommendationBasisContext;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="packing-group-heading">
        <h3>{title}</h3>
        <span>
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <ul className="packing-item-list">
        {items.map((item) => (
          <RecommendationRow
            key={`${item.priority}-${item.name}`}
            item={item}
            basisContext={basisContext}
          />
        ))}
      </ul>
    </section>
  );
}

function RecommendationRow({
  item,
  basisContext,
}: {
  item: PrioritizedItem;
  basisContext: RecommendationBasisContext;
}) {
  const rowClassName = recommendationRowClassName(item);
  const accentClassName = recommendationAccentClassName(item);
  const isCriticalSafety = groupForItem(item.name) === "Critical Safety";
  const safetyContext = item.safetyContext;

  return (
    <li>
      <details className={`packing-item group ${rowClassName}`}>
        <summary>
          <div className="packing-item-summary">
            <span className={`packing-item-accent ${accentClassName}`} />
            <span className="packing-item-expand">
              <TrailPackIcon
                name="plus"
                className="h-4 w-4 transition-transform group-open:rotate-45"
              />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                {!isCriticalSafety ? <PriorityBadge priority={item.priority} /> : null}
                {item.criticalKind === "trip-decision" ? (
                  <StatusBadge
                    tone={safetyContext?.scope === "park-wide" ? "alert" : "danger"}
                    label={safetyContext?.scope === "park-wide" ? "Check route" : "Change plan"}
                  />
                ) : null}
                {item.criticalKind === "safety-critical" ? (
                  <StatusBadge tone="critical" label="Safety-critical" />
                ) : null}
                {!isCriticalSafety && item.alertImpactTags.length > 0 ? (
                  <StatusBadge tone="alert" label="Alert changes this" />
                ) : null}
                {!isCriticalSafety
                  ? item.affectedBy?.map((tag) => (
                      <ContextChip
                        key={`${item.name}-${tag}`}
                        label={tag}
                        active={item.alertImpactTags.includes(tag)}
                      />
                    ))
                  : null}
              </div>
              {safetyContext ? (
                <div className="packing-safety-context">
                  <p className="packing-safety-issue">{safetyContext.issue}</p>
                  <p className="packing-safety-impact">{safetyContext.impact}</p>
                </div>
              ) : null}
              <p className="packing-item-recommendation">
                {item.recommendation}
              </p>
              {safetyContext ? (
                <span className="packing-safety-disclosure">Why and source details</span>
              ) : null}
            </div>
          </div>
        </summary>
        <div className="packing-item-details">
          <div className="packing-item-basis">
            <p className="packing-detail-label">Basis</p>
            <p>{packingItemBasis(item, basisContext)}</p>
          </div>
          <div>
            <p className="packing-detail-label">
              Why
            </p>
            <p>{item.why}</p>
            {safetyContext ? (
              <ul className="packing-safety-evidence">
                {safetyContext.evidence.map((evidence, index) => (
                  <li key={`${index}-${evidence.title}`}>
                    <h4>{evidence.title}</h4>
                    <p>{evidence.description}</p>
                    {evidence.sourceUrl ? (
                      <a
                        href={evidence.sourceUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="source-link"
                      >
                        View source
                        <span className="sr-only"> for {evidence.title}</span>
                      </a>
                    ) : safetyContext.scope === "park-wide" ? (
                      <span className="packing-safety-source-missing">Source link unavailable</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          {item.contextNotes && item.contextNotes.length > 0 ? (
            <div className="packing-context-notes">
              {item.contextNotes.map((note) => (
                <div
                  key={`${item.name}-${note.label}`}
                  className="packing-context-note"
                >
                  <p className="packing-detail-label">
                    {note.label}
                  </p>
                  <p className="mt-1">{note.text}</p>
                </div>
              ))}
            </div>
          ) : null}

          {!safetyContext ? (
            <div className="packing-item-sources">
              {isCriticalSafety ? (
                <span className="packing-source-summary">
                  {item.sourceLabels.map(sourceLabelSummary).join(" · ")}
                </span>
              ) : (
                item.sourceLabels.map((label) => (
                  <SourceBadge key={`${item.name}-${label}`} label={label} />
                ))
              )}
              {item.links?.map((link) => (
                <a
                  key={`${item.name}-${link.url}`}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="source-link"
                >
                  {link.label}
                </a>
              ))}
              {!item.links && item.sourceUrl ? (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="source-link"
                >
                  {isCriticalSafety ? "View source" : "Source"}
                </a>
              ) : null}
            </div>
          ) : null}
        </div>
      </details>
    </li>
  );
}

function PriorityBadge({ priority }: { priority: Priority }) {
  const className =
    priority === "Essential"
      ? "border-emerald-300 bg-emerald-700 text-white shadow-sm"
      : "border-slate-200 bg-white text-slate-600";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}>
      {priority}
    </span>
  );
}

function StatusBadge({
  tone,
  label,
}: {
  tone: "alert" | "critical" | "danger";
  label: string;
}) {
  const className =
    tone === "danger"
      ? "border-red-400 bg-red-800 text-white"
      : tone === "critical"
      ? "border-red-300 bg-red-700 text-white"
      : "border-amber-300 bg-amber-200 text-amber-950";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-bold ${className}`}>
      {label}
    </span>
  );
}

function ContextChip({
  label,
  active = false,
}: {
  label: string;
  active?: boolean;
}) {
  const className = active
    ? "border-amber-300 bg-amber-200 text-amber-950"
    : "border-amber-200 bg-amber-50 text-amber-900";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
}

function recommendationRowClassName(item: PrioritizedItem): string {
  if (item.criticalKind === "trip-decision") {
    return "border-red-400 bg-red-50 shadow-md";
  }

  if (item.criticalKind === "safety-critical") {
    return "border-red-300 bg-red-50 shadow-sm";
  }

  if (item.alertImpactTags.length > 0) {
    return "border-amber-300 bg-amber-50 shadow-sm";
  }

  if (item.priority === "Essential") {
    return "border-emerald-300 bg-emerald-50 shadow-sm";
  }

  return "border-slate-200 bg-slate-50";
}

function recommendationAccentClassName(item: PrioritizedItem): string {
  if (item.criticalKind === "trip-decision") {
    return "bg-red-800";
  }

  if (item.criticalKind === "safety-critical") {
    return "bg-red-600";
  }

  if (item.alertImpactTags.length > 0) {
    return "bg-amber-500";
  }

  if (item.priority === "Essential") {
    return "bg-emerald-600";
  }

  return "bg-slate-300";
}

function groupRecommendationItems(recommendation: PackingRecommendation): Array<{
  title: GroupTitle;
  items: PrioritizedItem[];
}> {
  const grouped = new Map<GroupTitle, PrioritizedItem[]>(
    GROUP_ORDER.map((title) => [title, []]),
  );
  const activeAlertTags = new Set(
    recommendation.tripAlerts.flatMap((alert) => alert.affectedBy),
  );

  const prioritized: PrioritizedItem[] = [
    ...recommendation.essential.map((item) =>
      prioritizeItem(item, "Essential", activeAlertTags),
    ),
    ...recommendation.optional.map((item) =>
      prioritizeItem(item, "Optional", activeAlertTags),
    ),
  ];
  const hasAlertBackedTripDecision = prioritized.some(
    (item) =>
      item.criticalKind === "trip-decision" &&
      item.affectedBy?.includes("Official alert"),
  );

  for (const item of prioritized) {
    if (
      hasAlertBackedTripDecision &&
      item.name === "Review active alerts before leaving"
    ) {
      continue;
    }
    grouped.get(groupForItem(item.name))?.push(item);
  }

  return GROUP_ORDER.map((title) => ({
    title,
    items: sortGroupItems(title, grouped.get(title) ?? []),
  })).filter((group) => group.items.length > 0);
}

function prioritizeItem(
  item: PackingItem,
  priority: Priority,
  activeAlertTags: Set<string>,
): PrioritizedItem {
  const affectedBy = item.affectedBy ?? [];

  return {
    ...item,
    priority,
    alertImpactTags: affectedBy.filter((tag) => activeAlertTags.has(tag)),
    criticalKind: criticalKindForItem(item),
  };
}

function sortGroupItems(title: GroupTitle, items: PrioritizedItem[]): PrioritizedItem[] {
  if (title === "Critical Safety") {
    return sortByItemOrder(items, CRITICAL_SAFETY_ITEM_ORDER);
  }

  if (title !== "Food & Water") {
    return items;
  }

  return sortByItemOrder(items, FOOD_WATER_ITEM_ORDER);
}

function sortByItemOrder(
  items: PrioritizedItem[],
  itemOrder: Map<string, number>,
): PrioritizedItem[] {
  return [...items].sort((left, right) => {
    const leftOrder = itemOrder.get(left.name) ?? 99;
    const rightOrder = itemOrder.get(right.name) ?? 99;
    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    if (left.priority !== right.priority) {
      return left.priority === "Essential" ? -1 : 1;
    }

    return left.name.localeCompare(right.name);
  });
}

function criticalKindForItem(
  item: PackingItem,
): PrioritizedItem["criticalKind"] {
  if (item.name === "Trip safety decision") {
    return "trip-decision";
  }

  if (["Bear spray", "Navigation / offline map"].includes(item.name)) {
    return "safety-critical";
  }

  return null;
}

function groupForItem(itemName: string): GroupTitle {
  if (
    [
      "Water",
      "Food",
      "Electrolytes",
      "Salty snacks",
      "Water filter or treatment backup",
      "Extra food reserve",
    ].includes(itemName)
  ) {
    return "Food & Water";
  }

  if (
    [
      "Trail footwear",
      "Extra dry socks",
      "Traction devices (microspikes)",
      "Trekking poles",
    ].includes(itemName)
  ) {
    return "Footwear & Traction";
  }

  if (
    [
      "Rain shell",
      "Light rain or wind shell",
      "Sun protection",
      "Breathable sun layer",
      "Light jacket or warm layer",
      "Insect repellent",
    ].includes(itemName)
  ) {
    return "Clothing & Weather";
  }

  if (
    [
      "Headlamp",
      "First-aid basics",
      "Power bank / extra battery",
      "Route plan or shuttle check",
    ].includes(itemName)
  ) {
    return "Safety & Navigation";
  }

  if (
    [
      "Trip safety decision",
      "Bear spray",
      "Navigation / offline map",
      "Review active alerts before leaving",
    ].includes(itemName)
  ) {
    return "Critical Safety";
  }

  return "Comfort & Backups";
}

function alertClassName(severity: TripAlert["severity"]): string {
  if (severity === "danger") {
    return "border-red-200 bg-red-50 text-red-950";
  }

  if (severity === "caution") {
    return "border-amber-200 bg-white text-amber-950";
  }

  return "border-slate-200 bg-white text-slate-800";
}

function sourceLabelSummary(
  label: PackingItem["sourceLabels"][number],
): string {
  switch (label) {
    case "supported-profile":
    case "public-source-import":
      return "Verified trail profile";
    case "user-provided":
      return "Your trip details";
    case "forecast-based":
      return "Forecast guidance";
    case "daylight":
      return "Daylight timing";
    case "official":
      return "Official guidance";
    case "inferred":
      return "TrailPack interpretation";
    case "missing":
      return "Missing detail";
    case "unavailable":
      return "Source unavailable";
    case "future-work":
      return "Future work";
  }
}
