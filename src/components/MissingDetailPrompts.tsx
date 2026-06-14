import type { UserHikeInput } from "@/lib/packing";

interface MissingDetailPromptsProps {
  value: UserHikeInput;
  onChange: (value: UserHikeInput) => void;
}

export function MissingDetailPrompts({ value, onChange }: MissingDetailPromptsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">A few useful details</h2>
      <p className="mt-1 text-sm text-slate-600">
        Expected time out and trail conditions can change your packing list. Date and notes
        are saved as trip context for now.
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        <label className="block text-sm">
          <span className="font-medium text-slate-700">When do you plan to hike?</span>
          <span className="ml-1 text-xs text-slate-400">(context only)</span>
          <input
            type="date"
            value={value.plannedDate ?? ""}
            onChange={(event) =>
              onChange({ ...value, plannedDate: event.target.value || undefined })
            }
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">How long do you expect to be out?</span>
          <span className="ml-1 text-xs text-emerald-700">(affects list)</span>
          <input
            type="text"
            placeholder="e.g. 4 hours"
            value={value.expectedDuration ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                expectedDuration: event.target.value || undefined,
              })
            }
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
          />
        </label>

        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-slate-700">
            Do you know of any current trail conditions?
          </span>
          <span className="ml-1 text-xs text-emerald-700">(affects list)</span>
          <input
            type="text"
            placeholder="e.g. dry, muddy near the inlet, patchy snow"
            value={value.trailConditions ?? ""}
            onChange={(event) =>
              onChange({
                ...value,
                trailConditions: event.target.value || undefined,
              })
            }
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
          />
        </label>

        <label className="block text-sm md:col-span-2">
          <span className="font-medium text-slate-700">Notes</span>
          <span className="ml-1 text-xs text-slate-400">
            (context only — not interpreted for recommendations)
          </span>
          <textarea
            rows={3}
            placeholder="Anything else you want to remember for this trip"
            value={value.notes ?? ""}
            onChange={(event) =>
              onChange({ ...value, notes: event.target.value || undefined })
            }
            className="mt-2 w-full rounded-xl border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
          />
        </label>
      </div>
    </section>
  );
}
