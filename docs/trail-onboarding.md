# Add a trail

Use **one draft, one checker, and a reviewed pull request**. The tools collect
the repeated data in one place and prepare matching entries; they never change
the live catalog or publish a trail automatically. All thirteen current-source trails,
including the original five, now use this same structure.

Approved metadata lives in one JSON file per trail under
[`data/trails/`](../src/features/trailpack/data/trails/). Refreshable official
facts live only in the managed NPS snapshot. A shared compiler combines them
into the profile, park membership, photograph, source checks, and fallback.
This keeps future source refreshes separate from manually reviewed geometry
and photo choices; there are no parallel registration lists to synchronize.

This intake currently supports **Grand Teton day hikes and NPS-sourced photos**.
Other parks require a separate review of park-specific safety guidance,
provider mapping, and fallback behavior. A different park ID is deliberately
rejected instead of inheriting Grand Teton's rules.

## Start here

Run these commands from the local TrailPack repository.

1. Create a blank draft with a unique trail ID:

   ```sh
   npm run trail:new -- example-lake-loop
   ```

   Open `.artifacts/trail-onboarding/example-lake-loop/trail.json`.
   Empty strings and `null` are intentional: fill in reviewed facts, not guesses.
   The ID is not a source fact; choose a stable lowercase, hyphenated identifier.

2. Fill it in using the [blank template](../templates/trails/trail.template.json)
   and [worked Colter Bay example](../templates/trails/colter-bay.example.json).
   The example records a historical, reviewed snapshot, not today's live data.

3. Check the draft:

   ```sh
   npm run trail:check -- .artifacts/trail-onboarding/example-lake-loop/trail.json
   ```

   Fix the named fields and rerun the same command. For example,
   `official.distanceMiles` identifies the distance inside the `official` section.

No account, API key, network request, or new dependency is required. Drafts stay
in the ignored `.artifacts/` directory until deliberately included in a reviewed
change. Commands refuse to overwrite existing output. To save a draft somewhere
else, pass `--output-dir <new-directory>` to `trail:new`.

To try a complete example without creating anything:

```sh
npm run trail:check -- templates/trails/colter-bay.example.json --existing
```

`--existing` is inspection-only. It requires an existing catalog ID and cannot
be combined with preparation; it is not a way around duplicate protection.

Check every approved trail, including its managed facts and local photo:

```sh
npm run trail:check -- --catalog
```

The catalog check is read-only and also identifies orphaned NPS snapshots.
Tests additionally require every JSON definition to be registered exactly once.

## What to fill in

| Section | What belongs here |
|---|---|
| `trail` | Stable ID, name, park ID, coordinates, coordinate source, actual coordinate-review date, and whether the position is a trailhead or an area/geometry reference |
| `official` | Primary NPS trail-page URL, actual review date, miles, feet of gain, duration with units, difficulty, route type, and any official accessibility text |
| `comparison` | USGS source URL, review date, exact selected feature IDs, computed distance, and an explanation of how the route matches; computed gain only when available |
| `photo` | Local JPEG path, location, alt text, credit, NPS source URL, permission-review note, and intentional desktop/mobile focal points |
| `sourceCheck` | Display name and official aliases; leave `skipRouteTypeReason` as `null` unless a documented parser limitation requires manual route-type checking |

For `comparison.distanceMatch`, use `ok` for a reviewed close route match,
`strong_bridge` for a strong assembled-geometry match, or `moderate_bridge` for
a reviewed but less exact bridge. These are review judgments, not automatic
scores. Unreconciled routes should stay drafts.

Leave unavailable accessibility and computed gain as `null`, not `0` or
"accessible." Leave `comparison.gainMatch` as `unknown` when no comparison
exists. A gain conflict requires an explanation; if the conflict is between
official pages, record the other page in `official.additionalSources`.
Keep NPS values authoritative—never average official and computed statistics.

A documented public AllTrails recognition check is required for each new trail
admission, but it belongs in the admission notes rather than the runtime
definition. A reasonable counterpart must share the named destination,
corridor, and access area; a different turnaround or route variant is acceptable
only when the difference is recorded explicitly. Record the page URL, access
date, available page age, distance, gain, duration, and difficulty. If no
recognizable counterpart exists, keep the trail out of the catalog until the
owner explicitly reviews the exception. Do not substitute a loop for an
out-and-back route, replace NPS/USGS values with AllTrails values, or copy
AllTrails conditions into live alerts. See the
[seven-trail example](data/teton-expansion-2026-09-03.md#alltrails-cross-check).

Optional `comparison.elevationSourceUrl` and `comparison.elevationRangeFeet`
preserve separate elevation evidence when it actually exists. The original
Jenny, Taggart, and String Lake comparisons did not retain their selected USGS
feature IDs. Their migrated records explicitly say so and retain the historical
review dates; a narrow exception permits inspection of those three records.
New admissions must provide exact selected feature IDs. Do not reuse the
historical exception or imply the old geometry was reverified.

Before admission, independently check the weather point against the intended
NPS/USGS trail or access-area geometry in WGS84. Preserve the selected source
feature IDs and the coordinate's purpose in the admission evidence. A valid
latitude/longitude format alone does not prove the location is correct. Use the
[seven-trail coordinate review](data/weather-coordinate-review-2026-09-04.json)
as an example; do not reuse its distance threshold as a navigation guarantee.
For long or high-elevation routes, explicitly document the limits of a single
area forecast. Never confuse a lake-loop center with a trailhead.

Photo requirements match the existing site: a real JPEG in `public/park-images/`,
at least **2000 × 1200 pixels**, at most **12 MB**, with both focal points written
like `"48% 50%"`. Do not enlarge a blurry image just to pass the size check.
The permission note records the human review; the tool does not grant permission
or establish a photograph's license.

## What PASS means

PASS means the draft has the expected fields, supported units and formats,
allowed source hosts, dates no later than today, distinct IDs, consistent
comparison metadata, and a local JPEG header with sufficient dimensions.

It **does not** mean the source URLs were fetched, the facts are correct, the
USGS geometry was reconciled, the photo is sharp or properly licensed, the
selected trail is open, or the trail is approved for the catalog. A large
NPS/USGS distance difference and manual route-type exceptions are called out
as review notes.

Bounds such as 0.01–100 miles and 0–30,000 feet catch missing values, unit
mistakes, and implausible input. They are intake limits, not a judgment that a
route is an appropriate day hike. Unusual records need review, not rounded or
invented values to get through the checker.

## Prepare matching entries

Once the draft passes, optionally prepare a review package:

```sh
npm run trail:check -- .artifacts/trail-onboarding/example-lake-loop/trail.json --prepare .artifacts/trail-onboarding/example-lake-loop/prepared-1
```

The new directory contains four files:

- `trail.json` — the completed draft and review notes.
- `definition.json` — approved-format metadata, without duplicate official facts.
- `nps-snapshot.json` — the official values, keyed by the same trail ID.
- `README.md` — the exact registration instructions for that trail.

Preparation writes only to the new output directory. Nothing there is imported
by the application. The shared compiler derives the profile, source-check policy,
photo credit/crops, and unavailable-data fallback after reviewed registration.
It never invents weather, daylight, or current NPS alerts.
For a revised package, use `prepared-2` or another new directory; the first
package and the original draft remain untouched.

## Admit the trail through review

Follow the package's registration checklist after source review:

1. Preserve the reviewed draft or an equivalent admission record under
   `docs/data/`, including exact geometry IDs, lengths, repeated segments,
   coordinate provenance, photo permission, and any exceptions. See the
   [two-trail example](data/teton-expansion-2026-09-03.md). Admission evidence
   is not a second live data source to keep refreshing.
2. Add the `nps-snapshot.json` entry under `trails` in
   `src/features/trailpack/data/nps-source-snapshots.json`. Set `updatedAt` to
   at least the newest `checkedAt`, without changing other trail review dates.
3. Copy `definition.json` to `src/features/trailpack/data/trails/<trail-id>.json`.
   Import it in that folder's `index.ts` and add it once to `TRAIL_DEFINITIONS`.
   Park membership, search, source checks, photographs, and an unknown-data
   fallback now follow automatically. The local JPEG must already exist.
4. Extend the catalog, search, weather/fallback, packing, source-check, and photo
   tests. Keep catalog invariants data-driven and add source-specific acceptance
   evidence; do not merely increase a hard-coded trail count.
5. Check the guest flow at desktop and mobile widths, including source details,
   offline fallback, and sharp, well-centered photographs. No second account or
   live AI call is needed for a trail addition.
6. Update the supported-trail table in `README.md`, the changelog, and the
   admission evidence. Run:

   ```sh
   npm run lint
   npm run typecheck
   npm run trail:check -- --catalog
   npm test
   npm run check:nps-integrity
   npm run scenario:stress
   npm run stress:system
   npm run build
   npm run test:a11y
   ```

   Unlike the draft checker, `check:nps-integrity` reads the official pages.
   Run the browser suite against a fresh development server as well when local
   testing has reused a production server. CI starts development mode, which
   surfaces React warnings that production builds omit; never silence those
   warnings to make the check pass.
   Investigate failures rather than updating expectations blindly. Commit any
   legitimate regenerated scenario report with the reviewed change; CI checks
   that generated evidence is current.
7. Use the protected PR/Preview workflow. A completed draft or green test does
   not authorize automatic catalog admission, merge, or production deployment.

## Troubleshooting

| Message or symptom | Fix |
|---|---|
| `NEEDS WORK` followed by a field | Edit that field in the draft and rerun the same check. Other errors are shown together. |
| Unknown field | Correct the spelling against the template; unknown fields are not silently discarded. |
| Invalid JSON | Use double quotes, no comments, and no trailing commas. The parser includes the error location when available. |
| ID/name already registered | Check whether this is the same route. Do not add another ID just to bypass a duplicate-name error. Use `--existing` only for inspection. |
| Another park is rejected | Park-specific safety and data support must be reviewed separately first. |
| Source URL rejected | Use the official HTTPS agency page, not a search link, comparison website, lookalike hostname, or authenticated URL. |
| Date rejected | Use the date that source was actually reviewed, in `YYYY-MM-DD` format. Do not replace it with today's date without checking. |
| `photo.src` file not found | `/park-images/name.jpg` means `public/park-images/name.jpg` inside this repository. |
| Photo too small or not JPEG | Obtain a sharp original and export a real JPEG. Renaming a PNG or upscaling blur is not a fix. |
| Output already exists | Use a new directory. The tool deliberately never overwrites drafts or prepared entries. |
| Missing snapshot or mismatched URL | Add the same ID and primary NPS URL in the managed snapshot before importing the definition. |
| Unexpected `official` field in a definition | Keep refreshable facts only in the managed snapshot, not in both files. |
| Trail absent from search/park results | Register its JSON definition once in `data/trails/index.ts`; run the catalog check and tests. |
| Trail lacks a photo | Check `photo.src` in its definition and the matching local JPEG; there is no separate photo registry to update. |
| Weather unavailable with no saved example | This is intentional for a new trail when live retrieval fails. Standard packing rules remain usable; do not fabricate a fixture. |
| NPS check reports configuration error | Check `sourceCheck.aliases` in the definition against the actual page. |
| Orphaned snapshot | Check the missing definition/registration or investigate an unintended snapshot; do not silently delete evidence. |

Use `--json` with `trail:check` for machine-readable errors. Exit code `0` means
the offline check passed, `1` means draft/photo corrections are needed, and `2`
means a command, file, or output-directory problem. Use `--help` for syntax.

## Scope

The checker prepares data; catalog admission still requires review. The current
source uses the original five profiles plus Lunch Tree Hill and Christian
Pond Loop released in PR #50. Their [admission record](data/teton-expansion-2026-09-03.md)
separates preserved historical evidence from new source reviews.
Lake Creek–Woodland and Phelps Lake Loop used the same workflow for their
approved expansion. Their [admission record](data/preserve-admission-2026-09-04.md)
demonstrates shared-photo reuse and an independently justified clipped access
leg. Heron Pond–Swan Lake and Hermitage Point add a park-wide USGS capture,
an official NPS connector, and a shared trailhead-area weather point in the
[Colter Bay admission record](data/colter-bay-admission-2026-09-04.md).
The [Leigh–Trapper admission record](data/leigh-trapper-admission-2026-09-05.md)
demonstrates a shared approach retraced on return, explicit excluded branches,
and a weather marker that is on the approach rather than its southern endpoint. Follow
the [coverage checklist](data/grand-teton-coverage.md) for subsequent
Grand Teton admissions; a complete template alone is not a route-safety review.
There is no national trail search, new park, admin interface, or change to
packing-rule thresholds, authentication, AI limits, or provider time budgets.
