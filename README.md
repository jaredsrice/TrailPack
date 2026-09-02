# TrailPack

TrailPack turns trail facts, forecast context, official alerts, and trip details
into a traceable day-hiking packing list. Its deterministic rule engine decides
what belongs on the list; optional AI may improve the explanation but cannot
silently change the packing decisions or their sources.

[Open TrailPack](https://trailpack-ten.vercel.app) ·
[View the changelog](CHANGELOG.md) ·
[View the product roadmap](#roadmap)

## Project Status

| Item | Current state |
|---|---|
| Release | `0.6.1` in Production; post-`0.6.1` reliability hardening is deployed |
| Production | [trailpack-ten.vercel.app](https://trailpack-ten.vercel.app) |
| Deployment source | Protected `main` branch through Vercel |
| Completed milestones | Verified trail catalog; production-guarded AI; source integrity; private saves; security remediation; final UAT |
| Active track | Startup-performance and code-efficiency candidate; Preview review pending |
| Supported catalog | Five manually verified Grand Teton day hikes |
| Guest workflow | Full planner and standard plan review available without an account |

Google login and private saved results are live. The guest flow, complete owner
lifecycle, fresh account chooser, and a real two-account production walkthrough
have been verified. The second identity could neither list nor delete User A's
saved result, and User A confirmed the result remained before removing the
temporary acceptance copy. Signed-in hikers can request one guarded AI
explanation when they generate or update a packing list, limited to five
distinct generated lists per account per hour.

## What TrailPack Does

1. Search for a supported park or trail.
2. Review verified trail facts, source labels, available NPS accessibility or
   terrain guidance, and current NPS alerts when the live service is available.
3. Load a date-aware Open-Meteo forecast with daylight and planned-start
   markers, with clearly labeled saved fallbacks when a provider is unavailable.
4. Add trip details such as date, start time, expected duration, route type, or
   reported conditions.
5. Select **Generate packing list** to snapshot those inputs and create
   essential and optional recommendations with visible rationale and provenance.
   Each expanded recommendation identifies whether its basis is a standard
   TrailPack rule, trip details, forecast data, daylight timing, or a live NPS
   alert.
6. Every generated list includes a concise deterministic plan review without an
   account. For signed-in hikers, that same action also requests one guarded
   Gemini wording check. Editing fields does not spend the allowance; **Update
   packing list** explicitly generates a new snapshot and review. The rule-based
   packing list remains authoritative.

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

The homepage rotates through seven high-resolution, locally served, officially
sourced NPS photographs. Each image has desktop and mobile focal-point tuning;
the carousel also provides previous/next controls, pause/resume, and a selector
for every park. Reduced-motion preferences stop automatic rotation while
leaving manual navigation available. Selecting Grand Teton or a supported trail
locks the visual to the most specific verified scene available. The five
selected-trail photographs are 2,000 to 3,200 pixels wide and have their own
responsive focal points. Manual entry retains general park imagery instead of
claiming an unsupported location match.

The performance candidate initially loads only the visible photograph. The
second crossfade layer is created when navigation or rotation first needs it;
the current image and credit remain visible until its replacement loads. Image
quality, responsive sizes, focal points, and source credits are unchanged.
Optional save/account controls are loaded after a packing list exists instead
of adding their authentication code to the initial trail chooser.

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
| `GEMINI_API_KEY` | No | Enables the guarded live AI review | Preview and Production |
| `GEMINI_MODEL` | No | Overrides the default `gemini-3.5-flash` model | Not configured |
| `NEXT_PUBLIC_SUPABASE_URL` | No | Enables managed Google sessions and private saved results | Preview and Production |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | No | Browser-safe Supabase project key used with row-level security | Preview and Production |

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
| `GET` / `POST /api/trailpack/saved-results` | Lists the signed-in user's results or saves one bounded private snapshot |
| `DELETE /api/trailpack/saved-results/:id` | Deletes only the signed-in owner's saved result |
| `GET /auth/callback` | Completes the Supabase Google OAuth PKCE exchange |

Invalid trail identifiers and malformed inputs return controlled validation
errors without exposing provider details.

## Guarded AI Boundary

The browser sends only bounded trail, weather, alert, trip-condition, and
rule-based packing context to the server route. Unrestricted notes, email
addresses, OAuth data, and provider credentials are excluded.

When Gemini is configured, the route requires a valid Supabase session and
atomically claims a database-backed allowance before contacting the provider.
Each account can review at most five distinct generated packing-list snapshots
during an hour-long window; the browser cannot override the account identity,
count, or reset time. A generation identifier makes retries idempotent, so a
repeated request for the same list does not increment the account count.

The server requests structured Gemini output with `store: false`, validates the
response shape, and then rejects any result that:

- changes the packing-item set or order;
- changes source labels;
- rewrites rule-engine missing details;
- substitutes facts from another trail; or
- makes unsupported safety guarantees.

Timeout, quota, missing-key, malformed-response, provider-error, duplicate, and
rejected outcomes all preserve the unchanged deterministic fallback. Supported
plans request a review only when the hiker selects **Generate packing list** or
**Update packing list**. Signed-out requests are rejected before an allowance
claim, so they do not consume a signed-in account's quota.

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
15:17 UTC. Repository code executes only in a read-only validation job with
checkout credentials disabled. If the snapshot changes and lint, tests, type
checking, the recommendation stress matrix, and the production build all pass,
that job uploads only the validated JSON file. A separate publisher job with no
dependency install or repository-script execution applies that one artifact to
a dedicated automation branch and opens a pull request. Protected `main`
requires the normal validation, CodeQL, and Vercel checks before merge.

## Verification

```bash
npm run lint
npm run typecheck
npm test
npm run check:nps-integrity
npm run scenario:stress
npm run stress:system
npm run build
npm run test:a11y
```

`npm run test:a11y` starts the application and uses Firefox with Playwright and
axe. Install the matching browser once, if needed:

```bash
npx playwright install firefox
```

The `0.6.1` correction passed lint, type checking, 271 Vitest tests across 30
files, four Firefox/axe interaction flows, a production build, 27 recommendation
stress scenarios, and the five-trail live NPS integrity check. Its protected
Preview displayed the current official NPS alerts and preserved the explicit
Generate/Update boundary. Deployment-specific evidence is recorded in the
matching changelog entry.

The deployed reliability hardening adds a fixed-seed 5,000-case system stress
run, exact request and provider-response boundaries, repeated quota-concurrency
checks, stale-request and double-submission regressions, and responsive photo
quality coverage. Its complete local matrix passed lint, type checking, 354
tests across 34 files, 5 of 5 live NPS source checks, all 27 recommendation
scenarios, the optimized Production build, and 18 Firefox/axe flows. The run
recorded zero invariant failures, console errors, console warnings, automated
accessibility violations, broken images, or overflow at the tested widths.
Pull request #44 passed Validate, CodeQL, Vercel, desktop and 390-pixel Preview
acceptance, then merged to protected `main`. Production returned HTTPS `200`
with the `TrailPack` title and the new state-aware context labels. Current
evidence and exclusions are tracked in the
[full project stress audit](docs/superpowers/validation/2026-08-31-full-project-stress-audit.md).

The current performance candidate reduces the homepage's production-build
first-load JavaScript from 218 kB to 149 kB. Its local gate passed all 354 unit
tests, 19 Firefox/axe flows, 27 recommendation scenarios, the 5,000-case stress
run, lint, type checking, and the optimized build. Hosted Preview acceptance is
still pending; these changes are not yet on Production. Measurements, code
review findings, and exclusions are recorded in the
[performance and code-efficiency audit](docs/superpowers/validation/2026-09-02-performance-code-efficiency-audit.md).

The underlying `0.5.0` security release also passed CodeQL analysis, a
zero-vulnerability dependency audit, production browser/API smoke checks, a
real two-account privacy walkthrough, and an updated OWASP ZAP passive scan with
no critical or high-severity issue. The sanitized review and risk decisions are
in the [sanitized security review](docs/superpowers/validation/2026-08-28-b04-cybersecurity-review.md).

## Current Limitations

- The verified catalog contains five Grand Teton trails, not a nationwide trail
  database.
- Manual entry provides a useful fallback but cannot supply source-backed trail
  facts.
- Weather is a coordinate-based forecast rather than an exact high-elevation
  observation. Dates outside the provider range use a labeled saved example.
- The main planning flow requests current park alerts from the NPS API. If the
  service or key is unavailable, the first attempt stops after a five-second
  provider budget and a six-second browser budget. TrailPack keeps planning
  usable with an explicitly labeled fallback, does not evaluate alert-based
  recommendations from saved demo alerts, and retries once in the background.
  If that retry returns live data after generation, the hiker must explicitly
  update the list; TrailPack never silently changes a generated plan.
- Gemini is optional, available only to signed-in users, and capped at five
  distinct generated-list reviews per account per hour. Field edits, signed-out
  attempts, and duplicate requests do not spend that allowance. Authentication,
  quota, provider, or validation failures retain the deterministic rule-based
  fallback.
- Saved results have managed Supabase storage, row-level security, database
  payload and quota limits, and production Google OAuth. The owner lifecycle
  and real two-account list/delete isolation are verified in the
  [private-save validation record](docs/superpowers/validation/2026-07-30-b03-auth-data-design.md).
- The release audit reports zero npm vulnerabilities and zero open Dependabot
  alerts. The historical and current dependency decisions are documented in
  [`docs/superpowers/validation/2026-07-25-dependency-audit.md`](docs/superpowers/validation/2026-07-25-dependency-audit.md).
- The production CSP intentionally retains bounded inline-script and
  inline-style allowances required by the current Next.js rendering path. The
  accepted medium-risk rationale and compensating controls are in the security
  review linked above.

TrailPack supports planning but does not replace official trail guidance,
current local conditions, emergency preparation, or personal judgment.

## Roadmap

| Product milestone | Status |
|---|---|
| Core guest planning and packing workflow | Complete and production-verified |
| Verified Grand Teton trail catalog | Complete and production-verified |
| Guarded live AI and NPS source integrity | Complete; production rollout included in `0.6.0` |
| Google login and private saved results | Complete and production-verified with two separate identities |
| Security audit, remediation, and release-candidate verification | Complete |
| Final everyday-hiker acceptance | Complete; owner approved the final preview and release state |
| Reliability and stress hardening | Complete and production-verified through pull request #44 |
| Startup performance and code efficiency | Local candidate verified; Preview and owner approval pending |

Detailed implementation plans and validation evidence are maintained under
[`docs/superpowers/plans/`](docs/superpowers/plans/) and
[`docs/superpowers/validation/`](docs/superpowers/validation/).

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
