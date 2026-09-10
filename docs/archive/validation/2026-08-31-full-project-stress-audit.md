# Full Project Stress Audit

- Date: 2026-08-31 (America/Denver)
- Release verification: 2026-09-01 (America/Denver)
- Production version label: `0.6.1`; post-`0.6.1` hardening deployed
- Baseline commit: `604537f690807b39b5c72e8ccc117d6951618838`
- Candidate branch: `codex/full-project-stress-audit`
- Pull request: [#44](https://github.com/jaredsrice/TrailPack/pull/44)
- Merge commit: `40bb8c2c9448202631df8ef3f324ea8c82b72181`
- Production target: [trailpack-ten.vercel.app](https://trailpack-ten.vercel.app)
- Current gate: **RELEASED — local, hosted, Preview, merge, and Production gates
  passed**

The completed audit found no unresolved critical or high-severity issue.
Reproduced findings were fixed and retested except for one explicitly accepted,
bounded database-schema risk. The complete local matrix, required hosted checks,
signed-out Preview acceptance, protected merge, and Production smoke check all
completed successfully.

## Scope And Safety

This audit used the local TrailPack checkout, deterministic fixtures, mocked
providers, synthetic identities, and passive signed-out Production inspection.
It did not load-test Production, Gemini, NPS, Supabase, or Vercel.

- No interactive OAuth flow or real two-account check was rerun.
- No real saved result, quota claim, user row, or provider request was created
  for the stress workload.
- Production activity was limited to passive public response/header checks.
- No secret, token, email address, account identifier, saved-result identifier,
  provider prompt, raw provider response, or private database row is retained.
- Existing historical authentication and database evidence is identified as
  historical; it is not represented as newly rerun.
- OWASP ZAP was not installed in the local environment, so the passive scan was
  not rerun. The prior sanitized `2.17.0` result remains historical evidence.
- No coverage dependency or external scanner was installed.

The work hardens existing product behavior. It does not change the core product
scope: the deterministic engine remains authoritative, AI remains optional and
explanation-only, guest planning remains available, and saved results remain
owner-scoped.

## Executive Summary

The audit reproduced two user-impacting race/resource failures and identified
five adjacent reliability, security, and presentation defects:

1. Two synchronous Generate clicks could create two generation identifiers and
   issue two guarded-AI requests before React committed its loading state.
2. Some request/response readers could wait on a non-settling cancellation or
   buffer successful upstream/client bodies without a byte ceiling.
3. Weather and daylight requests could wait indefinitely, and provider values,
   timestamps, identifiers, text, or URLs were not bounded consistently.
4. The monthly NPS validation job ran repository scripts while holding the same
   write-capable permissions used to publish a pull request.
5. An aborted older AI request could interfere with a newer generation, and the
   browser had no explicit upper bound for that request lifecycle.
6. Four selected-trail photographs were too small for a crisp high-density
   desktop crop; reduced-motion and inactive-layer semantics were incomplete.
7. Unexpected authentication/exchange exceptions and unsafe stored URLs needed
   stricter fail-closed handling.

Focused and complete local regression checks are green. Pull request #44 passed
the protected repository and Preview gates, received owner approval, and merged
to `main` before the final signed-out Production verification.

## Baseline

The clean `main` baseline was measured before candidate changes.

| Check | Baseline result |
| --- | --- |
| Application version | `0.6.1` |
| Runtime | Node.js `24.14.0`; npm `11.9.0` |
| ESLint | Pass |
| TypeScript | Pass |
| Vitest | 30 files; 271 tests; 0 failures |
| Live NPS integrity | 5 of 5 supported sources passed |
| Recommendation matrix | 27 of 27 scenarios passed |
| Firefox/axe | 4 of 4 flows; 0 violations |
| Production build, `/` | 45.9 kB route; 215 kB first-load JavaScript |
| Production build, `/saved` | 7.9 kB route; 177 kB first-load JavaScript |
| Dependency audit | 0 vulnerabilities across 498 dependencies |
| GitHub security state | 0 open CodeQL, Dependabot, or secret-scanning alerts on the baseline |
| Working tree | Clean |

Passive Production inspection returned HTTP `200`, redirected HTTP to HTTPS
with `308`, and included CSP, two-year HSTS with subdomains and preload, frame
denial, MIME-sniffing denial, strict referrer policy, and permissions policy.

## Final Release Gate

| Check | Current evidence | Final-gate state |
| --- | --- | --- |
| ESLint | 0 failures | Pass |
| TypeScript | 0 errors | Pass |
| Full Vitest | 34 files; 354 tests; 0 failures | Pass |
| Focused API group | 12 files; 132 tests passed | Pass |
| Focused security group | 8 files; 54 tests passed, including the workflow permission regression | Pass |
| Fixed-seed system stress | 5,000 cases; 10,200 evaluations; 0 failures | Pass |
| Firefox/axe | 18 of 18 flows; 0 violations | Pass |
| Live NPS integrity | 5 of 5 supported sources unchanged | Pass |
| Recommendation matrix | 27 of 27 scenarios | Pass |
| Production build, `/` | 44.9 kB route; 218 kB first-load JavaScript | Pass |
| Production build, `/saved` | 4.88 kB route; 178 kB first-load JavaScript | Pass |
| Responsive photo review | Five selected trails at approximately 1280, 768, and 390 pixels; 0 broken images and 0 overflow | Pass |
| Fresh browser console | 0 relevant errors; 0 warnings after duplicate-priority fix | Pass |
| Hosted CI, CodeQL, Vercel | Validate, CodeQL Actions, CodeQL JavaScript/TypeScript, aggregate CodeQL, and Vercel completed | Pass |

Compared with the baseline, `/` route JavaScript decreased by about 2%, its
first-load JavaScript increased by about 1.4%, `/saved` route JavaScript
decreased by about 38%, and its first-load JavaScript increased by about 0.6%.
No measured JavaScript-size regression exceeds 10%.

## Preview, Merge, And Production Acceptance

- Final head commit `7ff4684` passed required GitHub checks and Vercel Preview.
- Signed-out Preview acceptance passed at desktop and 390-pixel widths with the
  correct page identity, meaningful content, no framework overlay, no relevant
  console warning or error, no horizontal overflow, and no broken visible image.
- The carousel image, accessible label, and official NPS credit advanced and
  returned together. Signed-out Jenny Lake generation produced the deterministic
  guest review without authentication.
- Owner review identified low-contrast context labels. Live weather and official
  NPS labels now use distinct blue and green treatments; fallback is amber,
  unavailable is neutral, and secondary context labels remain quieter. The
  deployed Preview was checked in both live and fallback states.
- Pull request #44 merged to protected `main` at 2026-09-01 21:41:56 UTC as
  `40bb8c2c9448202631df8ef3f324ea8c82b72181`.
- The merge commit's Vercel deployment completed successfully. Production
  returned HTTPS `200`, title `TrailPack`, meaningful application content, no
  error overlay, no relevant console warning or error, and no horizontal
  overflow. The immediate signed-out Jenny Lake check received labeled saved
  provider fallbacks and rendered the new amber state treatment correctly.
- No interactive OAuth, second-account, real quota, or saved-result operation
  was requested or rerun for this release acceptance.

## Findings, Fixes, And Retests

### STRESS-01 — Duplicate Generate race

- Severity: Medium
- Reproduction: dispatch two Generate clicks synchronously before React commits
  the first loading-state render. The pre-fix browser regression observed two
  AI route requests.
- Root cause: the button depended only on asynchronous React state. Both event
  handlers could see the old state and create independent generation IDs.
- Fix: claim the active generation synchronously through a ref before starting
  asynchronous review work; keep the existing rendered disabled state.
- Regression: the same double-click test now observes exactly one request.
- Retest: focused Playwright flow passed.

### STRESS-02 — Unbounded or non-settling body handling

- Severity: Medium
- Reproduction: provide an oversized stream whose `cancel()` rejects or never
  settles, or return an oversized successful provider/browser response.
- Root cause: cancellation was awaited after the result was already known, and
  several successful response paths called `text()` or `json()` before applying
  a meaningful limit.
- Fix: make cancellation best-effort and non-blocking after classification;
  reuse the byte-counting stream reader for AI, weather, alerts, daylight, and
  saved-result client/provider responses.
- Regression: exact boundaries, multibyte bytes, chunked bodies, declared
  oversize, malformed length, read errors, rejecting cancellation,
  never-settling cancellation, and oversized success/error streams are covered.
- Retest: focused API group passed 132 tests.

### STRESS-03 — External provider stall and contract widening

- Severity: Medium
- Reproduction: leave Open-Meteo, Sunrise-Sunset, or a browser weather/alert
  request unresolved; return impossible forecast times, out-of-range weather
  values, too many NPS alerts, oversized strings, unsafe source URLs, or
  conflicting trail and park identifiers.
- Root cause: NPS had a timeout, but the other providers did not share it;
  provider normalization accepted a broader range than the client contract.
- Fix: add bounded provider/browser aborts, finalized during owner review at
  five seconds for NPS and six seconds for the initial alert browser request.
  Weather and daylight retain eight-second provider budgets and a 20-second
  weather browser deadline. The fix also adds bounded response
  readers, 24-period weather and 10-alert NPS caps, 2,000-character provider
  strings, strict time/value checks, and credential-free HTTPS `nps.gov` URL
  validation.
- Regression: fake-timer provider tests and rendered stalled-request/stale-date
  flows pass alongside invalid and oversized normalization cases.
- Retest: focused provider/client tests and the complete browser suite passed.

### STRESS-04 — NPS automation permission coupling

- Severity: Medium
- Reproduction: inspect the previous monthly job: repository-controlled npm
  scripts and pull-request publishing shared one write-capable job token.
- Root cause: validation and publication were implemented as one trust boundary.
- Fix: validation now has read-only contents permission, disabled checkout
  credentials, and uploads only one validated JSON artifact. A separate
  write-scoped job downloads and applies that file without installing
  dependencies or executing repository code.
- Regression: a source-level workflow test requires the permission split, one
  write scope, current artifact actions, and absence of npm in the publisher.
- Retest: YAML parsing and the 54-test focused security group passed.

### STRESS-05 — Stale guarded-review lifecycle

- Severity: Low
- Reproduction: switch trails or reset while one review is in flight, then start
  a newer generation before the old promise settles.
- Root cause: request lifecycle ownership was represented only in component
  state, and the browser request had no independent timeout/abort controller.
- Fix: abort on reset and unmount, use a 30-second client timeout, and clear refs
  only when the completing request still owns the active generation.
- Regression: the stale-switch browser flow proves an older abort cannot unlock
  or clear the newer request.
- Retest: focused Playwright flow passed.

### STRESS-06 — Photo clarity, motion semantics, and duplicate priority

- Severity: Low
- Reproduction: inspect selected-trail assets against a 2x desktop target,
  enable reduced motion, inspect the accessibility tree, and load the initial
  carousel in development.
- Root cause: four assets were only 1,300 to 1,600 pixels wide; trail photos
  lacked explicit focal points; the hidden image retained alternative text; the
  reduced-motion control implied it could resume automatic motion; both initial
  layers referenced the same priority image.
- Fix: replace the four binaries with 2,600- or 3,200-pixel versions from the
  same official sources, set desktop/mobile focal points, hide inactive imagery
  from assistive technology, expose reduced motion as paused, enlarge the
  selectors, and initialize the back layer with a different photo.
- Regression: image-dimension/focal-point tests, reduced-motion and carousel
  browser flows, and distinct-initial-source assertion pass.
- Retest: all five selected trails were clear and centered at three widths;
  fresh console output contained no relevant error or warning.

### STRESS-07 — Fail-closed auth and stored-link handling

- Severity: Low
- Reproduction: make session validation or OAuth exchange throw; attempt a
  signed-out saved-result POST with a readable body; provide executable,
  insecure, credential-bearing, or control-character stored links.
- Root cause: rejected promises were not normalized consistently, POST parsed
  the body before authentication, and the saved contract accepted overly broad
  URL strings.
- Fix: authenticate before body consumption, catch dependency failures into
  generic responses, mark callback redirects `no-store`, and require safe HTTPS
  URLs without credentials/control characters.
- Regression: route, callback, and saved-contract cases cover each condition.
- Retest: focused security group passed.

### STRESS-08 — Direct saved-result JSON shape

- Severity: Medium, accepted for this candidate with compensating controls.
- Reproduction: an authenticated client can use the browser-facing Supabase API
  directly and insert owner-scoped JSON that does not match TrailPack's full
  nested saved-result contract.
- Root cause: row-level security enforces ownership, while the database check
  constrains aggregate payload size rather than every nested JSON key and type.
- Decision: defer a production schema/privilege migration until existing rows
  can be compatibility-checked. The current database still caps each row at
  64,000 bytes and each account at 100 rows; RLS prevents cross-user access;
  route writes are canonicalized; and malformed stored rows fail closed on read.
- Remaining exposure: a signed-in user can store at most bounded malformed data
  in their own rows through direct API access. This does not bypass ownership or
  expose another user's data, but it is not a full database-level shape check.

## API And Limit Matrix

Status meanings:

- **Pass — automated**: a focused current test exercises the behavior.
- **Pass — structural**: source/migration inspection proves configuration, but
  the current audit did not execute it against a database/provider.
- **Historical only**: prior sanitized evidence exists and was not rerun.
- **Pending**: evidence is incomplete and must not be counted as a final pass.

### Guarded AI review

| Boundary | Result | Evidence / limitation |
| --- | --- | --- |
| Empty/malformed JSON, unsupported shapes, unknown keys, invalid generation ID, oversized strings/arrays | Pass — automated | Route and strict runtime-contract tests return controlled errors before provider work. |
| 64,000-byte request | Pass — automated | Accepted. |
| 64,001-byte request | Pass — automated | Rejected with `413` before provider work. |
| UTF-8 bytes, chunked streams, malformed/declared-oversize `Content-Length`, read failure, cancellation rejection/non-settlement | Pass — automated | Shared reader counts bytes and terminates once classified. |
| Signed-out request claims/calls | Pass — automated | `401`; 0 provider calls. Mocked quota dependency receives no authenticated claim. |
| Quota-store exception/unavailable result | Pass — automated | Fails closed with `503`; 0 provider calls. |
| Five unique claims and remaining `4,3,2,1,0` | Pass — automated route model; database execution pending | The route test proves the exact sequence and five provider calls; current audit did not execute a real/test database sequence. |
| Sixth unique claim | Pass — automated at route/concurrency model | `429`, limit `5`, remaining `0`, bounded `Retry-After`, 0 provider calls. Exact database execution remains pending. |
| Duplicate generation | Pass — automated | `409`; remaining count unchanged by the mock; 0 additional provider calls. |
| Exact one-hour reset boundary | Pass — structural; historical live evidence only | Migration resets when `window_started_at + interval '1 hour' <= now()`. Not rerun against a database. |
| Concurrent unique claims at 1, 10, 25, 50 | Pass — automated model | Three runs each; success/429 counts were 1/0, 5/5, 5/20, and 5/45. |
| 50 concurrent retries of one UUID | Pass — automated model | Three runs each; 1 success, 49 duplicates, 1 provider call. |
| Accepted/rejected/missing key/network/408/429/500/504/timeout/malformed/schema mismatch/reordered/altered/missing/extra item outcomes | Pass — automated | All preserve the deterministic fallback or accepted explanation-only boundary. |
| Provider success response | Pass — automated | Exact 256,000-byte body accepted; oversized stream rejected/cancelled. |
| Provider diagnostic body | Pass — automated | Exactly 8,192 bytes is accepted for generic classification; 8,193 bytes is classified as oversized without leaking content. |
| Gemini timeout | Pass — automated | Default is 25 seconds; fake/short timeout test exercises abort without a real wait. |
| Browser AI timeout | Pass — automated browser lifecycle | 30 seconds, with reset/unmount cancellation. |
| `Cache-Control: no-store` | Pass — automated/source | Shared route response builder applies it; representative error/auth paths assert it. |
| Rule-based item set/order/priority/source labels | Pass — automated | Strict contract and guardrail tests reject any provider mutation. |

### NPS alerts

| Boundary | Result | Evidence / limitation |
| --- | --- | --- |
| Missing, malformed, unsupported, and conflicting trail/park IDs | Pass — automated | Route and resolver tests reject invalid or mismatched identifiers. |
| All five supported trails and `grte` | Pass — automated and live source check | The resolver enumerates every catalog trail to `grte`; the final integrity run found 5 of 5 unchanged. |
| Missing NPS key | Pass — automated | Returns a labeled unavailable state without a fetch. |
| Live zero alerts vs active alerts | Pass — automated | Both remain official/live and distinct from fallback. |
| `429`, `500`, malformed JSON, invalid fields, network failure | Pass — automated | Each named class has explicit generic fallback coverage without provider-body leakage. |
| Too many alerts / oversized strings | Pass — automated | Maximum 10 alerts and 2,000 characters per provider string. |
| Unsafe/unapproved source URL | Pass — automated | Only credential-free HTTPS `nps.gov` hosts survive normalization. |
| Oversized upstream response | Pass — automated | 128,000-byte provider ceiling; oversized response uses saved fallback. |
| Timeout | Pass — automated | Abort at 5 seconds and labeled saved fallback. |
| Stalled alerts leave Generate disabled | Pass — automated browser lifecycle | The initial stalled browser request is aborted at 6 seconds, renders the labeled fallback, and re-enables Generate; the server provider budget is 5 seconds. One background retry does not re-lock generation or mutate a generated list. |
| `Cache-Control: no-store` | Pass — automated | Success/unavailable and invalid route responses assert the header. |

### Weather and daylight

| Boundary | Result | Evidence / limitation |
| --- | --- | --- |
| Missing/unsupported trail, invalid or impossible date, unavailable context | Pass — automated | Controlled route errors; no provider work for invalid input. |
| Provider error, malformed/partial response, invalid values | Pass — automated | Falls back or rejects at the appropriate server/client boundary. |
| Forecast size | Pass — automated | Exactly 24 periods accepted; 25 rejected. |
| Value/time bounds | Pass — automated | Temperatures, precipitation, wind, weather code, dates, and local times are bounded. |
| Open-Meteo body/timeout | Pass — automated | 256,000-byte ceiling and 8-second abort. |
| Daylight body/timeout | Pass — automated | 32,000-byte ceiling and 8-second abort without discarding usable live weather. |
| Live/forecast/saved/unavailable labeling | Pass — automated | Parser and fallback helpers retain distinct source states. |
| Browser response ceiling | Pass — automated | 64,000 bytes; generic client error on overflow. |
| Older trail/date response cannot overwrite newer selection | Pass — automated browser lifecycle | A dedicated delayed-response test proves the older date cannot overwrite the newest selected date. |
| `Cache-Control: no-store` | Pass — automated | Success and error route cases assert it. |

### Saved results and database

| Boundary | Result | Evidence / limitation |
| --- | --- | --- |
| Signed-out `GET`, `POST`, `DELETE` | Pass — automated | Requests fail before table work; POST fails before reading its body. |
| Invalid JSON, malformed record, unknown nested fields, canonicalization | Pass — automated | Unknown nested data is removed or rejected according to the exact contract. |
| Direct database nested JSON shape | Accepted medium risk | Direct authenticated writes remain owner-scoped, 64 KB per row, and 100 rows per account, but the database does not enforce every nested application key/type. Route writes canonicalize and client reads fail closed. |
| 64,000-byte route request | Pass — automated | Accepted. |
| 64,001-byte route request | Pass — automated | `413` before database work. |
| Direct database 64 KB storage bound | Pass — structural; historical production evidence | Check constraint sums JSON/labels to at most 64,000 bytes; not rerun against a database in this audit. |
| Maximum 100 rows; 101st rejection | Pass — structural; historical production evidence | Serialized trigger and quota error exist; current 101-row execution not rerun. |
| Concurrent inserts cannot exceed 100 | Pass — structural only | Per-user transaction advisory lock is present; no current local/test Supabase concurrency run was available. |
| `GET` at most 100, newest first | Pass — automated/source | Owner filter, descending creation order, and `.limit(100)` are verified. |
| Malformed stored row | Pass — automated | Fails safely without widening the client model. |
| Invalid ID, missing row, owner delete, cross-user delete | Pass — automated | Synthetic route tests return bounded results and retain owner filters. |
| Synthetic User B list/delete visibility into User A | Pass — automated route/source; historical live only | Route filters and RLS policies are covered structurally; no real second account was used. |
| RLS, grants, trigger mode/search path/privileges | Pass — structural; historical production evidence | Migrations retain owner policies, quota trigger, invoker/definer modes, empty search paths, and bounded grants. |
| Browser list response ceiling | Pass — automated | 6,600,000 bytes, sufficient for at most 100 bounded records; oversized list is rejected generically. |
| Private route caching | Pass — automated/source | `no-store` is applied across GET/POST/DELETE responses. |

### OAuth callback

| Boundary | Result | Evidence / limitation |
| --- | --- | --- |
| Root/internal path/query/fragment | Pass — automated | Same-origin destination and existing values are preserved; `auth` is replaced. |
| Protocol-relative and backslash cross-origin values | Pass — automated | Rejected to the origin root. |
| Absolute HTTP/HTTPS and `javascript:` | Pass — automated | Rejected. |
| Encoded/double-encoded slash or backslash, control byte, Unicode separator | Pass — automated | Remains on the request origin as encoded path data. |
| Leading whitespace | Pass — automated | Rejected. |
| Missing code, provider rejection, thrown exchange, valid mocked exchange | Pass — automated | All redirect to a generic same-origin state. |
| Redirect caching | Pass — automated | `Cache-Control: no-store`. |
| Interactive OAuth | Not rerun interactively | Intentionally excluded; no user action required. |

## Deterministic Stress And Concurrency

The new `npm run stress:system` workload uses seed `1592639710` and mocks all
external context through bounded local fixtures.

| Metric | Result | Budget |
| --- | ---: | ---: |
| Cases | 5,000 | 5,000 |
| Evaluations, including warmup and repeat comparison | 10,200 | — |
| Supported trails | 5 | 5 |
| Invariant failures | 0 | 0 |
| Duration | 608.597 ms | — |
| Throughput | 8,215.613 cases/second | — |
| Latency p50 | 0.037 ms | — |
| Latency p95 | 0.053 ms | 25 ms maximum |
| Latency p99 | 0.088 ms | — |
| Maximum latency | 0.182 ms | — |
| Heap growth | 6,176,624 bytes | 134,217,728 bytes maximum |

Each case checks trail identity, non-empty essential and optional categories,
unique item names and alert IDs, unique missing-detail prompts, valid source
labels, HTTPS official links, non-empty copy, deterministic repeated decisions,
and explicit do-not-start language for closures.

The mocked route-concurrency harness passed three consecutive runs at each
level and records aggregate timing and memory evidence:

| Parallel unique requests | Total across 3 runs | Success | `429` | Provider calls | p95 | Maximum |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1 | 3 | 3 | 0 | 3 | 4.940 ms | 4.940 ms |
| 10 | 30 | 15 | 15 | 15 | 1.864 ms | 1.973 ms |
| 25 | 75 | 15 | 60 | 15 | 5.455 ms | 5.611 ms |
| 50 | 150 | 15 | 135 | 15 | 5.708 ms | 5.893 ms |

Across three 50-request same-generation runs, the harness recorded three
successes, 147 duplicates, three provider calls, 5.796 ms p95 latency, and
6.191 ms maximum latency. Its aggregate heap growth was 12,616,960 bytes,
below the 134,217,728-byte budget. No hung test, retained timer, unhandled
rejection, or non-settling stream remained; file descriptors were not
instrumented separately.

No coverage package is configured. Rather than install one without approval,
the audit records explicit decision coverage for parser bounds, auth outcomes,
quota outcomes, provider outcomes, saved-result ownership, redirects, and
rendered lifecycle races.

## Rendered UI, Accessibility, And Images

The browser checks use Firefox/Playwright/axe and mocked network outcomes where
volume or authentication would otherwise affect external systems.

| Area | Result |
| --- | --- |
| Load, chooser, park selection, trail selection, return-to-search | Pass |
| Populated guest plan and deterministic generation | Pass |
| Rapid edits before Generate | Pass; 0 AI requests |
| Generate | Pass; exactly one list and at most one AI request |
| Synchronous double click | Pass after reproduced failure; exactly one request |
| Edit after generation | Pass; existing list remains while Update becomes available |
| Trail switch during in-flight review | Pass; stale result cannot win or unlock a duplicate |
| Carousel next/previous/pause/select/automatic rotation | Pass |
| Reduced motion | Pass; automatic rotation disabled and status exposed as Paused |
| Inactive carousel image | Pass; removed from assistive technology |
| Selector target size | Pass; 32 by 44 CSS pixels |
| Five selected-trail photos at 1280/768/390 | Pass; clear, centered, correct subject/credit/source |
| Broken images | 0 |
| Horizontal overflow | 0 |
| Axe violations | 0 across the complete 18-flow run |
| Fresh relevant console errors/warnings | 0 / 0 |
| Rendered saved-result create/list/delete | Pending; route/client tests only, no authenticated browser session used |
| Accepted, duplicate, provider quota, account limit, generic failure, and stalled AI presentation | Pass; each has a rendered assertion and the rule-based list remains |
| Stalled alerts/weather and stale selected-date response | Pass; fallback unlocks Generate and older weather cannot win |

Temporary visual evidence was inspected outside the repository. No potentially
sensitive screenshot or browser state was added to the release record.

## Security And Operational Readiness

| Control | Result |
| --- | --- |
| CodeQL JavaScript/TypeScript and Actions | Required hosted analyses passed on pull request #44 |
| Dependency audit | Baseline `npm audit` returned 0 vulnerabilities across 498 dependencies; no dependency changed |
| Dependabot | 0 open alerts at audit baseline; no dependency changed in this release |
| Secret scanning/push protection | Enabled with 0 open alerts at baseline |
| Narrow credential-signature review | No match retained or reported |
| CSP | Present; existing bounded inline script/style allowances retain the prior documented medium-risk decision |
| HSTS | Source configuration now matches Production: two years, subdomains, preload |
| Frame/MIME/referrer/permissions headers | Present in passive Production check |
| HTTP to HTTPS | `308` redirect observed |
| Private and provider-route caching | `no-store` enforced |
| Open redirect | Encoded and raw cross-origin forms rejected in callback tests |
| IDOR/RLS | Owner filters and RLS/grants inspected; synthetic route denial passes; no live account used |
| SSRF | Upstream hosts are constants; NPS source links require credential-free HTTPS `nps.gov` |
| Oversized-body denial of service | Request/provider/browser byte ceilings and non-settling cancellation tests pass |
| Sensitive error/log leakage | Generic client errors and bounded provider-status logging tests pass |
| Monthly automation token | Read-only validation separated from isolated JSON-only publisher |
| Protected `main` | Baseline requires Validate, CodeQL Actions, CodeQL JavaScript/TypeScript, and Vercel |
| OWASP ZAP | Not rerun; scanner unavailable locally. Historical passive scan had no critical/high/low finding. |

The released change set has zero unresolved critical or high-severity findings. Every
reproduced medium finding has a code fix and current retest except the direct
saved-result JSON-shape gap documented in STRESS-08, which is accepted for this
release with explicit size, quota, ownership, canonicalization, and fail-safe
read controls. The existing accepted medium CSP decision is unchanged and
documented in the
[sanitized security review](2026-08-28-b04-cybersecurity-review.md).

## Required Scorecard

This scorecard distinguishes measured values from explicit manual-only
exclusions.

| Required metric | Current result |
| --- | --- |
| Lint failures | `0` in final local matrix |
| Type errors | `0` in final local matrix |
| Unit/integration failures | `0`; 354 tests across 34 files |
| Build failures | `0`; optimized Production build passed |
| Accessibility violations | `0` across 18 Firefox/axe flows |
| Relevant browser console errors | `0` |
| Relevant browser console warnings | `0` |
| Broken carousel/selected-trail images | `0` |
| Tested viewport overflow failures | `0` |
| NPS integrity | 5 of 5 unchanged in final release run |
| Deterministic existing scenarios | 27 of 27 in final release run |
| Added fixed-seed stress | 5,000 of 5,000 cases; 0 invariant failures |
| Signed-out quota claims | `0` in automated route model |
| Duplicate-generation extra claims | `0` in automated concurrency model |
| Duplicate-generation additional provider calls | `0` |
| Maximum unique AI claims per synthetic user/window | Exactly `5` in three-run concurrency model |
| Synthetic cross-user saved visibility/deletion | `0` in route/RLS model; live database not rerun |
| Saved rows per synthetic user | Structural ceiling `100`; 101st/current concurrency database execution pending |
| Stored payload | Route and structural database ceiling `64,000` bytes; live database boundary not rerun |
| API boundary matrix | All locally automatable named cases pass; database execution exclusions remain explicit |
| New concurrency tests | Three consecutive green runs |
| Unresolved critical/high findings | `0` |
| Unexplained performance/build regression over 10% | `0` in measured checkpoints |
| Secrets or personal identifiers in committed evidence | `0` |
| Interactive authentication required from the owner | `0` |

## Commands And Evidence Used

Baseline commands:

```text
npm run lint
npm run typecheck
npm test
npm run check:nps-integrity
npm run scenario:stress
npm run build
npm run test:a11y
git diff --check
npm audit --json
```

Candidate focused commands included:

```text
npm run lint
npm run typecheck
npm run stress:system
npx vitest run <focused API and security files>
npx playwright test <focused lifecycle and photo flows>
npm run build
git diff --check
```

The final candidate matrix executed:

```text
npm run lint
npm run typecheck
npm test
npm run check:nps-integrity
npm run scenario:stress
npm run stress:system
npm run build
npm run test:a11y
git diff --check
```

GitHub security-alert, branch-protection, workflow, merge, and Vercel status were
inspected read-only. Production checks were passive signed-out header/page and
rendered-page requests only. The complete local matrix, hosted pull-request
checks, Preview acceptance, protected merge, and Production smoke check are
recorded above.

## Tests Added Or Expanded

- AI route request limits, malformed metadata, stream errors, auth/quota failure,
  and repeated concurrency.
- AI strict input/output parsing, provider response size, network failure, and
  generic-error behavior.
- Shared stream-reader rejection and non-settlement behavior.
- Weather/daylight/NPS timeouts, body limits, field bounds, source URLs, and
  conflict validation.
- Saved-result authentication ordering, exact request boundaries, malformed
  stored rows, delete auth failure, safe URLs, and bounded browser responses.
- OAuth callback encoding, fragments, exchange failure, and no-store behavior.
- Generate double-click and stale-request browser races.
- Carousel reduced motion, automatic/manual synchronization, inactive-image
  accessibility, responsive focal points, intrinsic dimensions, and distinct
  initial sources.
- NPS workflow least-privilege boundary.
- Fixed-seed 5,000-case deterministic system stress, now included in CI.

## Remaining Risks And Manual-Only Exclusions

The following accepted or manual-only exclusions remain explicit:

1. Interactive OAuth and a new real two-account Production walkthrough were not
   rerun. The most recent historical production record remains 2026-08-28.
2. A local/test Supabase instance was not available. Exact five-claim reset,
   101st saved-row rejection, concurrent saved inserts, and direct REST/database
   bypass checks have current migration/source evidence but no new execution.
3. Direct authenticated Supabase writes are owner-scoped and bounded to 64 KB
   per row and 100 rows per account, but the database does not enforce the full
   nested saved-result JSON shape. The risk decision and compensating controls
   are documented in STRESS-08.
4. File-descriptor growth was not instrumented separately. The deterministic
   workload and mocked API concurrency harness record latency and heap growth,
   and all completion/non-settling cases pass.
5. OWASP ZAP was not rerun because no scanner was already available and adding
   one requires approval. The historical passive result is not treated as a new
   pass.
## Release Result

The candidate satisfied the documented ship criteria, merged through protected
pull request #44, and passed the final Production smoke check. No release action
remains. Future work is limited to normal monitoring and the manual-only risks
listed above; none was represented as newly executed during this release.
