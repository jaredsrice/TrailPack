# TrailPack

TrailPack turns trail information and trip conditions into a clear hiking
packing list. It explains why each item is recommended and where the supporting
data came from.

Version `0.1.0` is a CSE 499 technical prototype. The packing list uses fixed
rules, so the same input always produces the same packing decisions. A guarded
saved AI-style review fixture can summarize the rule-based result, but it cannot
add, remove, or relabel packing items.

## How It Works

1. Search for a supported park or trail.
2. Review the official trail statistics and any computed estimates.
3. Review saved or live-path weather, daylight, and NPS alert status.
4. Add useful details such as start time, expected duration, or trail conditions.
5. Receive an essential and optional packing list whose cards answer concrete
   hiker questions with quantities, examples, and source labels.

Unsupported hikes can use the manual-entry fallback to get a limited baseline
list. Manual distance, elevation gain, route type, expected duration, and trail
conditions can make that fallback more specific.

The current demo supports Jenny Lake Loop, Taggart Lake, and String Lake Loop
in Grand Teton National Park.

## Supported Demo Trails

- `Jenny Lake Loop` - longer moderate loop with a known NPS versus USGS
  elevation-gain conflict that stays visibly labeled in the UI.
- `Taggart Lake` - short easy out-and-back trail with official NPS values and a
  close USGS geometry match.
- `String Lake Loop` - easy loop with a moderate USGS bridge estimate and a hot,
  exposed saved demo weather scenario for Week 10 evaluation.

## Data Sources

- **NPS** is the primary source for official trail distance, elevation gain,
  difficulty, and estimated time.
- **USGS** provides public federal data for trail geometry and computed elevation
  estimates when official values are missing or need comparison.
- **User input** can add conservative recommendations for long trips, snow, ice,
  mud, or wet conditions.
- **Bear Aware** is linked as a current regional bear-spray rental-location
  reference when the official NPS bear-spray recommendation is shown.

Official NPS values stay visible even when a USGS calculation differs. TrailPack
labels the difference instead of averaging the numbers or hiding the conflict.

The NPS API can provide alerts and park information, but it does not provide all
the trail statistics TrailPack needs. A production version would collect those
values from public NPS trail pages, keep the source URL and attribution, follow
site access rules, and refresh cached results on a slow schedule instead of
requesting the page for every user. USGS data would fill gaps or provide a
clearly labeled computed estimate.

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
`Taggart`, or `String Lake`, and select one of the supported trails.

Live NPS alerts are optional during local development. To enable the server-side
NPS alert route, add an API key to `.env.local`:

```bash
NPS_API_KEY=your-key-here
```

Do not commit `.env.local` or any provider keys.

## External Context Routes

TrailPack now includes server-side context routes for the live-data path while
keeping saved demo fixtures available for deterministic demos:

- `GET /api/trailpack/weather?trailId=jenny-lake-loop` loads Open-Meteo weather
  for a supported trail when coordinates are available. When live weather
  succeeds, the same path also requests Sunrise-Sunset.org daylight context for
  civil twilight, then falls back to the saved demo weather context if weather
  fails.
- `GET /api/trailpack/alerts?trailId=jenny-lake-loop` or
  `GET /api/trailpack/alerts?parkCode=grte` loads NPS alerts with the
  server-side `NPS_API_KEY`. If the key is missing or the provider request
  fails, the route returns a labeled unavailable or saved-fixture alert state.

The main UI still uses saved demo scenarios by default so the CSE 499A demo
remains stable when live services are unavailable. Supported trail pages show
the current weather, civil-twilight, and NPS alert state before the packing list,
including the saved no-active-alert fixture state.

## Recommendation Style

Packing items are rendered as recommendation-topic cards. The rule engine still
tracks the question each card answers, but the UI shows clean topics such as
`Trail footwear`, `Water`, `Food`, `Headlamp`, and `Bear spray`, followed by a
specific "you need this because..." explanation. The rule engine keeps concrete
quantities, food counts per person, first-aid examples, shoe tradeoffs, socks or
gaiter guidance for wet or snowy conditions, and bear-spray rental links visible
before any AI text is displayed.

## Guarded AI Review Fixture

TrailPack includes a fixture-first guarded AI path for the Week 13 / Week 14
requirements. For the Jenny Lake Loop demo, the app builds structured AI input
from the selected trail profile, saved weather and alert context, user trip
details, missing-data status, and the rule-based packing output. A saved
AI-style response is then validated before display.

Validation rejects AI text that:

- adds or omits rule-based packing items
- changes source labels
- references another supported trail as if it were the selected hike
- makes unsupported safety claims

If validation fails or a saved fixture is unavailable, TrailPack displays
template fallback text generated from the rule-based recommendation. Live Gemini
or OpenAI calls are not part of this slice.

## Verify the Project

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

The test suite covers trail values, packing rules, duration parsing, trail-condition
phrasing, question-answer recommendation copy, guarded AI validation, and
official-source validation.

## Current Limits

- Jenny Lake Loop, Taggart Lake, and String Lake Loop are the complete supported
  trail profiles in the current prototype.
- Unsupported hikes can only use a limited manual fallback list. Direct distance,
  elevation gain, and route-type inputs improve that fallback, but source-backed
  trail profiles remain more complete.
- The main UI still uses demo weather and alert contexts by default, although
  server-side Open-Meteo, Sunrise-Sunset.org daylight, and NPS alert calls now
  exist for the live-data path.
- The guarded AI review uses a saved Jenny Lake fixture and template fallback;
  it does not call a live AI provider yet.
- Automatic NPS page collection and USGS processing are planned but are not yet
  part of this prototype.
- Planned date and notes are stored as context but do not yet change the list.
  Start time can change headlamp guidance when daylight context is available.
- `npm audit` reports a moderate PostCSS issue bundled inside Next.js. The known
  attack requires processing untrusted CSS, which TrailPack does not do. A forced
  audit fix would install an incompatible Next.js version, so the project is
  waiting for a safe upstream update.

## Next Project Focus

- Keep tightening the Week 13/14 feedback loop around recommendation specificity,
  incomplete-data fallback behavior, and saved demo scenarios.
- Keep broader trail-data expansion, live AI calls, and account/profile work
  deferred until the Week 14 CSE 499B planning pass prioritizes the next backlog
  items.

## Technology

Next.js, React, TypeScript, Tailwind CSS, and Vitest.

## Source Layout

- [`src/app/`](src/app/) - Next.js route entrypoints and global styles
- [`src/features/trailpack/components/`](src/features/trailpack/components/) - TrailPack UI modules
- [`src/features/trailpack/data/`](src/features/trailpack/data/) - supported trail and demo-context fixtures
- [`src/features/trailpack/lib/`](src/features/trailpack/lib/) - search, packing, and flow logic
- [`src/features/trailpack/types.ts`](src/features/trailpack/types.ts) - shared TrailPack domain types

## Project Documents

- [`AGENTS.md`](AGENTS.md) - repo-specific agent workflow entrypoints and pointers
- [`CONTEXT.md`](CONTEXT.md) - canonical TrailPack domain glossary and repo memory
- [`docs/agents/`](docs/agents/) - issue tracker, triage label, and domain-doc guidance for agent work
- [`docs/data/`](docs/data/) - data feasibility and source decisions
- [`docs/superpowers/`](docs/superpowers/) - saved planning and design artifacts for implementation work
- [`docs/superpowers/validation/`](docs/superpowers/validation/) - saved milestone validation notes and proposal-alignment checks
- [`docs/ui/`](docs/ui/) - workflow, wireframes, and UI planning
- [`CHANGELOG.md`](CHANGELOG.md) - version history and known issues
