# Changelog

All notable TrailPack changes are recorded here. The format follows
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses
[Semantic Versioning](https://semver.org/spec/v2.0.0.html).

TrailPack is still a `0.x` prototype. A minor version marks a completed,
demo-ready product milestone; a patch version is reserved for backward-compatible
corrections within that milestone.

## [Unreleased]

No unreleased product changes.

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
  internal course milestones.

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
  account chooser passed. The final separate-second-identity denial walkthrough
  remains an acceptance item before the private-save tracking issue closes.

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
