import type { SourceLabel } from "@/features/trailpack/types";

const LABEL_STYLES: Record<SourceLabel, string> = {
  "supported-profile": "bg-emerald-50 text-emerald-800 border-emerald-200",
  "user-provided": "bg-blue-50 text-blue-800 border-blue-200",
  "forecast-based": "bg-sky-50 text-sky-800 border-sky-200",
  daylight: "bg-cyan-50 text-cyan-800 border-cyan-200",
  official: "bg-green-50 text-green-800 border-green-200",
  inferred: "bg-amber-50 text-amber-800 border-amber-200",
  missing: "bg-rose-50 text-rose-800 border-rose-200",
  unavailable: "bg-slate-50 text-slate-700 border-slate-200",
  "future-work": "bg-violet-50 text-violet-800 border-violet-200",
};

const LABEL_TEXT: Record<SourceLabel, string> = {
  "supported-profile": "Supported profile",
  "user-provided": "User-provided",
  "forecast-based": "Forecast-based",
  daylight: "Daylight",
  official: "Official",
  inferred: "Inferred",
  missing: "Missing",
  unavailable: "Unavailable",
  "future-work": "Future work",
};

export function SourceBadge({ label }: { label: SourceLabel }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${LABEL_STYLES[label]}`}
    >
      {LABEL_TEXT[label]}
    </span>
  );
}
