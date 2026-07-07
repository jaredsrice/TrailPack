import type { UserHikeInput } from "@/features/trailpack/lib/packing";

interface MissingDetailPromptsProps {
  value: UserHikeInput;
  onChange: (value: UserHikeInput) => void;
  showManualFields?: boolean;
}

export function MissingDetailPrompts({
  value,
  onChange,
  showManualFields = false,
}: MissingDetailPromptsProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold text-slate-900">Trip details</h2>
      <p className="mt-1 text-sm text-slate-600">
        Expected time out and current conditions can change your packing list.
        {showManualFields
          ? " Manual trail facts improve the unsupported-hike fallback."
          : " Date and notes stay as trip context for now."}
      </p>

      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {showManualFields ? (
          <>
            <label className="block text-sm">
              <span className="font-medium text-slate-700">Trail distance</span>
              <span className="ml-1 text-xs text-emerald-700">(affects list)</span>
              <input
                type="text"
                inputMode="decimal"
                placeholder="e.g. 6.2 miles"
                value={value.distanceMiles ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    distanceMiles: event.target.value || undefined,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
              />
            </label>

            <label className="block text-sm">
              <span className="font-medium text-slate-700">Elevation gain</span>
              <span className="ml-1 text-xs text-emerald-700">(affects list)</span>
              <input
                type="text"
                inputMode="numeric"
                placeholder="e.g. 900 ft"
                value={value.elevationGainFeet ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    elevationGainFeet: event.target.value || undefined,
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
              />
            </label>

            <label className="block text-sm md:col-span-2">
              <span className="font-medium text-slate-700">Route type</span>
              <span className="ml-1 text-xs text-emerald-700">(affects list)</span>
              <select
                value={value.routeType ?? ""}
                onChange={(event) =>
                  onChange({
                    ...value,
                    routeType: (event.target.value || undefined) as UserHikeInput["routeType"],
                  })
                }
                className="mt-2 w-full rounded-lg border border-slate-200 bg-white px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
              >
                <option value="">Select a route type</option>
                <option value="loop">Loop</option>
                <option value="out-and-back">Out and back</option>
                <option value="point-to-point">Point to point</option>
              </select>
            </label>
          </>
        ) : null}

        <label className="block text-sm">
          <span className="font-medium text-slate-700">When do you plan to hike?</span>
          <span className="ml-1 text-xs text-slate-400">(context only)</span>
          <input
            type="date"
            value={value.plannedDate ?? ""}
            onChange={(event) =>
              onChange({ ...value, plannedDate: event.target.value || undefined })
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-slate-700">What time will you start?</span>
          <span className="ml-1 text-xs text-emerald-700">(affects headlamp)</span>
          <input
            type="text"
            placeholder="e.g. 10 AM or 14:30"
            value={value.startTime ?? ""}
            onChange={(event) =>
              onChange({ ...value, startTime: event.target.value || undefined })
            }
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
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
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
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
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
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
            className="mt-2 w-full rounded-lg border border-slate-200 px-4 py-3 outline-none ring-emerald-500 focus:ring-2"
          />
        </label>
      </div>
    </section>
  );
}
