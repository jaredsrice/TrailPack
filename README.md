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
| Release | `0.6.1` — explicit list generation and live-alert correction |
| Production | [trailpack-ten.vercel.app](https://trailpack-ten.vercel.app) |
| Deployment source | Protected `main` branch through Vercel |
| Completed milestones | Verified trail catalog; production-guarded AI; source integrity; private saves; security remediation; final UAT |
| Active track | Release complete; optional post-release maintenance |
| Supported catalog | Five manually verified Grand Teton day hikes |
| Guest workflow | Fully available without an account |

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
6. For signed-in hikers, that same action requests one guarded Gemini review of
   the explanation. Editing fields does not spend the allowance; **Update
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
for every park. Selecting Grand Teton or a supported trail locks the visual to
the most specific verified scene available. Manual entry retains general park
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
15:17 UTC. A changed snapshot is committed to a dedicated automation branch
only after lint, tests, type checking, the recommendation stress matrix, and the
production build pass. The workflow then opens a pull request; protected
`main` requires the normal validation, CodeQL, and Vercel checks before merge.

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

The `0.6.1` correction passed lint, type checking, 270 Vitest tests across 30
files, four Firefox/axe interaction flows, a production build, 27 recommendation
stress scenarios, and the five-trail live NPS integrity check. Its protected
Preview displayed the current official NPS alerts and preserved the explicit
Generate/Update boundary. Deployment-specific evidence is recorded in the
matching changelog entry.

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
  service or key is unavailable, it keeps planning usable with an explicitly
  labeled saved fixture and tells the hiker to check live NPS alerts.
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
