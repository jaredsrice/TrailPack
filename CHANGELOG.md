# Changelog

All notable TrailPack changes are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

TrailPack is still a `0.x` prototype. A minor version marks a completed,
demo-ready product milestone; a patch version is reserved for backward-compatible
corrections within that milestone.

## [Unreleased]

## Preserve loop expansion - 2026-09-04

### Added

- Lake Creek–Woodland Trail Loop and Phelps Lake Loop in the reviewed
  catalog, using NPS facts, connected USGS comparisons within 2% of official
  distance, the official Preserve trailhead weather point, and retained terrain
  guidance. Computed elevation gains and missing live conditions stay unknown.
- One sharp, credited Phelps Lake south-shore photograph shared by both routes.
- A dated Grand Teton coverage checklist for 39 in-park NPS Hiking pages and
  two adjacent Parkway listings, with route variants and unfinished reviews
  explicit. This does not claim complete park coverage.
- Reproducible access-trail clipping, route connectivity, source, weather-point,
  and desktop/mobile guest regression coverage for the new admissions.

These two additions are separate from the approved seven-trail release in
[PR #50](https://github.com/jaredsrice/TrailPack/pull/50), deployed as `1894f52`
on 2026-09-04. The owner separately approved this expansion for the protected
release workflow; deployment status is tracked by its pull request.

### Verification

- 540 unit tests, 36 Firefox/axe flows, all nine offline catalog/photo checks,
  all nine live NPS comparisons, lint, type checking, and the production build
  passed. The four new-route flows passed again after final crop tuning.
- The 5,000-case system stress run had zero invariant failures. Both new routes
  completed signed-out live-context generation in the in-app Browser with
  clean error/warning logs and no horizontal overflow or broken visible images.
- README, onboarding guidance, photo credits, coverage inventory, and the
  [dated admission record](docs/data/preserve-admission-2026-09-04.md) distinguish
  the original seven-trail catalog from these two reviewed additions.

## Catalog expansion and live-context refinements - 2026-09-04

### Added

- A reusable trail-onboarding draft, a worked example, and an offline checker
  with field-specific fixes. Missing facts remain blank, duplicate trail
  identities are rejected, and photo checks preserve the site's existing
  minimum image resolution.
- Optional preparation of a four-file review package: completed draft, approved
  definition, managed NPS snapshot entry, and registration instructions. Existing
  files are never overwritten and no trail is automatically published.
- Lunch Tree Hill and Christian Pond Loop, with reviewed NPS facts, connected
  USGS geometry comparisons, official accessibility context, and sharp credited
  NPS photographs with desktop/mobile framing.
- A whole-catalog offline check for matching definitions, managed facts, local
  photographs, and orphaned snapshot entries.
- A concise [onboarding and troubleshooting guide](docs/trail-onboarding.md).
  The intake remains Grand Teton-only.

### Changed

- All five original trails now use the same definition and compiler as new
  admissions. Official facts remain in one managed snapshot; profile metadata,
  park membership, photo credits/crops, source-check policies, and unknown-data
  fallbacks no longer need separate registration lists.
- Existing NPS facts, source-review dates, comparison estimates, photo assets,
  and recommendation outputs are preserved. Historical missing USGS feature IDs
  for the original three are explicit, with no exception allowed for new trails.
- New trails start with unknown conditions, not invented saved forecasts or
  closure claims. The homepage rotation and existing image crops are unchanged.
- NPS status now shows a compact notice count and closure hint, with every
  supplied notice and source available in an expandable section. Generated
  lists keep the actionable NPS guidance in Critical Safety instead of repeating
  it in Overall alerts. Weather warnings and safety rules are unchanged.
- All seven profiles were cross-checked against public AllTrails listings.
  Differences and non-equivalent route variants are recorded in the admission
  evidence; official NPS values remain authoritative and unchanged.

### Fixed

- Taggart Lake and String Lake now have sourced trail-area coordinates for live
  weather requests; those profiles previously lacked coordinates and skipped
  the live forecast. The coordinates are not navigation or trailhead guidance.
- All seven weather points have an independent, dated NPS-origin USGS geometry
  review and regression checks. They represent the intended trail areas;
  provider grid resolution and mountain-weather limitations remain explicit.
- NPS duration checking and guarded refresh now support minutes as well as
  hours, preserving positive, ordered, bounded duration checks.
- Separate source-evidence entries retain unique display identities even when
  their geometry and weather-coordinate reviews link to the same USGS layer.
  The hosted development-mode browser gate caught and now guards this case.
- Coordinate-source labels use an exact NPS hostname or genuine subdomain,
  consistent with the intake validator; lookalike domains remain rejected.
- A valid unknown-weather response now survives client validation, failed
  requests, and date changes without becoming a fictitious saved example.
  Standard packing rules remain available, and the page hides an empty forecast
  disclosure when no forecast exists.
- Slow live forecasts now have 15 seconds to respond instead of eight. Optional
  daylight lookup stops after three seconds without discarding valid weather,
  and the page allows 25 seconds overall before returning to a labeled fallback.
  Timeout messages match the new limit; NPS budgets, retries, and quotas are
  unchanged.

### Verification

- All 527 unit tests across 40 files and 32 Firefox/axe flows passed, including
  both new trails at desktop and 390-pixel widths, failed forecasts, date changes,
  guest generation, and photo/credit checks. The four new guest flows reported
  no console errors/warnings, automated accessibility violations, or overflow.
- Compact NPS status and keyboard-accessible notice details pass desktop/mobile
  checks. Closure evidence remains available, ordinary notices retain their
  safety row alongside heat decisions, and independent rain/heat overview
  warnings remain visible. The in-app preview also passed a live-feed guest
  generation check at 1280 and 390 pixels with no error/warning logs, broken
  visible images, or horizontal overflow.
- Timeout regressions cover stalled forecast headers/body, valid weather at
  14 seconds, optional daylight cancellation without losing live weather, a
  browser response at 22 seconds, and usable fallback at the 25-second deadline.
  A normal local weather request returned live forecast and daylight data.
  After the private local key was configured and the server restarted, the
  NPS route returned three live official park notices. The key remains
  Git-ignored and absent from browser assets; hosted settings were not changed.
- All seven live NPS source comparisons passed. The 5,000-case system stress
  run covered all seven trails with zero invariant failures. The original
  27-scenario recommendation report remains unchanged; its generation now sorts
  trail IDs independently of the catalog's display order.
- Offline catalog and preparation/no-overwrite checks, lint, type checking, and
  the production build passed. Homepage first-load JavaScript is 152 kB versus
  150 kB before this catalog update; the offline validator is not imported by
  the runtime compiler.
- Validation required no interactive authentication, second account, live AI,
  or saved-result write. See the [migration and admission evidence](docs/data/teton-expansion-2026-09-03.md).
  The protected PR checks and deployment status are the release authority;
  these local results do not by themselves establish a successful deployment.

## Deployed trip-safety evidence - 2026-09-02

Approved and deployed through
[pull request #49](https://github.com/jaredsrice/TrailPack/pull/49) as `e99b5f4`.
All four required hosted checks passed. Vercel confirmed Production success at
2026-09-03 03:09:55 UTC (2026-09-02 America/Denver); the public homepage returned
HTTPS `200` with title `TrailPack`.

### Changed

- **Trip safety decision** names the notices that triggered it and makes
  **Park-wide alert; impact on this trail unconfirmed** visible without
  expanding the row. These alerts say **Check route**, with conditional advice,
  instead of assuming the selected hike must change.
- **Why and source details** keeps each triggering notice's supplied description
  and its own source link. The generic **Decision type** paragraph and repeated
  safety-gear explanation are removed.
- Forecast heat decisions show the temperature that triggered the existing
  95°F planning rule, with live-versus-example uncertainty retained.

### Fixed

- The overall alert links to the notice that triggered the safety decision,
  even when a different park notice appears first in the feed.
- New saved lists retain bounded safety details. Older snapshots remain
  readable; malformed nested details and unsafe URLs are rejected.

### Verification

- 374 unit tests, the 5,000-case deterministic/mocked-API stress run, lint, type
  checking, and the production build passed. All 23 Firefox/axe flows passed,
  including desktop/mobile notice details and keyboard expansion; the three
  affected flows also passed again after final wording changes.
- No authentication, second account, live AI review, or saved-result write was
  needed. Saved-detail compatibility was checked with local contract tests.

## Deployed alert contrast and weather clarity - 2026-09-02

Approved and deployed through
[pull request #48](https://github.com/jaredsrice/TrailPack/pull/48) as `5728e36`.
Vercel confirmed Production success on 2026-09-02 America/Denver
(2026-09-03 UTC); the public homepage returned HTTPS `200` with title `TrailPack`.
The reviewed change passed 368 unit tests, 21 Firefox/axe flows, lint, type
checking, the production build, and the required hosted checks.

### Changed

- Active NPS closure alerts use a red card accent and high-contrast red labels;
  other active alerts use amber. Unavailable data is visibly distinct from a
  successful no-alert check, and the **Live** badge describes retrieval only.
- Weather fallback now says **Live forecast unavailable**. Saved conditions and
  daylight values are kept under **Saved weather example**, rather than shown as
  current weather pills. Pending requests say **Checking**, not **Fallback**.

### Fixed

- Weather failures now explain provider rate limits or rejections, timeouts,
  connection failures, and unreadable or unusable responses. Raw provider bodies
  and exception details remain private. This does not change provider limits,
  timeout budgets, packing rules, or AI allowance behavior.
- Saved NPS closure fixtures cannot acquire the live-alert presentation or
  appear as current official alert titles.

## Deployed startup performance - 2026-09-02

Approved and deployed from protected `main` through
[pull request #47](https://github.com/jaredsrice/TrailPack/pull/47). The merge
commit is `c7ee839`; deployment completed on 2026-09-02 America/Denver
(2026-09-03 UTC). These performance changes are separate from the alert UI
release listed above.

### Changed

- The trail chooser now downloads only the visible park photograph at startup.
  The second photo layer is created on the first transition, preserving sharp
  images, smooth crossfades, focal points, and synchronized credits.
- The current photograph, credit, and selection indicator now remain in place
  until the next photograph loads, including when a pending selection is canceled.
- Optional save/account controls now load after a packing list exists, keeping
  their authentication code out of the initial planner bundle.

### Verification

- The optimized homepage's first-load JavaScript decreased from 218 kB to
  149 kB, about 32%, without changing packing rules, provider budgets, or access
  controls.
- Hosted initial app-asset transfer decreased from 938 kB to 534 kB on desktop
  and from 501 kB to 333 kB on mobile. Vercel's Preview-only review tooling is
  reported separately rather than counted as application code.
- The local candidate passed lint, type checking, 354 unit tests, 19 Firefox/axe
  flows, 27 recommendation scenarios, the 5,000-case stress run, and the
  production build. Pull request [#47](https://github.com/jaredsrice/TrailPack/pull/47)
  passed hosted checks and desktop/mobile Preview acceptance. After owner
  approval, the PR merged and Vercel reported successful Production deployment.
  The production homepage returned HTTPS `200` with the `TrailPack` title.
- The [performance and code-efficiency audit](docs/superpowers/validation/2026-09-02-performance-code-efficiency-audit.md)
  separates download savings, interface timings, provider waits, and remaining
  measurement limits.

## Deployed reliability hardening - 2026-09-01

The changes below were deployed from protected `main` through
[pull request #44](https://github.com/jaredsrice/TrailPack/pull/44) on
2026-09-01 and have not yet been assigned a version tag.

### Added

- Plain-language **Basis** text in every expanded packing recommendation and
  overall alert, distinguishing standard rules from live NPS alerts, live or
  saved forecasts, daylight timing, and user-entered trip details.
- One bounded background NPS retry after the initial live-alert attempt falls
  back. A late live result offers an explicit list update without silently
  changing the generated snapshot.
- A fixed-seed system stress command that exercises 5,000 bounded packing
  scenarios across all five supported trails, repeats every recommendation for
  determinism, enforces latency and heap budgets, and now runs in pull-request
  validation.
- Focused regression coverage for exact byte limits, strict request and response
  contracts, provider timeouts, quota races, duplicate retries, stale browser
  state, responsive image quality, and the monthly NPS publisher boundary.

### Changed

- Weather, daylight, NPS, guarded-AI, and saved-result response bodies are read
  within explicit byte limits. Weather and daylight provider requests retain an
  eight-second upper bound; NPS alerts now use a five-second provider budget and
  a six-second browser budget before generation unlocks with the labeled
  fallback. Weather keeps its 20-second browser bound.
- The four lower-resolution selected-trail photographs now use clearer official
  NPS originals from the same credited sources, with explicit desktop and mobile
  focal points for all five supported trails.
- Reduced-motion mode now exposes the carousel as paused, disables its automatic
  motion control, and keeps previous, next, and direct selectors available.
- Forecast alerts now keep cold and snow separate unless both signals are
  explicitly present. Alert cards no longer display category chips that resemble
  inactive filters, while official source links remain visible.
- Critical Safety rows now show only the one status that changes the hiker's
  action, and expanded provenance is one plain line instead of badge-like source
  tags. An alert-backed trip decision replaces the duplicate generic alert row
  in the rendered list without removing its underlying source data.
- The bottom review is now a concise guest-ready plan check. Missing details and
  review limits sit behind one optional disclosure, while validation payloads and
  per-item explanation drafts are no longer exposed as user interface content.
- Saving now reads as an optional follow-up instead of an account gate; the saved
  data explanation is available under a compact disclosure.
- Live status, source, and context-detail pills now use stronger fills, borders,
  and text weights so weather and alert provenance remains easy to scan without
  making the non-interactive labels resemble filter controls.
- The monthly NPS refresh validates repository code with read-only permissions
  and publishes only the validated JSON artifact from an isolated write-scoped
  job that does not install dependencies or execute repository scripts.

### Fixed

- Replaced the misleading saved-alert “no active alerts” state with an explicit
  notice that live NPS alerts could not be evaluated. A failed live request now
  clears saved demo alerts before generation, so fixture closures cannot trigger
  alert-specific recommendations.
- Prevented two synchronous Generate clicks from creating two generation UUIDs
  and two guarded-AI requests before React committed the loading state.
- Prevented an aborted older review from clearing or unlocking a newer
  generation, and added browser-side cancellation on reset, trail changes, and
  unmount with a 30-second client timeout.
- Prevented a non-settling or rejected stream cancellation from hanging an
  already classified oversized request or response.
- Rejected conflicting trail/park identifiers, impossible forecast timestamps,
  out-of-range provider values, widened AI contracts, unsafe NPS links, and
  unsafe links in stored snapshots.
- Converted unexpected authentication and OAuth exchange failures into bounded,
  generic, non-cacheable responses without exposing provider or database detail.
- Started the two initial carousel layers with different photos, removing the
  development warning caused by prioritizing the same asset twice, and hid the
  inactive image from assistive technology.
- Removed repeated fallback and sign-in messaging that made the standard guest
  review look unavailable even though the deterministic plan check had completed.

### Security

- Added source-controlled HSTS with a two-year lifetime, subdomain coverage, and
  preload, matching the verified Production policy.
- Require HTTPS saved-result links without embedded credentials or control
  characters, authenticate saved-result writes before reading their bodies, and
  fail quota/authentication dependency errors closed before provider or database
  work.
- Limit live NPS results to 10 alerts and 2,000 characters per provider string,
  permit only credential-free HTTPS `nps.gov` links, and keep provider error
  bodies out of client-visible failures.

### Verification

- The fixed-seed run completed 5,000 cases and 10,200 evaluations with zero
  invariant failures: 0.053 ms p95 latency, 0.182 ms maximum latency, and
  6,176,624 bytes of heap growth in the final local run.
- Mocked unique-request concurrency at 1, 10, 25, and 50 requests enforced at
  most five successes in each of three runs. Fifty same-generation retries
  produced one success, 49 duplicates, and one provider call in each run; the
  50-request unique workload stayed at 5.708 ms p95, and aggregate API heap
  growth stayed below 13 MB.
- Focused API checks passed 132 tests and the focused security group passed 54
  tests. The final full suite passed 354 tests across 34 files; lint, type
  checking, the production build, and all 18 Firefox accessibility and
  interaction checks also passed.
- All five selected-trail photos were visually checked at approximately 1280,
  768, and 390 pixels with clear subjects, correct credits, and no horizontal
  overflow. The complete accessibility run passed 18 Firefox/axe flows with no
  automated violations.
- The final local build, 5-of-5 live NPS integrity check, and 27-of-27
  recommendation scenario matrix passed. Pull request #44 then passed Validate,
  CodeQL, Vercel, and signed-out desktop/mobile Preview acceptance before merging
  as `40bb8c2`. Production returned HTTPS `200` with the `TrailPack` title, the
  state-aware context-label styling, no relevant console warnings or errors, and
  no horizontal overflow.

## [0.6.1] - 2026-08-29

Corrected the guarded-review allowance so it follows deliberate packing-list
generation, and connected current NPS alerts to the primary planning flow in
[pull request #43](https://github.com/jaredsrice/TrailPack/pull/43).

### Added

- An explicit **Generate packing list** / **Update packing list** boundary that
  snapshots the trip, weather, and alert context before creating recommendations.
- A strict, bounded browser client for the live NPS alert route, with a labeled
  saved-fixture fallback when live alerts cannot be loaded.

### Changed

- A signed-in hiker receives one guarded explanation request for each deliberate
  list generation. Editing trip fields alone no longer sends requests or spends
  the hourly allowance.
- The five-per-hour limit now means five distinct generated packing lists per
  account, with the remaining count and reset time still controlled by the
  server and database.

### Fixed

- Repeated delivery of the same generation identifier is detected before the
  quota count increments, preventing network retries from consuming additional
  allowance.
- The planner now distinguishes a successful live NPS response with zero active
  alerts from an unavailable live source; it no longer presents the saved demo
  fixture as though it were the current NPS result.
- A stalled NPS request now falls back after eight seconds instead of leaving
  packing-list generation waiting indefinitely.

### Security

- The quota claim remains transactionally serialized per authenticated account,
  and now records at most five generation identifiers for the active window.
- Signed-out requests are rejected before the quota claim and cannot consume a
  signed-in account's allowance.

### Verification

- Lint, type checking, 271 Vitest tests across 30 files, four Firefox/axe flows,
  the optimized Production build, 27 recommendation stress scenarios, and the
  five-trail live NPS integrity check passed.
- The protected Preview displayed three current official Grand Teton alerts.
  Editing three trip fields produced no packing list or review; Generate created
  one list and one signed-out fallback; a later edit exposed Update without an
  automatic regeneration.
- The Production quota schema and function grants passed structural checks. An
  authenticated rollback transaction allowed the first generation UUID, marked
  its retry as a duplicate with the same remaining count, and left no test data.

## [0.6.0] - 2026-08-29

Promoted the guarded Gemini explanation review to signed-in production use with
an account-based allowance and automatic, non-authoritative review flow in
[pull request #41](https://github.com/jaredsrice/TrailPack/pull/41).

### Added

- Automatic guarded explanation review after a supported packing list and its
  weather context stabilize, plus a manual refresh control.
- A database-backed allowance of five live reviews per signed-in account during
  an hour-long window, claimed atomically across serverless workers.
- Explicit `sign-in-required` and `rate-limited` fallback outcomes with
  no-store, remaining-allowance, reset-time, and retry headers where applicable.

### Changed

- Expanded the encrypted `GEMINI_API_KEY` from Preview to Preview and Production
  after the abuse controls and live Preview review passed.
- Kept the rule-generated packing list, priorities, source labels, and missing
  details authoritative while presenting the AI result as an explanation-only
  review.
- OAuth sign-in now uses the exact origin-local `/auth/callback` URL so branch
  previews match the allow-list without depending on a query-string variant.

### Fixed

- Replaced an ambiguous `current_time` PL/pgSQL variable in the quota claim
  function with an unambiguous timestamp name after the first live claim exposed
  PostgreSQL's reserved-expression resolution.
- Preserved the deterministic fallback for signed-out, exhausted, unavailable,
  rejected, timed-out, malformed, and provider-error responses without spending
  a provider request when authentication or account allowance blocks it.

### Security

- The server derives the quota owner from the validated Supabase session; the
  browser cannot choose another user identifier.
- Direct table access is revoked from browser roles, row-level security is
  enabled, and the security-definer claim function exposes only a bounded
  authenticated operation.

### Verification

- Lint, type checking, 255 Vitest tests, four Firefox/axe flows, the optimized
  Production build, 27 recommendation stress scenarios, and the five-trail NPS
  integrity check passed.
- The protected Vercel Preview returned a live accepted `gemini-3.5-flash`
  review for Jenny Lake while the deterministic packing list remained
  unchanged.
- Production deployment `864Tp5oWS5LTzCL3DGscNfFUnd9R` reached Ready, completed
  OAuth through the exact Production callback, and returned the same accepted
  Jenny Lake review state with the rule-based list unchanged.
- The corrected Production quota function passed a transactional authenticated
  claim test and returned four remaining reviews without retaining test data.

## [0.5.0] - 2026-08-28

Delivered private saved plans, a sharper controllable park-photo experience,
protected automation, and the security-remediated application release as
commit
[`30f183c`](https://github.com/jaredsrice/TrailPack/commit/30f183cd32d5841c0cca4ace606c4498e1775ac5).

### Added

- Provider-managed Google sign-in, a fresh account chooser on every sign-in,
  sign-out, private save, fresh-session revisit, and owner-only deletion while
  the complete guest planner remains available.
- A row-level-security protected saved-plan table with a 64 KB database payload
  ceiling and a 100-result per-user quota that also apply to direct Supabase
  clients.
- Required pull-request validation and CodeQL workflows for lint, type checking,
  unit tests, accessibility checks, stress scenarios, build, static analysis,
  and Vercel deployment.
- A TrailPack application icon and global browser-security headers.
- Previous/next carousel controls, pause/resume, per-park slide selectors, and
  separate desktop/mobile focal points for the seven featured park photographs.

### Changed

- Replaced the smaller or poorly framed rotating images with high-resolution NPS
  originals and separated the Grand Teton rotation image from the Jenny Lake
  trail-specific scene.
- The monthly NPS refresh now commits a verified snapshot to an automation
  branch and opens a pull request instead of attempting a direct `main` push.
- Saved-plan input is rebuilt from an exact canonical schema before storage;
  list responses are capped at the most recent 100 rows.
- Updated Next.js to `15.5.24`, `eslint-config-next` to `15.5.24`, js-yaml to
  `4.3.1`, nanoid to `3.3.18`, PostCSS to `8.5.23`, Sharp to `0.35.3`, and both
  resolved brace-expansion lines to patched versions.
- Reframed public README and release text around product behavior rather than
  internal implementation tracking.

### Fixed

- Made the NPS refresh regression test use a stable historical fixture date so
  a passing live comparison cannot fail later because the calendar advanced.
- Bounded incoming request streams and Gemini response streams before buffering,
  including multibyte, missing-length, oversized, read-error, and cancellation
  behavior.
- Closed a callback open-redirect edge case involving backslash-prefixed paths
  and now require the resolved destination to remain on the request origin.
- Prevented unknown nested saved-plan fields from surviving validation and being
  written to JSONB.
- Added explicit owner-scoped delete-route coverage, including cross-user denial.
- Removed the production favicon `404`.

### Security

- Production now sends a Content Security Policy, permissions policy, strict
  referrer policy, frame denial, MIME-sniffing denial, and HSTS.
- Secret scanning and push protection report no open alerts; CodeQL reports no
  open alerts for the release commit; npm and Dependabot report zero open
  dependency vulnerabilities.
- An updated OWASP ZAP `2.17.0` passive-only scan found no critical or
  high-severity issue. Two medium CSP categories were accepted with compensating
  controls, and one public-static-asset CORS category was downgraded to
  informational after independent review.

### Verification

- Lint, type checking, 239 Vitest tests, three Firefox/axe flows, the production
  build, 27 recommendation stress scenarios, and the five-trail NPS integrity
  check passed locally and in required hosted checks.
- All seven production carousel images loaded without error at their tuned
  focal points on a high-density desktop display; the responsive mobile view had
  no horizontal overflow.
- The production database reported its payload constraint, quota trigger, and
  security-invoker function enabled after migration.
- Production sign-in, save, fresh-session revisit, owner delete, sign-out, and
  account chooser passed. A genuinely separate second identity then saw no User
  A rows, deleted zero User A rows under RLS, and User A confirmed the temporary
  acceptance result remained before removing it.

## [0.4.0] - 2026-07-29

Delivered the guarded-AI and field-guide milestone and deployed it to
production as commit
[`33fa471`](https://github.com/jaredsrice/TrailPack/commit/33fa471350608b4468714083a74f26334037cca6).

### Added

- A server-only Gemini review boundary with structured output, a bounded
  timeout, explicit provider outcomes, and deterministic fallback text.
- Date-aware Open-Meteo forecasts with four-highlight and full 24-hour views,
  apparent temperature, precipitation, conditions, wind, and a planned-start
  timeline.
- Sunrise, sunset, first-light, and last-light markers from
  Sunrise-Sunset.org.
- A national-park field-guide interface with locally served, officially sourced
  NPS photography, park/trail image locking, credits, and source links.
- A guarded monthly NPS source refresh for all five supported trails. Safe,
  confirmed changes can update one managed snapshot; ambiguous or unsafe
  results leave saved data untouched and fail visibly.
- Official NPS accessibility and terrain text for Jenny Lake, Taggart Lake, and
  String Lake when their tracked pages publish matching guidance.
- Firefox/Playwright/axe coverage for the chooser, Grand Teton park view,
  return-to-search focus, trail selection, and a populated Jenny Lake plan.

### Changed

- Supported trails now request live weather automatically and refresh when the
  planned date changes.
- All five trails now use the user-facing `Verified NPS + USGS profile` label;
  internal profile kinds remain only for milestone traceability.
- Packing, weather, alert, trail, trip-detail, and guarded-AI surfaces now use a
  quieter responsive field-guide design with stronger safety hierarchy.
- The Gemini integration now uses the Interactions API and the documented
  `gemini-3.5-flash` default.
- Safe dependency updates moved the resolved stack to Next.js `15.5.22`,
  Tailwind CSS `4.3.3`, its PostCSS path to `8.5.23`, and compatible patched
  transitive packages. Unsupported forced downgrades were rejected.
- Vitest now uses Vite 8's native `resolve.tsconfigPaths` support; the redundant
  `vite-tsconfig-paths` plugin was removed.

### Fixed

- Prevented saved AI fixture text from being reused after live weather changes
  the current rule-based packing set.
- Corrected low-contrast text treatments and duplicate landmark naming found by
  the first automated accessibility pass.
- Assigned loading priority to the currently visible park image rather than an
  inactive rotation layer.
- Prevented unsupported or unknown trail identifiers from being treated as
  valid saved scenarios.

### Security

- AI requests exclude unrestricted notes, identity data, OAuth data, and
  provider credentials; Gemini storage is disabled with `store: false`.
- Runtime schema, source-label, packing-set, cross-trail, missing-detail, and
  safety validation runs before AI text can be displayed.
- NPS refresh writes require two identical reads, HTTPS `nps.gov` identity
  checks, bounded values, a complete five-trail snapshot, and the full
  verification suite.

### Verification

- Lint, type checking, 205 Vitest tests, three Firefox/axe flows, the production
  build, and 27 recommendation stress scenarios passed.
- The initial live NPS refresh confirmed all five supported pages; a repeat run
  made no unnecessary write.
- Production homepage, weather, and both NPS alert routes returned HTTP `200`
  after deployment.

## [0.3.0] - 2026-07-20

Delivered the verified public-trail import milestone and deployed it as commit
[`d4cbbd7`](https://github.com/jaredsrice/TrailPack/commit/d4cbbd7f5dd33fa7c1c561ee86deac2fac239ac4).

### Added

- Colter Bay Lakeshore Trail and Two Ocean Lake Loop as verified Grand Teton
  profiles.
- Detailed provenance records containing official NPS source URLs, USGS feature
  identifiers, retrieval dates, confidence, missing fields, and reconciliation
  notes.
- Search, park-view, packing, saved-fixture, and weather support for the two
  imported trails.
- A 24-trail reliability study comparing authoritative sources, USGS evidence,
  and Nominatim identity results.
- Comparison-only AllTrails checks for the two new profiles without importing
  AllTrails values into TrailPack.

### Changed

- Adopted a Tetons-first manual NPS review plus USGS geometry-reconciliation
  workflow for new supported profiles.
- Rejected Nominatim as a production TrailPack source after unreliable identity
  and ranking results; its experimental runtime adapter and route were removed.
- Kept the newer NPS 400-foot Two Ocean Lake gain while visibly recording the
  conflicting older NPS 700-foot value and comparison-only AllTrails result.

### Verification

- Provider normalization, source IDs, search selection, catalog coverage,
  packing generation, fallback behavior, and production API paths passed.
- The production homepage and required Next.js assets were publicly reachable
  after merge.

## [0.2.0] - 2026-07-16

Completed the six-part product baseline and established the next product
roadmap at commit
[`c77158b`](https://github.com/jaredsrice/TrailPack/commit/c77158b580351024e43edba9388a4523f5c587f6).

### Added

- Taggart Lake and String Lake Loop alongside the original Jenny Lake Loop
  profile.
- Server-side Open-Meteo weather and NPS alert routes with deterministic saved
  fixtures and labeled unavailable states.
- Civil-twilight context and start-time-aware headlamp guidance.
- A fixture-first guarded AI review with validation and template fallback.
- Manual distance, gain, route-type, duration, and condition inputs for
  unsupported hikes.
- Critical-safety grouping, trip-decision alerts, question-answer packing
  explanations, and source-backed recommendation links.
- A repeatable hiker-scenario stress command covering seasoned, casual, and
  middle-of-the-road users.

### Changed

- Reorganized application code into the `src/features/trailpack/` feature
  module.
- Replaced generic packing cards with grouped accordion recommendations,
  visible priorities, clearer actions, expandable rationale, and
  alert-affected markers.
- Refined duration-aware water, food, reserve, navigation, battery, traction,
  electrolyte, dry-sock, sun, insect, and layer guidance.
- Preserved a complete guest and rule-based workflow when live context or AI is
  unavailable.

### Fixed

- Restored pre-dawn headlamp guidance when start time is provided without an
  expected duration.
- Prevented negated trail conditions and unrelated clauses from adding
  unnecessary gear.
- Strengthened official-source validation and blocked deceptive NPS look-alike
  URLs.
- Corrected duration parsing and scenario state leakage between trails.

### Verification

- The release passed unit, scenario, production-build, and browser verification
  across all six baseline capabilities.

## [0.1.0] - 2026-06-14

Initial tested TrailPack prototype.

### Added

- A Next.js, React, TypeScript, and Tailwind CSS application.
- Search for the supported Jenny Lake Loop profile with a manual-entry fallback.
- Official NPS facts displayed separately from USGS-computed comparisons.
- A deterministic essential and optional packing list using trail facts, saved
  weather, alerts, expected duration, and reported conditions.
- Trip date, duration, condition, and note inputs.
- Source links, confidence labels, and Vitest coverage for packing and
  provenance behavior.

### Changed

- Established NPS as the authority for official trail statistics and USGS as
  the public comparison/fallback source.
- Kept the NPS 1,040-foot Jenny Lake gain separate from the roughly 698-foot
  USGS method-dependent estimate.
- Limited production trail data to permission-compliant NPS and USGS sources.

### Fixed

- Correctly parsed mixed hour-and-minute durations and conservative duration
  ranges.
- Added deterministic snow, ice, mud, and wet-condition handling with
  clause-scoped negation.
- Required official packing and alert claims to include validated HTTPS NPS
  sources.

### Security

- Added source validation for official NPS links.
- Applied safe dependency updates without forcing incompatible framework
  changes.
