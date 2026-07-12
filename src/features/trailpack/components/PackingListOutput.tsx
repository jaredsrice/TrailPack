import type {
  PackingItem,
  PackingRecommendation,
  TripAlert,
} from "@/features/trailpack/types";
import { SourceBadge } from "./SourceBadge";

type Priority = "Essential" | "Optional";
type PrioritizedItem = PackingItem & { priority: Priority };

const GROUP_ORDER = [
  "Food & Water",
  "Footwear & Traction",
  "Clothing & Weather",
  "Safety & Navigation",
  "Wildlife & Alerts",
  "Comfort & Backups",
] as const;

type GroupTitle = (typeof GROUP_ORDER)[number];

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
        <span className="text-sm text-slate-500">{items.length} items</span>
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
  return (
    <li>
      <details className="group rounded-lg border border-slate-200 bg-slate-50">
        <summary className="cursor-pointer list-none p-4 [&::-webkit-details-marker]:hidden">
          <div className="flex gap-3">
            <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-slate-300 bg-white text-sm font-semibold text-slate-600 transition-transform group-open:rotate-45">
              +
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-slate-950">{item.name}</p>
                <PriorityBadge priority={item.priority} />
                {item.affectedBy?.map((tag) => (
                  <ContextChip key={`${item.name}-${tag}`} label={tag} />
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
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : "border-slate-200 bg-white text-slate-600";

  return (
    <span className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${className}`}>
      {priority}
    </span>
  );
}

function ContextChip({ label }: { label: string }) {
  return (
    <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-xs font-medium text-amber-900">
      {label}
    </span>
  );
}

function groupRecommendationItems(recommendation: PackingRecommendation): Array<{
  title: GroupTitle;
  items: PrioritizedItem[];
}> {
  const grouped = new Map<GroupTitle, PrioritizedItem[]>(
    GROUP_ORDER.map((title) => [title, []]),
  );

  const prioritized: PrioritizedItem[] = [
    ...recommendation.essential.map((item) => ({
      ...item,
      priority: "Essential" as const,
    })),
    ...recommendation.optional.map((item) => ({
      ...item,
      priority: "Optional" as const,
    })),
  ];

  for (const item of prioritized) {
    grouped.get(groupForItem(item.name))?.push(item);
  }

  return GROUP_ORDER.map((title) => ({
    title,
    items: grouped.get(title) ?? [],
  })).filter((group) => group.items.length > 0);
}

function groupForItem(itemName: string): GroupTitle {
  if (
    [
      "Water",
      "Food",
      "Electrolytes or salty snack",
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
      "Offline map",
      "First-aid basics",
      "Route plan or shuttle check",
    ].includes(itemName)
  ) {
    return "Safety & Navigation";
  }

  if (
    ["Bear spray", "Review active alerts before leaving"].includes(itemName)
  ) {
    return "Wildlife & Alerts";
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
