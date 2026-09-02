# Performance And Code-Efficiency Audit

- Baseline recorded: 2026-09-01 (America/Denver)
- Final local validation: 2026-09-02 (America/Denver)
- Baseline commit: `aa15833`
- Candidate branch: `codex/performance-code-efficiency-audit`
- Production baseline: [trailpack-ten.vercel.app](https://trailpack-ten.vercel.app/)
- Current gate: **LOCAL PASS — hosted checks and Preview acceptance pending**
- Merge policy: explicit owner approval required; do not merge automatically

## Result

Two confirmed startup costs were removed: an invisible second park photograph
and eagerly bundled save/authentication code. The same optimized-build command
now reports 149 kB of homepage first-load JavaScript instead of 218 kB, a 31.7%
reduction. The initial page requests one image instead of two. Photo quality,
crop positions, credits, packing decisions, provider freshness, authentication,
quota behavior, and safety fallbacks are unchanged.

The packing engine is not the observed bottleneck. It remained below 0.06 ms
p95 in the bounded 5,000-case runs. Live provider waiting was the slowest
observed planning step, while repeated local mocked Generate/Update and
disclosure interactions completed well below 200 ms. Network timing and local
computation are reported separately below.

## Scope And Safety

- Work used only the active local TrailPack checkout, not the obsolete OneDrive
  code location. The starting branch and working tree were clean.
- No authentication, OAuth flow, second account, real Gemini review, saved
  result, database write, or quota-consuming workload was required.
- Production inspection was limited to a few passive signed-out page loads and
  one normal trail-selection/generation pass per viewport. Repeated interaction
  and concurrency workloads used local fixtures and mocked APIs.
- No production or third-party load test, new dependency, schema migration,
  cache-policy change, or security relaxation was introduced.
- Runtime: Node.js 24.14.0; npm 11.9.0; Next.js 15.5.24. Measurements use an
  optimized production build, not development-server timing.
- The active product specification, closeout schedule, and Proposal v9 pages
  4–5 were compared with the implementation. This is hardening of existing
  planning, explanation, uncertainty, and guest behavior; no scope expansion
  or new product milestone is implied.

## Measurement Method

The in-app Browser was used for rendered baseline inspection. Its baseline
evaluation surface did not expose the Performance API, so the repository's
already-installed Playwright Firefox was used for navigation, resource, LCP,
and event timing. No browser or benchmark package was installed.

- Desktop: 1440 × 900. Mobile: 390 × 844. Both are desktop-machine Firefox
  viewports, not a physical mobile device or CPU/network-throttled simulation.
- Two initial cold page runs per viewport preceded edits. Two supplemental
  passive runs against the unchanged Production build added supported LCP
  observations on September 2. Every cold run used a fresh browser context.
- Three local candidate runs per viewport measured cold navigation, a warm
  reload, carousel navigation, trail selection, Generate, Update, and the
  packing/forecast/review disclosures.
- Warm reloads were measured before route interception, because request
  interception disables the browser cache. Repeated interactions then used
  fixture weather, a successful empty live-alert response, and a mocked
  signed-out AI response. External hosts were blocked during those interactions.
- Timing tables report median / worst observed. Click-to-ready measurements
  include browser actionability and automation overhead; they are not field
  INP. Event Timing entries and two-animation-frame responses were also checked
  independently.
- Transfer totals below are resource transfers, including the browser's small
  per-response overhead, but excluding the HTML document. Compression differs
  between the local server and Vercel, so local byte totals are not substituted
  for a hosted before/after speed claim.

## Baseline And Candidate Downloads

| Measure | Unchanged Production baseline | Local candidate | Interpretation |
| --- | ---: | ---: | --- |
| Optimized homepage first-load JavaScript | 218 kB | 149 kB | Same build settings; 31.7% smaller |
| Homepage route size | 44.9 kB | 46.3 kB | Small loader/readiness overhead; total first load is smaller |
| `/saved` first-load JavaScript | 178 kB | 178 kB | Optional account code still exists where needed |
| Initial resource requests | 15 | 11 | One image and three script requests deferred |
| Desktop resource transfer | 938,147 B | 530,688 B | Hosted comparison remains pending |
| Mobile resource transfer | 501,273 B | 329,998 B | Hosted comparison remains pending |
| Script-initiated transfer | 224,013 B | 149,339 B | Excludes the small preloaded runtime chunk |
| Initial desktop image transfer | 628,704 B | 296,984 B | Invisible 331,720 B photo removed from startup |
| Initial mobile image transfer | 191,830 B | 96,294 B | Invisible 95,536 B photo removed from startup |
| Font transfer | 67,680 B | 67,680 B | Two local fonts; unchanged |
| CSS transfer | 14,778 B | 13,886 B | Same stylesheet; different host compression |

Production responses were CDN cache hits, and the HTML used Brotli. The baseline
therefore does not demonstrate a serverless cold-start problem. Optimized image
URLs, quality 90, responsive sizes, original assets, and focal points remain
unchanged. No more aggressive compression was used to obtain the image saving.

## Navigation Timing

The following columns deliberately identify different environments; local
timings are not presented as a percentage improvement over Production.

| Metric, median / worst | Production desktop | Production mobile | Local candidate desktop | Local candidate mobile |
| --- | ---: | ---: | ---: | ---: |
| TTFB | 226 / 279 ms | 396 / 452 ms | 3 / 7 ms | 2 / 3 ms |
| FCP, cold | 596 / 817 ms | 868 / 944 ms | 40 / 107 ms | 39 / 40 ms |
| LCP, cold | 652 / 817 ms | 1,062 / 1,180 ms | 40 / 107 ms | 39 / 40 ms |
| LCP, warm | Not sampled | Not sampled | 23 / 24 ms | 22 / 23 ms |
| Load event, cold | 714 / 941 ms | 1,062 / 1,173 ms | 41 / 112 ms | 43 / 45 ms |

The hero image was the LCP element. Local warm reloads transferred zero resource
bytes from the immutable asset cache; the HTML was still revalidated. All
observed LCP values were below the 2.5-second guidance, but this small unthrottled
sample does not establish real-user percentile compliance.

### Hosted candidate comparison

Pending the first Vercel Preview. Repeat the same cold probe against that exact
candidate and record its URL, current head, cache state, and median/worst timings
before treating the release gate as complete.

## Planning And Interaction Timing

One baseline signed-out live pass per viewport found:

| Step | Desktop | Mobile | Attribution |
| --- | ---: | ---: | --- |
| Trail selection until Generate enabled | 2,394 ms | 1,360 ms | Weather/alerts plus network and UI readiness |
| Generate until the deterministic list rendered | 299 ms | 283 ms | Browser-observed end-to-end path, not engine CPU time |

Both live sources succeeded during those baseline passes. Repeated final local
fixture runs isolate the UI from provider variability:

| Step, median / worst | Desktop | Mobile |
| --- | ---: | ---: |
| Next photo selected and decoded | 77 / 81 ms | 60 / 125 ms |
| Trail profile visible | 53 / 61 ms | 62 / 64 ms |
| Trail selection until Generate enabled | 68 / 75 ms | 78 / 123 ms |
| Generate until list and guest review visible | 91 / 95 ms | 79 / 85 ms |
| Update until guest review visible | 48 / 54 ms | 50 / 51 ms |
| Packing detail expansion | 21 / 29 ms | 22 / 34 ms |
| Forecast expansion | 35 / 37 ms | 29 / 35 ms |
| Optional review expansion | 27 / 27 ms | 34 / 37 ms |

All final mocked click-to-ready observations were below 200 ms. Across the six
runs, maximum Event Timing duration was 32 ms, maximum event processing was
20 ms, and maximum input delay
was 1 ms. This is bounded lab evidence, not a claim of a measured field INP.

Each run made exactly one weather request, one alert request, and two mocked
review requests: one for Generate and one for Update. Editing duration did not
issue a review. Three optional account chunks appeared only after generation.
Alert summaries render with the list; there is no alert-expansion control to
time. Every run had zero application console warnings/errors, broken images,
or horizontal overflow.

## Ranked Findings And Decisions

| ID | Problem and evidence | Impact / confidence / risk | Decision |
| --- | --- | --- | --- |
| PERF-01 | An invisible back-layer photograph downloaded on initial navigation: 331,720 B desktop or 95,536 B mobile. | High startup cost; directly reproduced; low change risk | Fixed: create the back layer only on the first transition. |
| PERF-02 | A static save-controls import pulled Supabase and account code into the signed-out chooser before any list existed. | Medium startup/parse cost; bundle and network evidence; low change risk | Fixed: defer the existing cohesive save-controls module until it renders. |
| PERF-04 | With a delayed replacement image, the old photo and credit switched before the new image loaded. The new held-response browser test reproduced the failure. | Visible slow-network regression risk; directly reproduced; bounded change risk | Fixed: stage the replacement behind the current image, switch only when ready, and ignore canceled pending selections. |
| DOC-01 | Two NPS rows and the fix description in the prior audit still said 8/12-second budgets, while final source uses 5/6 seconds. | Maintainability/correctness; exact source comparison; low risk | Corrected the historical final-gate record; no timeout code changed. |
| PERF-03 | Live provider readiness was slower than local rendering. Weather and daylight may execute serially. | Visible network wait; high confidence; changing policy has safety/freshness risk | Retain bounded behavior; document below. No speculative caching or timeout reduction. |
| CODE-01 | The 971-line planner shell owns several request lifecycles; the packing module is roughly 2,200 lines. | Maintainability debt; no measured compute bottleneck; broad extraction has moderate regression risk | Defer a lifecycle-hook extraction to a focused change with dedicated contract tests. Do not split the cohesive rule engine by line count. |

### Why the two code changes are cleaner

1. **Carousel:** the previous state held a real hidden image even when it had no
   display purpose. A nullable back layer now models the actual initial state,
   and per-layer readiness keeps the currently displayed photo authoritative
   until its replacement loads. It removes startup fetching/decoding, not just
   lines of code. The risk is a first-transition or credit mismatch; tests assert
   one initial layer, then two distinct layers after navigation, sharpness,
   correct credits, previous/next behavior, automatic rotation, and reduced
   motion. A held-image regression failed before the readiness guard and now
   passes, including canceled selections and reuse of an already-loaded layer.
2. **Save controls:** the existing component already owns account/save behavior.
   A standard dynamic import preserves that interface while removing eager
   ownership from the chooser bundle. No new wrapper, dependency, duplicated
   state, or generalized abstraction was added. The risk is a delayed optional
   section on first generation; all guest flows pass and the network trace shows
   the deferred chunks arriving when needed. Real account behavior was not
   interactively rerun, and its underlying code is unchanged.

## Code-Efficiency Review

### Runtime and boundaries

- Weather and NPS start independently; no serial dependency between them was
  found. Packing generation stays behind explicit Generate/Update events.
- Request ownership, abort-on-reset/trail-change behavior, stale-result checks,
  synchronous generation guards, and generation-ID idempotency are covered by
  current tests. Repeated mocked passes found no duplicate initial API work.
- Bounded response readers are already shared across trust boundaries. Client,
  server, and saved-snapshot validation overlap intentionally because each
  receives untrusted input; merging them solely to reduce duplication would
  weaken those boundaries.
- The current catalog is five trails, forecast payloads are at most 24 periods,
  alerts are capped at 10, and stored lists at 100 rows. No measured loop,
  sorting, allocation, or derived-state hotspot justified a data-structure
  rewrite or extra memoization.
- The interactive planner remains a client component. Moving it wholesale to
  the server would not remove its stateful interaction requirements; the proven
  boundary improvement is deferring optional account code.

### Maintainability and dead code

- Call-site and import inspection did not prove an unused direct dependency or
  dead feature path worth removing. No dependency, public export, or safety
  branch was deleted on an assumption.
- Large modules were reviewed by responsibility, not line count. The optional
  account module now has a better loading boundary. Broader shell extraction,
  provider-policy centralization, and changing the rule-engine structure remain
  separate proposals, not unmeasured performance fixes.
- Timeout values at the provider and browser layers are deliberately different
  budgets. They must not be collapsed into one constant merely because both
  represent timeouts.
- The prior audit's stale NPS budget text was corrected. Its historical
  distinct-photo startup description is retained as a record of that release;
  this audit supersedes its loading strategy.

### Test quality

- The existing browser regression was strengthened instead of adding a
  duplicate scenario: one initial image layer, correct first transition, and
  two distinct layers thereafter.
- One additional delayed-image scenario protects the loading boundary and
  verifies that a canceled pending image cannot replace the current selection.
- Existing fixture helpers, quota models, and fake timers were reused. Slow,
  timeout, retry, malformed-response, stale-date, and duplicate-generation
  tests do not require long real waits or third-party load.
- No test-suite rewrite or new benchmark dependency was justified. Temporary
  audit probes reported local Node module-format and test-runner color warnings;
  neither was an application-browser console warning and neither warranted a
  package-wide module-format change.

## Provider Budgets And Persistence

| Boundary | Current source behavior | Audit decision |
| --- | --- | --- |
| Open-Meteo | 8-second provider budget | Unchanged |
| Daylight lookup | Separate 8-second provider budget; may follow weather normalization | Unchanged; worst-case serial wait is bounded by the browser deadline |
| Weather browser request | 20-second deadline | Unchanged; fake-timer browser regression confirms fallback unlocks Generate |
| NPS provider / initial browser request | 5 / 6 seconds | Unchanged; fallback does not evaluate saved demo alerts as current |
| NPS retry | One retry after 1.5 seconds, with a separate 6-second browser budget | Does not re-lock Generate; late live data requires explicit Update |
| AI provider / browser | 25 / 30 seconds | Rule-based output remains available; no live AI was consumed |
| External route caching | `no-store` for live planning context | No stale-context cache introduced to mask latency |

Supabase/persistence was inspected from source and migrations only:

- Saved-list reads filter by authenticated `user_id`, order by `created_at`
  descending, and limit results to 100. The existing composite index
  `(user_id, created_at desc)` matches this query.
- RLS uses `(select auth.uid()) = user_id`; ownership and query shape already
  align. Writes authenticate before body consumption, enforce 64,000-byte
  snapshots, and retain a per-user 100-row database cap.
- AI allowance claims use a per-user advisory lock and generation-ID dedupe.
  No additional database round trip or index was shown to be a bottleneck.
- No schema/index change is recommended by this evidence. Real query plans,
  account isolation, and database performance were not executed in this audit.
  The prior accepted bounded direct-JSON shape risk remains documented in the
  [full stress audit](2026-08-31-full-project-stress-audit.md#stress-08--direct-saved-result-json-shape).

## Computation And Full Local Gate

| Fixed-seed metric | Baseline | Final |
| --- | ---: | ---: |
| Cases / evaluations | 5,000 / 10,200 | 5,000 / 10,200 |
| Invariant failures | 0 | 0 |
| Packing p50 / p95 / p99 / max | 0.034 / 0.044 / 0.056 / 0.215 ms | 0.038 / 0.053 / 0.096 / 0.236 ms |
| Packing heap growth | 7,803,312 B | 8,782,880 B |
| Mocked 50-unique-request p95 | 5.437 ms | 6.299 ms |
| Final aggregate mocked API heap growth | — | 12,063,608 B |

The calculation/API code did not change. These small absolute variations are
reported honestly rather than called a speedup. All established latency, heap,
determinism, and quota-invariant budgets passed. At 50 unique requests, each of
three runs allowed only five successes; 50 retries of one generation produced
one success, 49 duplicates, and one mocked provider call per run.

| Check | Result |
| --- | --- |
| ESLint | Pass |
| TypeScript | Pass |
| Full Vitest | 34 files, 354 tests passed |
| Focused image-data tests | 6 passed |
| Recommendation matrix | 27 scenarios passed |
| Fixed-seed system stress | 5,000 cases, zero invariant failures |
| Firefox/axe | 19 flows passed; zero automated violations |
| Optimized production build | Pass; homepage first-load JavaScript 149 kB |
| Mocked desktop/mobile performance journeys | 6 passed; zero broken images, overflow, or application console issues |
| `git diff --check` | Pass |
| Required hosted checks and exact Preview | Pending |

## Files And Remaining Limits

- `ParkPhotoShowcase.tsx`: avoid creating/downloading an unused initial layer.
- `TrailPackShell.tsx`: defer the existing optional account/save component.
- `trailpack-accessibility.spec.ts`: enforce the new initial-layer invariant and
  retain post-transition quality/synchronization coverage.
- `README.md` and `CHANGELOG.md`: explain pending startup improvements without
  claiming a production deployment.
- This validation record: measurements, scope, decisions, regressions, and
  release gate. The prior stress record only corrects its stale final NPS budget.

Firefox exposed LCP and Event Timing but not `layout-shift` or `longtask`
entries. Therefore CLS and long-task totals are **not measured**, and absence of
those entries is not a pass. No physical low-end mobile profile, field p75
Core Web Vitals, React commit-count profiler, sustained browser heap/leak test,
database query plan, or cold serverless experiment was performed. No speculative
render-count or memory improvement is claimed.

The next gate is the exact hosted Preview at desktop and 390 pixels, followed by
an owner review. The code remains a merge candidate only; Production and the
protected main branch are unchanged by this audit.
