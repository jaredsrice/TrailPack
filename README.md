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
| Release | `0.6.1` in Production; post-`0.6.1` reliability, startup-performance, and alert-clarity improvements are deployed |
| Production | [trailpack-ten.vercel.app](https://trailpack-ten.vercel.app) |
| Deployment source | Protected `main` branch through Vercel |
| Completed milestones | Verified trail catalog; production-guarded AI; source integrity; private saves; security remediation; final UAT |
| Active track | Shared trail definitions, original-profile migration, and two verified Teton additions; awaiting release |
| Supported catalog | Seven verified Grand Teton day hikes in current source; five in Production until this change is released |
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
   markers, with clearly labeled saved fallbacks when available, or explicit
   unknown weather when no saved example exists.
   Active NPS closures are red, other active alerts amber,
   and unavailable feeds explicit. A blue **Live** label describes retrieval,
   not whether a route is safe. Saved weather examples stay behind a labelled
   disclosure instead of appearing as current condition pills.
   The NPS card shows a notice count and closure hint; **NPS notices and
   sources** expands every supplied notice without repeating titles as pills.
4. Add trip details such as date, start time, expected duration, route type, or
   reported conditions.
5. Select **Generate packing list** to snapshot those inputs and create
   essential and optional recommendations with visible rationale and provenance.
   Each expanded recommendation identifies whether its basis is a standard
   TrailPack rule, trip details, forecast data, daylight timing, or a live NPS
   alert.
   The safety-context update names the triggering notices, states that a
   park-wide alert's impact on the selected trail is unconfirmed, and shows
   **Check route** instead of assuming the hike must change. **Why and source
   details** contains the supplied descriptions and each notice's source link.
   NPS guidance appears once in Critical Safety; a duplicate NPS warning is
   omitted from Overall alerts when the safety row already covers it. Weather
   warnings remain separate.
   Forecast heat decisions show the temperature that triggered the planning rule.
6. Every generated list includes a concise deterministic plan review without an
   account. For signed-in hikers, that same action also requests one guarded
   Gemini wording check. Editing fields does not spend the allowance; **Update
   packing list** explicitly generates a new snapshot and review. The rule-based
   packing list remains authoritative.

Unsupported hikes can use manual distance, elevation gain, route type, duration,
and condition inputs to produce a limited fallback list.

## Supported Trail Catalog

The catalog contains seven Grand Teton day hikes. Lunch Tree Hill and Christian
Pond Loop use the same reviewed definition format as the original five trails.

| Trail | Profile evidence | NPS accessibility details |
|---|---|---|
| Jenny Lake Loop | Official NPS facts with reconciled USGS comparison data | Available |
| Taggart Lake | Official NPS facts with a close USGS geometry match | Available |
| String Lake Loop | Official NPS facts with a labeled USGS bridge estimate | Available |
| Colter Bay Lakeshore Trail | Official NPS facts with 15 reconciled USGS trail segments | Not found on the tracked NPS page |
| Two Ocean Lake Loop | Official NPS facts with three reconciled USGS trail segments | Not found on the tracked NPS page |
| Lunch Tree Hill (new) | Official NPS facts with five connected USGS segments | Available |
| Christian Pond Loop (new) | Official NPS facts with five connected USGS segments, including a repeated access spur | Available |

All seven appear in the application as a `Verified NPS + USGS profile`. Internal
`curated` and `public-source-import` values remain only for historical
traceability; they do not represent different quality tiers.

Every trail uses the same approved definition and compiler. The original five
retain their official facts and review history. The original three USGS
comparisons lack retained feature IDs; that historical evidence gap is explicit
and cannot be used to bypass exact-ID requirements for new admissions. The
[migration and admission record](docs/data/teton-expansion-2026-09-03.md)
documents both the preserved evidence and the new route checks.

Accessibility text is displayed only when the official trail page publishes a
matching trail-specific block. TrailPack presents it as sourced terrain
information, not as an accessibility certification.

### Adding another trail

Start with one [trail onboarding draft](templates/trails/trail.template.json),
then use the offline checker to find missing fields, duplicate identities,
source-format issues, or undersized local photos. The optional preparation mode
creates a four-file review package. Once approved, add its official snapshot
and register its JSON definition once. Profiles, park membership, source checks,
photos, and honest unknown-data fallbacks derive from that registration.
The preparation command does not edit the application or publish a trail.

```sh
npm run trail:new -- example-lake-loop
npm run trail:check -- .artifacts/trail-onboarding/example-lake-loop/trail.json
npm run trail:check -- --catalog
```

The [onboarding guide](docs/trail-onboarding.md) includes a worked example,
registration instructions, and troubleshooting. This intake is deliberately
Grand Teton-only until park-specific safety rules are reviewed for another park.
No authentication, external API call, or new dependency is needed to check a draft.

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
  The [seven-trail comparison](docs/data/teton-expansion-2026-09-03.md#alltrails-cross-check)
  records distance, gain, duration, difficulty, and route-variant differences.
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
locks the visual to the most specific verified scene available. The seven
selected-trail photographs are 2,000 to 5,472 pixels wide and have their own
responsive focal points. Manual entry retains general park imagery instead of
claiming an unsupported location match.

The carousel initially loads only the visible photograph. The
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
`Taggart`, `String Lake`, `Colter Bay`, `Two Ocean`, `Lunch Tree`, or `Christian Pond`.

### Optional Environment Variables

Store local values in `.env.local`; never commit that file or print its values.
Hosted Preview/Production settings do not automatically configure a local
server. Add `NPS_API_KEY` locally for live alerts, then restart the server.
Keep it server-only: never use a `NEXT_PUBLIC_` prefix or put it in browser code.
Open-Meteo's current forecast integration does not require an API key.

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
| `GET /api/trailpack/weather?trailId=...` | Returns normalized live weather, a labeled saved example, or explicit unknown weather when no example exists |
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

The refresh requests only registered official NPS URLs (seven in current source). It requires two
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
npm run trail:check -- --catalog
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

The deployed performance update reduces the homepage's production-build
first-load JavaScript from 218 kB to 149 kB. Its local gate passed all 354 unit
tests, 19 Firefox/axe flows, 27 recommendation scenarios, the 5,000-case stress
run, lint, type checking, and the optimized build. Pull request
[#47](https://github.com/jaredsrice/TrailPack/pull/47) passed hosted checks and
desktop/mobile Preview acceptance. Hosted app-asset transfer decreased by 43%
on desktop and 34% on mobile. After owner approval, the PR merged as `c7ee839`.
Vercel reported a successful Production deployment, and the production homepage
returned HTTPS `200` with the `TrailPack` title. Measurements, code review
findings, and exclusions are recorded in the
[performance and code-efficiency audit](docs/superpowers/validation/2026-09-02-performance-code-efficiency-audit.md).

The alert-contrast and weather-clarity update was approved and merged in
[#48](https://github.com/jaredsrice/TrailPack/pull/48) as `5728e36`. Its local
gate passed 368 unit tests, 21 Firefox/axe flows, lint, type checking, and the
build. Required hosted checks passed, Vercel confirmed successful Production
deployment, and the public homepage returned HTTPS `200` with title `TrailPack`.
The subsequent safety-context work was approved and merged separately through
[PR #49](https://github.com/jaredsrice/TrailPack/pull/49) as `e99b5f4`.
Vercel confirmed Production success at 2026-09-03 03:09:55 UTC; the public
homepage returned HTTPS `200` with the `TrailPack` title.

The underlying `0.5.0` security release also passed CodeQL analysis, a
zero-vulnerability dependency audit, production browser/API smoke checks, a
real two-account privacy walkthrough, and an updated OWASP ZAP passive scan with
no critical or high-severity issue. The sanitized review and risk decisions are
in the [sanitized security review](docs/superpowers/validation/2026-08-28-b04-cybersecurity-review.md).

The seven-trail update, local weather-timeout follow-up, compact NPS presentation,
and independent weather-coordinate review pass 527 unit tests across 40 files,
32 Firefox/axe flows, lint, type checking, and the production build. The
5,000-case system stress run passed with no invariant failures. Each weather
point was checked against NPS-origin USGS geometry in its intended trail area;
these are area-forecast references, not navigation coordinates. NPS distance
values remain authoritative; unavailable or disputed computed gains are not
described as confirmed matches.
After configuring the private local NPS
key and restarting the server, local requests returned three live official
park notices plus live weather and daylight. The key remains Git-ignored and
absent from browser assets. These live feed checks are separate from the
trail-page integrity checks, which verify catalog facts.
See the [current verification record](docs/data/teton-expansion-2026-09-03.md).

## Current Limitations

- The catalog contains seven Grand Teton day hikes, not the entire park trail
  network or a nationwide database. Further trails require reviewed admission.
- Manual entry provides a useful fallback but cannot supply source-backed trail
  facts.
- Weather is a coordinate-based forecast rather than an exact high-elevation
  observation. Dates outside the provider range use a labeled saved example
  only when one exists; otherwise forecast adjustments stay unavailable and
  standard packing rules remain active. New trail definitions do not invent
  forecast or daylight data.
  Availability messages distinguish provider rate limits,
  denied requests, timeouts, connection failures, and unusable responses without
  exposing raw provider diagnostics. Refreshing cannot guarantee recovery from
  a provider-side limit or outage. Weather has a 15-second provider budget,
  followed by up to three seconds for optional daylight context. Missing
  daylight never discards a valid live forecast. The browser allows 25 seconds
  overall, including network overhead, before restoring the labeled fallback.
  Fast responses display as soon as they finish; these are maximum waits, not
  added delays. Provider and account quotas are unchanged.
- The main planning flow requests current park alerts from the NPS API. If the
  service or key is unavailable, the first attempt stops after a five-second
  provider budget and a six-second browser budget. TrailPack keeps planning
  usable with an explicitly labeled fallback, does not evaluate alert-based
  recommendations from saved demo alerts, and retries once in the background.
  If that retry returns live data after generation, the hiker must explicitly
  update the list; TrailPack never silently changes a generated plan.
- NPS notices are park-wide. TrailPack does not verify that a selected trail,
  its approach road, or the user's exact route is affected, and a trail-name
  keyword match is not proof of a closure. Safety details retain the supplied
  notice text and source links without inventing affected locations or dates.
- New saved-list snapshots retain bounded safety evidence; older saved lists
  still load without it. No additional database table, migration, or account
  permission is required.
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
| Startup performance and code efficiency | Approved, merged in pull request #47, and verified in Production |
| Alert contrast and weather-availability clarity | Approved, merged in pull request #48, and verified in Production |
| Specific trip-safety evidence and route uncertainty | Approved, merged in pull request #49, and verified in Production |
| Repeatable trail onboarding and Teton expansion | All five existing trails migrated; Lunch Tree Hill and Christian Pond Loop added to current source, pending release |

Detailed implementation plans and validation evidence are maintained under
[`docs/superpowers/plans/`](docs/superpowers/plans/) and
[`docs/superpowers/validation/`](docs/superpowers/validation/).

## Repository Guide

- [`src/app/`](src/app/) — Next.js pages and server routes
- [`src/features/trailpack/components/`](src/features/trailpack/components/) —
  planner UI
- [`src/features/trailpack/data/`](src/features/trailpack/data/) — verified
  profiles, fixtures, images, and managed snapshots
- [`src/features/trailpack/data/trails/`](src/features/trailpack/data/trails/) —
  one approved metadata definition per trail
- [`docs/trail-onboarding.md`](docs/trail-onboarding.md) — reusable admission
  checklist and troubleshooting
- [`src/features/trailpack/lib/`](src/features/trailpack/lib/) — search,
  weather, validation, AI, packing, and refresh logic
- [`tests/accessibility/`](tests/accessibility/) — Firefox/axe browser checks
- [`docs/superpowers/specs/`](docs/superpowers/specs/) — active requirements
- [`docs/superpowers/plans/`](docs/superpowers/plans/) — implementation plans
- [`docs/superpowers/validation/`](docs/superpowers/validation/) — milestone
  evidence and decisions
- [`CONTEXT.md`](CONTEXT.md) — domain glossary and durable repository context
- [`CHANGELOG.md`](CHANGELOG.md) — user-facing release history
