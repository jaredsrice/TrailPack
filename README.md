# TrailPack

TrailPack turns trail information and trip conditions into a clear hiking
packing list. It explains why each item is recommended and where the supporting
data came from.

Production deployment: [https://trailpack-ten.vercel.app](https://trailpack-ten.vercel.app)

Version `0.1.0` is the completed CSE 499A technical prototype. The packing list
uses fixed rules, so the same input always produces the same packing decisions.
A guarded review can summarize the rule-based result, but it cannot add, remove,
reprioritize, or relabel packing items. Supported trails now request live
Open-Meteo weather automatically while retaining an explicitly labeled saved
fallback. The CSE 499B AI provider remains optional and independently validated.

## How It Works

1. Search for a supported park or trail.
2. Review the official trail statistics and any computed estimates.
3. Review a four-period day forecast, daylight, and NPS alert status.
4. Choose a hike date or add details such as start time, expected duration, or
   trail conditions.
5. Receive an essential and optional packing list whose cards answer concrete
   hiker questions with quantities, examples, and source labels.

Unsupported hikes can use the manual-entry fallback to get a limited baseline
list. Manual distance, elevation gain, route type, expected duration, and trail
conditions can make that fallback more specific.

The current demo supports three curated profiles plus two verified public-source
imports in Grand Teton National Park.

## Supported Demo Trails

- `Jenny Lake Loop` - longer moderate loop with a known NPS versus USGS
  elevation-gain conflict that stays visibly labeled in the UI.
- `Taggart Lake` - short easy out-and-back trail with official NPS values, a
  close USGS geometry match, and saved 2026 NPS trail-work alert context.
- `String Lake Loop` - easy loop with a moderate USGS bridge estimate and a hot,
  exposed saved demo weather scenario for Week 10 evaluation.
- `Colter Bay Lakeshore Trail` - verified public-source import using official
  NPS values and 15 reconciled NPS-origin USGS trail segments.
- `Two Ocean Lake Loop` - verified public-source import using official NPS values
  and three reconciled NPS-origin USGS trail segments whose total is within about
  one percent of the official loop distance.

The first three remain the curated CSE 499A catalog. The last two are the bounded
CSE 499B Tetons-first import slice. Search and the Grand Teton park view label
the distinction, and each imported profile retains retrieval status, source
URLs, confidence notes, source feature IDs, and missing-field status.

## Data Sources

- **NPS** is the primary source for official trail distance, elevation gain,
  difficulty, and estimated time.
- **USGS** provides public federal data for trail geometry and computed elevation
  estimates when official values are missing or need comparison.
- **OpenStreetMap Nominatim** was evaluated through an experimental CSE 499B
  adapter and rejected as a supported TrailPack source after a 24-trail
  reliability study. Its runtime adapter and route were removed; the validation
  notes remain as negative feasibility evidence.
- **AllTrails** is checked manually as a comparison-only plausibility signal for
  reviewed imports. Its values do not enter the TrailPack recommendation model
  and never override NPS or reconciled USGS evidence.
- **User input** can add conservative recommendations for long trips, snow, ice,
  mud, wet conditions, and planned times that are far outside the official trail
  profile.
- **Bear Aware** is linked as a current regional bear-spray rental-location
  reference when the official NPS bear-spray recommendation is shown.

Official NPS values stay visible even when a USGS calculation differs. TrailPack
labels the difference instead of averaging the numbers or hiding the conflict.
The same rule applies when AllTrails differs: the comparison can trigger review,
but it is not promoted into an official or computed TrailPack value.

The NPS API can provide alerts and park information, but it does not provide all
the trail statistics TrailPack needs. The current import workflow reviews values
from public NPS trail pages, retains the source URL, and reconciles USGS geometry
before saving a profile. Future automation would follow site access rules and
refresh cached results on a slow schedule instead of requesting agency pages for
every user.

This approach keeps the data traceable:

- Official values link back to their NPS source.
- Computed values identify USGS as the source and remain separate from official values.
- User-reported conditions are labeled as user input.
- General recommendations are labeled as inferred rather than official.

Trailforks is not used as a production data source. It would only be considered
as a backup if suitable API access or written permission becomes available.

## Run Locally

From the repository root:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000), search for `Jenny Lake`,
`Taggart`, `String Lake`, `Colter Bay`, or `Two Ocean`, and select one of the
supported trails.

Live NPS alerts and the B-02 Gemini boundary are optional during local
development. Add only the server-side credentials you intend to test to
`.env.local`:

```bash
NPS_API_KEY=your-key-here
GEMINI_API_KEY=your-key-here
# Optional; defaults to gemini-3.5-flash
GEMINI_MODEL=gemini-3.5-flash
```

Do not commit `.env.local` or any provider keys.

The B-01 NPS/USGS import uses saved, reviewed source records and adds no runtime
provider secret or configuration. `NPS_API_KEY` enables live NPS alerts, while
`GEMINI_API_KEY` enables the server-only B-02 review boundary. `GEMINI_MODEL` is
an optional non-secret override.

## External Context Routes

TrailPack now includes server-side context routes for the live-data path while
keeping saved demo fixtures available for deterministic demos:

- `GET /api/trailpack/weather?trailId=jenny-lake-loop` loads the current
  Open-Meteo day forecast for a supported trail when coordinates are available.
  Add `&date=YYYY-MM-DD` to request a selected date. The normalized response
  includes daily high/low context plus local 6 AM, 10 AM, 2 PM, and 6 PM
  temperature, apparent temperature, precipitation probability, condition, and
  wind periods when the provider supplies them. A successful request also loads
  Sunrise-Sunset.org civil twilight. Provider failure or an unsupported forecast
  date returns a clearly labeled saved example instead of an unhandled error.
- `GET /api/trailpack/alerts?trailId=jenny-lake-loop` or
  `GET /api/trailpack/alerts?parkCode=grte` loads NPS alerts with the
  server-side `NPS_API_KEY`. If the key is missing or the provider request
  fails, the route returns a labeled unavailable or saved-fixture alert state.
- `POST /api/trailpack/ai-review` accepts the existing structured AI contract,
  calls Gemini only when `GEMINI_API_KEY` is available, and returns an explicit
  accepted, rejected, timed-out, quota-limited, missing-key, invalid-response,
  or provider-error outcome. Every non-accepted outcome includes the unchanged
  template fallback derived from the rule-based packing list.

The main UI automatically requests weather for the selected supported trail and
uses the user-selected hike date when one is present. Saved four-period examples
remain visible while the request is loading and when the provider is unavailable,
with the retrieval state and fallback reason shown in the weather card. The
resolved live-or-saved weather feeds the deterministic packing rules and guarded
AI contract. NPS alert cards remain fixture-backed in the main flow, including
the Taggart Lake 2026 trail-work alert, while the live NPS route stays available
for independent testing.

## Recommendation Style

Packing items are rendered as grouped accordion rows, with `Critical Safety`
first when bear spray, navigation, active alerts, or trip-decision dangers are
present. The rule engine still tracks the question each row answers, but the UI
shows clean topics such as `Trip safety decision`, `Navigation / offline map`,
`Trail footwear`, `Water`, `Food`, `Headlamp`, and `Bear spray`. The first line
is the clear action; the supporting `Why`, source labels, and context notes stay
inside the dropdown so users can skim quickly or read more when needed.

Overall alerts appear above the packing list for plan-level issues such as heat,
wet weather, active NPS alerts, or an unusual planned duration. Affected rows
then show stronger row styling plus an `Alert changes this` marker alongside
context tags such as `Heat`, `Wet`, `Duration`, or `Official alert`, so users can
see which recommendations changed because of the alert. Critical danger is
separated from safety-critical gear: closures, flash flooding, lightning, high
water, wildfire or heavy smoke, avalanche language, and dangerous heat can create
a `Trip safety decision` with a `Change plan` marker, while bear spray and
navigation use the `Safety-critical` marker.

The list includes NPS Ten Essentials influence without turning the entire top
section into a catch-all bucket. Navigation is essential and source-backed by NPS
Ten Essentials; longer trips also add `Power bank / extra battery` when a phone,
GPS, or rechargeable headlamp may be part of navigation or lighting. Food, water,
sun protection, layers, rain shell, headlamp, and first aid remain in their
normal scan groups unless trip context promotes them.

Long-day water now uses realistic frontcountry carry ranges and explicitly says
to drink according to thirst. Water filter or treatment guidance is an optional
backup unless the user plans to refill from an unverified source. Extra dry socks
are a separate optional row with blister and warmth rationale, while snow or ice
still adds traction guidance that explains what microspikes are and why regular
tread may not be enough. Salt support is split into `Electrolytes` and
`Salty snacks` so hot/exposed sustained effort can promote electrolytes while
long non-hot days can promote salty food, with the alternate still shown as
optional.

## Guarded AI Review

TrailPack includes a fixture-first guarded AI path that keeps the deterministic
demo stable while allowing an explicit live review. For the Jenny Lake Loop
demo, the app builds structured AI input from the selected trail profile, saved
weather and alert context, user trip details, missing-data status, and the
rule-based packing output. A saved AI-style response is validated for the
initial display; the user may then run the optional live route.

Validation rejects AI text that:

- adds or omits rule-based packing items
- changes source labels
- adds, removes, reorders, or rewrites rule-engine missing details
- references another supported trail as if it were the selected hike
- makes unsupported safety claims

If validation fails or a saved fixture is unavailable, TrailPack displays
template fallback text generated from the rule-based recommendation.

The CSE 499B B-02 provider boundary adds an optional server-side Gemini
Interactions API call using structured JSON output with `store: false`. Before
any provider call, TrailPack minimizes the payload to trail, weather, alert,
bounded trip-condition, and rule-based packing context. The unrestricted
`notes` field is never sent. Provider output must pass runtime schema parsing
and the same packing-set, source-label, missing-detail, cross-trail, and safety
validation used by the saved fixture. Provider work is bounded to 25 seconds;
timeouts preserve the unchanged rule-based fallback.

The default model is the generally available `gemini-3.5-flash`, selected
for structured-output support and its low-cost/free-tier path. Google states
that free-tier content may be used to improve its products, while paid-tier
content is not. TrailPack therefore keeps the provider payload non-personal and
minimal; a paid tier should be used if the project's data policy later requires
the stronger provider-side handling commitment. See the official
[Interactions API](https://ai.google.dev/gemini-api/docs/interactions-overview),
[API-key](https://ai.google.dev/gemini-api/docs/api-key),
and [pricing](https://ai.google.dev/gemini-api/docs/pricing) documentation.

The Week 7 UI calls the live route only after the user selects **Run guarded live
review**. It distinguishes a validated live response from rejected, timed-out,
quota-limited, missing-key, invalid-response, provider-error, and client-request
fallback states. Every state explains that the rule-based packing list remains
unchanged, and provider output is never displayed before validation. A
deployment without `GEMINI_API_KEY` makes no Gemini request and shows the
labeled deterministic fallback.

## Verify the Project

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run scenario:stress
```

The test suite covers trail values, packing rules, duration parsing, trail-condition
phrasing, question-answer recommendation copy, guarded AI validation, and
official-source validation. The scenario stress command regenerates the Week
13/14 hiker-lens report from the current rule engine.

## Current Limits

- The current verified catalog is limited to five Grand Teton trails: three
  curated profiles and two reviewed NPS/USGS public-source imports. It is not a
  nationwide lookup service.
- Unsupported hikes can only use a limited manual fallback list. Direct distance,
  elevation gain, and route-type inputs improve that fallback, but source-backed
  trail profiles remain more complete.
- Nominatim was rejected after finding the intended identity anywhere for only
  14/24 study trails and first for only 12/24; its adapter and server route were
  removed. Trails enter the current import catalog only after individual NPS and
  USGS reconciliation.
- Supported-trail pages request live Open-Meteo weather automatically, but the
  result is a coordinate-based forecast rather than an exact high-elevation
  trail-condition observation. Open-Meteo supports forecasts up to 16 days; a
  selected date outside the provider range uses a clearly labeled saved example.
  Main-flow NPS alerts remain saved fixtures even though the live NPS route is
  available independently.
- The guarded AI panel starts with the saved Jenny Lake fixture and can call the
  server-only Gemini route on demand. `GEMINI_API_KEY` is configured as an
  encrypted Preview-only variable and has produced repeatable accepted
  responses. Production intentionally has no Gemini key and returns the labeled
  missing-key fallback.
- Automatic NPS page collection and USGS processing are not part of this slice;
  imports are reviewed and saved before release.
- Planned date requests that day's weather when available and can affect both
  weather-driven packing rules and seasonal insect-repellent guidance. Expected
  duration can change water, food, headlamp, extra-food, and unusual-timing
  guidance. Start time can change headlamp guidance when matching daylight
  context is available. Notes are stored as context but do not yet change the
  list.
- `npm audit` reports a moderate PostCSS issue bundled inside Next.js. The known
  attack requires processing untrusted CSS, which TrailPack does not do. A forced
  audit fix would install an incompatible Next.js version, so the project is
  waiting for a safe upstream update.

## Next Project Focus

- CSE 499A is closed with all six Week 12 must-have requirements complete. The
  final evidence is in
  [`docs/superpowers/validation/2026-07-16-cse-499a-closeout.md`](docs/superpowers/validation/2026-07-16-cse-499a-closeout.md).
- CSE 499B Week 1 is complete. The current baseline, issue backlog, environment
  inventory, public production URL, and deployment evidence are recorded in
  [`docs/superpowers/validation/2026-07-17-cse-499b-week-1-baseline.md`](docs/superpowers/validation/2026-07-17-cse-499b-week-1-baseline.md).
- B-01 is merged and production-verified through the bounded Tetons-first
  NPS/USGS import plus manual fallback. Its implementation evidence is in
  [`docs/superpowers/validation/2026-07-20-cse-499b-grand-teton-public-source-import.md`](docs/superpowers/validation/2026-07-20-cse-499b-grand-teton-public-source-import.md).
- The only active implementation track is
  [B-02 guarded live AI](https://github.com/jaredsrice/TrailPack/issues/26).
  Its provider boundary, guarded-refinement UI, deterministic failure matrix,
  and repeatable Preview acceptance path are complete on the feature branch.
  Next is PR review and merge.
- B-03 Google login and private saved results becomes the next active track
  after B-02 merges. Guest access stays required.
- Cybersecurity testing and remediation are planned after those 499B features
  reach a stable release candidate; they were not run during the 499A closeout.
- The public Vercel production deployment is available at
  [https://trailpack-ten.vercel.app](https://trailpack-ten.vercel.app). GitHub's
  `main` branch is connected to the Vercel `trailpack` project, and the Week 1
  deployment gate is closed.

## Technology

Next.js, React, TypeScript, Tailwind CSS, and Vitest.

## Source Layout

- [`src/app/`](src/app/) - Next.js route entrypoints and global styles
- [`src/features/trailpack/components/`](src/features/trailpack/components/) - TrailPack UI modules
- [`src/features/trailpack/data/`](src/features/trailpack/data/) - curated trails, verified public-source imports, and demo-context fixtures
- [`src/features/trailpack/lib/`](src/features/trailpack/lib/) - search, packing, and flow logic
- [`src/features/trailpack/types.ts`](src/features/trailpack/types.ts) - shared TrailPack domain types

## Project Documents

- [`AGENTS.md`](AGENTS.md) - repo-specific agent workflow entrypoints and pointers
- [`CONTEXT.md`](CONTEXT.md) - canonical TrailPack domain glossary and repo memory
- [`docs/agents/`](docs/agents/) - issue tracker, triage label, and domain-doc guidance for agent work
- [`docs/data/`](docs/data/) - data feasibility and source decisions
- [`docs/superpowers/`](docs/superpowers/) - saved planning and design artifacts for implementation work
- [`docs/superpowers/validation/`](docs/superpowers/validation/) - saved milestone validation notes and proposal-alignment checks
- [`docs/superpowers/specs/2026-07-16-cse-499b-requirements.md`](docs/superpowers/specs/2026-07-16-cse-499b-requirements.md) - instructor-aligned continuation requirements
- [`docs/superpowers/plans/2026-07-16-cse-499b-schedule.md`](docs/superpowers/plans/2026-07-16-cse-499b-schedule.md) - fourteen-week CSE 499B schedule and gates
- [`docs/ui/`](docs/ui/) - workflow, wireframes, and UI planning
- [`CHANGELOG.md`](CHANGELOG.md) - version history and known issues
