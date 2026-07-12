import type {
  PackingItem,
  PackingRecommendation,
  TripAlert,
} from "@/features/trailpack/types";
import { SourceBadge } from "./SourceBadge";

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
}: {
  recommendation: PackingRecommendation;
}) {
  const groups = groupRecommendationItems(recommendation);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-slate-500">Today&apos;s TrailPack</p>
          <h2 className="mt-1 text-2xl font-semibold text-slate-900">
            {recommendation.trailName}
          </h2>
        </div>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
          Rule-based list · {new Date(recommendation.generatedAt).toLocaleString()}
        </p>
      </div>

      <p className="mt-4 rounded-lg border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
        {recommendation.confidenceNote}
      </p>
      <p className="mt-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-xs leading-5 text-slate-600">
        Suggested list only, not a complete safety checklist. Adjust for your
        group, health needs, experience, route changes, current conditions, and
        official park guidance.
      </p>

      <TripAlerts alerts={recommendation.tripAlerts} />

      <div className="mt-6 space-y-6">
        {groups.map((group) => (
          <RecommendationGroup
            key={group.title}
            title={group.title}
            items={group.items}
          />
        ))}
      </div>

      {recommendation.missingDetails.length > 0 ? (
        <div className="mt-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900">
            Missing details that could improve this list
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
            {recommendation.missingDetails.map((detail) => (
              <li key={detail}>{detail}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function TripAlerts({ alerts }: { alerts: TripAlert[] }) {
  if (alerts.length === 0) {
    return null;
  }

  return (
    <div className="mt-5 rounded-lg border border-amber-200 bg-amber-50 p-4">
      <div className="flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-amber-950">Overall alerts</h3>
        <span className="text-xs font-medium text-amber-900">
          {alerts.length} {alerts.length === 1 ? "alert" : "alerts"}
        </span>
      </div>
      <ul className="mt-3 space-y-3">
        {alerts.map((alert) => (
          <li
            key={alert.id}
            className={`rounded-md border px-3 py-3 ${alertClassName(alert.severity)}`}
          >
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border text-xs font-bold">
                !
              </span>
              <p className="text-sm font-semibold">{alert.title}</p>
              {alert.affectedBy.map((tag) => (
                <ContextChip key={`${alert.id}-${tag}`} label={tag} />
              ))}
            </div>
            <p className="mt-2 text-sm leading-6">{alert.summary}</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {alert.sourceLabels.map((label) => (
                <SourceBadge key={`${alert.id}-${label}`} label={label} />
              ))}
              {alert.sourceUrl ? (
                <a
                  href={alert.sourceUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-emerald-700 underline"
                >
                  Source
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
}: {
  title: GroupTitle;
  items: PrioritizedItem[];
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
        <span className="text-sm text-slate-500">
          {items.length} {items.length === 1 ? "item" : "items"}
        </span>
      </div>
      <ul className="mt-3 space-y-2">
        {items.map((item) => (
          <RecommendationRow key={`${item.priority}-${item.name}`} item={item} />
        ))}
      </ul>
    </section>
  );
}

function RecommendationRow({ item }: { item: PrioritizedItem }) {
  const rowClassName = recommendationRowClassName(item);
  const accentClassName = recommendationAccentClassName(item);

  return (
    <li>
      <details className={`group overflow-hidden rounded-lg border ${rowClassName}`}>
        <summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
          <div className="flex gap-3">
            <span className={`w-1.5 shrink-0 rounded-full ${accentClassName}`} />
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-600 transition-transform group-open:rotate-45">
              +
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                <PriorityBadge priority={item.priority} />
                {item.criticalKind === "trip-decision" ? (
                  <StatusBadge tone="danger" label="Change plan" />
                ) : null}
                {item.criticalKind === "safety-critical" ? (
                  <StatusBadge tone="critical" label="Safety-critical" />
                ) : null}
                {item.alertImpactTags.length > 0 ? (
                  <StatusBadge tone="alert" label="Alert changes this" />
                ) : null}
                {item.affectedBy?.map((tag) => (
                  <ContextChip
                    key={`${item.name}-${tag}`}
                    label={tag}
                    active={item.alertImpactTags.includes(tag)}
                  />
                ))}
              </div>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {item.recommendation}
              </p>
            </div>
          </div>
        </summary>
        <div className="border-t border-slate-200 px-4 pb-4 pt-3 text-sm leading-6 text-slate-700">
          <div>
            <p className="text-xs font-semibold uppercase text-slate-500">
              Why
            </p>
            <p className="mt-1">{item.why}</p>
          </div>

          {item.contextNotes && item.contextNotes.length > 0 ? (
            <div className="mt-3 space-y-2">
              {item.contextNotes.map((note) => (
                <div
                  key={`${item.name}-${note.label}`}
                  className="rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <p className="text-xs font-semibold uppercase text-slate-500">
                    {note.label}
                  </p>
                  <p className="mt-1">{note.text}</p>
                </div>
              ))}
            </div>
          ) : null}

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {item.sourceLabels.map((label) => (
              <SourceBadge key={`${item.name}-${label}`} label={label} />
            ))}
            {item.links?.map((link) => (
              <a
                key={`${item.name}-${link.url}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-700 underline"
              >
                {link.label}
              </a>
            ))}
            {!item.links && item.sourceUrl ? (
              <a
                href={item.sourceUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-emerald-700 underline"
              >
                Source
              </a>
            ) : null}
          </div>
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

  for (const item of prioritized) {
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
