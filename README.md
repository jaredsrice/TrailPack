# TrailPack

TrailPack turns trail facts, forecast context, official alerts, and trip details
into a traceable day-hiking packing list. Its deterministic rule engine decides
what belongs on the list; optional AI may improve the explanation but cannot
silently change the packing decisions or their sources.

[Open TrailPack](https://trailpack-ten.vercel.app) ·
[View the changelog](CHANGELOG.md) ·
[Read the 499B requirements](docs/superpowers/specs/2026-07-16-cse-499b-requirements.md)

## Project Status

| Item | Current state |
|---|---|
| Release | `0.4.0` — B-02 production release |
| Production | [trailpack-ten.vercel.app](https://trailpack-ten.vercel.app) |
| Production commit | [`33fa471`](https://github.com/jaredsrice/TrailPack/commit/33fa471350608b4468714083a74f26334037cca6) |
| Completed 499B work | B-01 public trail imports; B-02 guarded AI and source integrity |
| Active track | [B-03 Google login and private saved results](https://github.com/jaredsrice/TrailPack/issues/27) |
| Supported catalog | Five manually verified Grand Teton day hikes |
| Guest workflow | Fully available without an account |

The original proposal treated accounts as optional after the first stable
version. The active CSE 499B requirements deliberately promote Google login and
private saved results to B-03. The guest search, planning, and packing workflow
must remain available when B-03 is implemented.

## What TrailPack Does

1. Search for a supported park or trail.
2. Review verified trail facts, source labels, and available NPS accessibility
   or terrain guidance.
3. Load a date-aware Open-Meteo forecast with daylight and planned-start
   markers.
4. Add trip details such as date, start time, expected duration, route type, or
   reported conditions.
5. Generate essential and optional packing recommendations with visible
   rationale and provenance.
6. Optionally request a guarded Gemini review of the explanation. The
   rule-based packing list remains authoritative.

Unsupported hikes can use manual distance, elevation gain, route type, duration,
and condition inputs to produce a limited fallback list.

## Supported Trail Catalog

| Trail | Profile evidence | NPS accessibility details |
|---|---|---|
| Jenny Lake Loop | Official NPS facts with reconciled USGS comparison data | Available |
| Taggart Lake | Official NPS facts with a close USGS geometry match | Available |
| String Lake Loop | Official NPS facts with a labeled USGS bridge estimate | Available |
| Colter Bay Lakeshore Trail | Official NPS facts with 15 reconciled USGS trail segments | Not found on the tracked NPS page |
| Two Ocean Lake Loop | Official NPS facts with three reconciled USGS trail segments | Not found on the tracked NPS page |

All five appear in the application as a `Verified NPS + USGS profile`. Internal
`curated` and `public-source-import` values remain only for milestone
traceability; they do not represent different quality tiers.

Accessibility text is displayed only when the official trail page publishes a
matching trail-specific block. TrailPack presents it as sourced terrain
information, not as an accessibility certification.

## Data and Trust Model

| Source | Role in TrailPack |
|---|---|
| National Park Service trail pages | Authoritative trail facts and available accessibility context |
| USGS National Digital Trails and 3DEP | Public geometry and computed comparison evidence |
| Open-Meteo | Coordinate-based live weather forecast |
| Sunrise-Sunset.org | Sunrise, sunset, and civil-twilight boundaries |
| NPS API | Live park-alert route when `NPS_API_KEY` is configured |
| User input | Trip-specific context and conservative fallback inputs |
| Gemini | Optional explanation review after deterministic validation |

TrailPack keeps official, computed, forecast-based, user-provided, inferred,
missing, unavailable, and saved-fixture evidence distinguishable.

- NPS values remain visible when a USGS calculation differs.
- AllTrails is comparison-only and never populates or overrides TrailPack data.
- Nominatim was rejected after a 24-trail reliability study and is not used at
  runtime.
- Trailforks is not used without suitable API access or written permission.
- AI cannot add, remove, reprioritize, or relabel packing items.

The complete NPS, USGS, Nominatim, and AllTrails decision record is preserved
under [`docs/superpowers/validation/`](docs/superpowers/validation/).

## Visual Context

The homepage rotates through seven locally served, officially sourced NPS
photographs. Selecting Grand Teton or a supported trail locks the visual to the
most specific verified scene available. Manual entry retains general park
imagery instead of claiming an unsupported location match.

Every photograph includes a visible credit and source link. The image ledger is
[`docs/ui/2026-07-25-national-park-image-sources.md`](docs/ui/2026-07-25-national-park-image-sources.md).

## Local Development

Vercel currently builds TrailPack with Node.js `24.x`. From the repository root:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) and search for `Jenny Lake`,
`Taggart`, `String Lake`, `Colter Bay`, or `Two Ocean`.

### Optional Environment Variables

Store local values in `.env.local`; never commit that file or print its values.

| Name | Required | Purpose | Current Vercel scope |
|---|---|---|---|
| `NPS_API_KEY` | No | Enables live NPS alert responses | Preview and Production |
| `GEMINI_API_KEY` | No | Enables the guarded live AI review | Preview only |
| `GEMINI_MODEL` | No | Overrides the default `gemini-3.5-flash` model | Not configured |

The core guest planner, saved fixtures, manual fallback, and deterministic
packing engine work without either provider key.

## Server Routes

| Route | Behavior |
|---|---|
| `GET /api/trailpack/weather?trailId=...` | Returns normalized live weather or a labeled saved fallback |
| `GET /api/trailpack/weather?trailId=...&date=YYYY-MM-DD` | Requests the selected forecast date when supported |
| `GET /api/trailpack/alerts?trailId=...` | Returns normalized NPS alerts for a supported trail |
| `GET /api/trailpack/alerts?parkCode=grte` | Returns normalized Grand Teton alerts |
| `POST /api/trailpack/ai-review` | Returns an accepted guarded review or an explicit deterministic fallback state |

Invalid trail identifiers and malformed inputs return controlled validation
errors without exposing provider details.

## Guarded AI Boundary

The browser sends only bounded trail, weather, alert, trip-condition, and
rule-based packing context to the server route. Unrestricted notes, email
addresses, OAuth data, and provider credentials are excluded.

The server requests structured Gemini output with `store: false`, validates the
response shape, and then rejects any result that:

- changes the packing-item set or order;
- changes source labels;
- rewrites rule-engine missing details;
- substitutes facts from another trail; or
- makes unsupported safety guarantees.

Timeout, quota, missing-key, malformed-response, provider-error, and rejected
outcomes all preserve the unchanged deterministic fallback. Production
currently has no Gemini key, so the public site intentionally demonstrates the
labeled missing-key fallback.

## NPS Source Maintenance

Run a read-only comparison:

```bash
npm run check:nps-integrity
```

Run the guarded refresh used by automation:

```bash
npm run refresh:nps-sources
```

The refresh requests only the five saved official NPS URLs. It requires two
matching reads, validates identity and bounded values, and can update only
`src/features/trailpack/data/nps-source-snapshots.json`. Missing fields,
inconsistent responses, implausible values, removed pages, or parser failures
block the entire write.

GitHub Actions runs the same guarded refresh monthly on the first day at
15:17 UTC. A changed snapshot is committed only after lint, tests, type checking,
the recommendation stress matrix, and the production build pass.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run test:a11y
npm run build
npm run scenario:stress
```

`npm run test:a11y` starts the application and uses Firefox with Playwright and
axe. Install the matching browser once, if needed:

```bash
npx playwright install firefox
```

The B-02 release passed lint, type checking, 205 Vitest tests, three Firefox/axe
flows, a production build, 27 recommendation stress scenarios, a five-trail live
NPS refresh, and production HTTP/API smoke checks.

## Current Limitations

- The verified catalog contains five Grand Teton trails, not a nationwide trail
  database.
- Manual entry provides a useful fallback but cannot supply source-backed trail
  facts.
- Weather is a coordinate-based forecast rather than an exact high-elevation
  observation. Dates outside the provider range use a labeled saved example.
- The main planning flow still uses saved alert scenarios; the live NPS alert
  route is independently available and production-verified.
- Gemini is optional and Preview-only. Production intentionally uses the
  deterministic fallback.
- TrailPack does not yet have accounts or saved recommendations. That is the
  active B-03 requirement.
- The current dependency-risk decision and remaining upstream findings are
  documented in
  [`docs/superpowers/validation/2026-07-25-dependency-audit.md`](docs/superpowers/validation/2026-07-25-dependency-audit.md).

TrailPack supports planning but does not replace official trail guidance,
current local conditions, emergency preparation, or personal judgment.

## Roadmap

| Requirement | Status |
|---|---|
| CSE 499A MH-01 through MH-06 | Complete |
| B-01 Public trail lookup/import | Complete and production-verified |
| B-02 Guarded live AI and NPS source integrity | Complete and production-verified |
| B-03 Google login and private saved results | Next |
| B-04 Cybersecurity testing, remediation, and report | Blocked until B-03 and release-candidate freeze |

The active schedule is
[`docs/superpowers/plans/2026-07-16-cse-499b-schedule.md`](docs/superpowers/plans/2026-07-16-cse-499b-schedule.md).

## Repository Guide

- [`src/app/`](src/app/) — Next.js pages and server routes
- [`src/features/trailpack/components/`](src/features/trailpack/components/) —
  planner UI
- [`src/features/trailpack/data/`](src/features/trailpack/data/) — verified
  profiles, fixtures, images, and managed snapshots
- [`src/features/trailpack/lib/`](src/features/trailpack/lib/) — search,
  weather, validation, AI, packing, and refresh logic
- [`tests/accessibility/`](tests/accessibility/) — Firefox/axe browser checks
- [`docs/superpowers/specs/`](docs/superpowers/specs/) — active requirements
- [`docs/superpowers/plans/`](docs/superpowers/plans/) — implementation plans
- [`docs/superpowers/validation/`](docs/superpowers/validation/) — milestone
  evidence and decisions
- [`CONTEXT.md`](CONTEXT.md) — domain glossary and durable repository context
- [`CHANGELOG.md`](CHANGELOG.md) — user-facing release history
