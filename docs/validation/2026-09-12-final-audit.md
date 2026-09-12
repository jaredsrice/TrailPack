# Final 499B audit and acceptance

Date: September 12, 2026. Status: approved implementation and verification scope
complete on the test candidate. Production publication is not approved.
Candidate branch: `codex/required-completion`. Production remains on the
previous release until Jared approves publication.

## Scope

The [499B specification](../archive/project/specs/2026-07-16-cse-499b-requirements.md)
is the completion authority. It preserves the six baseline requirements and
adds public lookup, guarded live AI, private saved plans, and security testing.
Its AI addendum allows explanation-only use. No packing-list variants, guest
export, map, new trail-selection design, or custom route builder are included.

Proposal v9 is still the latest proposal. Its earlier optional lookup and
prototype milestones were superseded by the 499B requirements. This pass
supports the proposal's testing, scope freeze, demo and documentation milestones;
it does not claim that coursework, hours or the final presentation were submitted.

## Necessary changes

| Area | Decision and reason | Verification |
|---|---|---|
| AI request and saved-plan uploads | Add a body-read deadline so incomplete uploads cannot keep handlers waiting indefinitely | Stalled-stream tests fail before the fix and pass afterward; root independently retested both handlers |
| NPS page requests | Validate each redirect before following it, limit the chain, and use one deadline for headers and body | External redirect, valid relative redirect, loop limit, cancellation, size and provenance tests |
| Open Canyon maintenance | Use the reviewed official `home.nps.gov` delivery address for the two exact saved profiles; keep their canonical source identity | Live comparison passed 50/50 unchanged; managed snapshots were not edited |
| Alert response validation | Treat malformed envelopes as unavailable, not official no-alert results | Invalid shape/count/record/park tests and valid empty-response test |
| Provider failure cleanup | Release failed daylight and alert response bodies | Cancellation, rejected cancellation and non-settling cancellation tests |
| Dated weather | Keep observations from today out of future plans and match the requested forecast date | Date mismatch, multi-day and conflicting-current-weather regression tests |
| Account interface | Settle failed auth checks, show sign-in/sign-out errors, and explain OAuth returns without treating a query parameter as authenticated identity; keep the homepage static | Rendered Firefox error and account-flow tests |
| Saved-plan table grants | Remove unused authenticated TRUNCATE, REFERENCES and TRIGGER rights with explicit approval | Embedded PostgreSQL proves normal owner operations and cross-user denial; hosted permission readback confirms only SELECT/INSERT/DELETE |
| Live lookup interface | Preserve the invalid-response state for malformed or oversized replies | Rendered Firefox regression tests |

## What stays as it is

- Keep the catalog compiler and complete route identities. Their shared use in
  packing, weather and saves is covered by cross-consumer tests.
- Keep the rule engine. No incorrect rule or measured performance problem
  justified rewriting it. Provider-data repairs belong at the provider input.
- Keep the main planning screen. Its size alone is not a reason to split its
  tightly related selection, generation and reset state during closeout.
- Keep server-validated identity, row-level security, per-user AI quotas,
  approved AI highlight IDs and the fail-closed guest lookup budget.
- Defer pagination beyond the current 100-save limit, speculative concurrency
  changes and legacy naming cleanup. None is needed for 499B completion.

## Hosted setup

Preview and Production share Supabase. The reviewed lookup quota migration was
already applied with Jared's approval; it must not be replayed. Historical
migration bookkeeping was compared with the actual schema before repair.
No saved user data was needed for that check.

The independent schema comparison found the cumulative effects of all five
older migrations already present. Function bodies, default arguments, enabled
trigger, policies, indexes, columns and ordinary constraints match. Different
NOT NULL catalog representations between PostgreSQL versions were checked
against matching column nullability. The five versions were recorded as applied
without rerunning their SQL. A new, separately approved migration revoked only
the three unused saved-table privileges. Hosted readback confirms normal owner
permissions, anonymous denial and an enabled quota trigger. All seven migration
versions are recorded; a full-directory dry-run reports no pending changes.

No private saved records were inspected or changed during this reconciliation.

The first Google test returned to production because the candidate's callback
was absent from the allowed list. Jared approved adding exactly:

`https://trailpack-git-codex-required-completion-jared-s-rice.vercel.app/auth/callback`

The configuration diff showed one declared property change. The update kept
all three previous callbacks and all other settings. Readback showed no remaining
declared difference. This is not production website publication.

## Final acceptance gate

Local checkpoint: clean production build passed with a static homepage and
179 kB first load; TypeScript, 895 tests across 61 files, lint and documentation
links pass. Catalog checks passed for 52 profiles. Fixed-seed stress passed
5,000 cases with no invariant failures and 0.053 ms p95. The NPS comparison
passed 50/50 unchanged. One overlapping build/browser run was discarded after
it disrupted generated server files; only the subsequent isolated run counts.

Final isolated Firefox run: **151 passed, zero failed, skipped or retried**,
one worker, 4.6 minutes. It includes rendered account failures and the synthetic
save/revisit/delete lifecycle, partial lookup, catalog access variants,
accessibility, mobile layouts, provider failures and stale AI/weather state.

- [x] Freeze and record the exact candidate commit and Preview deployment.
- [x] Pass lint, documentation links, types, unit tests, catalog checks,
  scenarios, stress checks, production build and full Firefox suite.
- [x] Confirm live lookup and one accepted signed-in Gemini review on that Preview.
- [x] Check sign-in, save, revisit, delete and sign-out on the same Preview.
- [x] Finish current static analysis, dependency/secret checks, independent review,
  passive deployed checks and the sanitized security summary.
- [x] Update the README, changelog, requirements status, demo notes and handoff.

Historical two-account privacy and owner acceptance remain dated evidence, not
newly repeated tests. Local mocks and embedded PostgreSQL do not prove live
provider or deployed account behavior.

## Exact hosted candidate

Runtime commit: `0ba17a7a8295af86eff05c6a16d8d59c08adea2f`.
[Review PR #61](https://github.com/jaredsrice/TrailPack/pull/61).
Deployment: `dpl_3peAT8xGbir2rz5mKYpFqEkN7xsf`, Preview, READY.
[Immutable test website](https://trailpack-h2ea5k6xh-jared-s-rice.vercel.app).
Google sign-in uses the
[stable test address](https://trailpack-git-codex-required-completion-jared-s-rice.vercel.app).
The stable alias was independently checked against that deployment.

Hosted lookup returned the official Fairyland Loop record, its 4–5 hour NPS
duration and a five-hour planning seed. Distance, elevation and route type
remained unknown. A nonsense search returned an empty result; invalid method
and content type returned 405 and 415. A Grand Teton alert request returned
three valid live official notices. Only two provider-possible lookup requests
and one alert request were used for these checks.

Native Firefox showed a server-validated signed-in account and two accepted
Phelps Lake Loop reviews with `gemini-3.5-flash`. Request metadata confirms
both AI requests returned 200. The displayed explanations came from approved
highlights and left the packing list unchanged. Editing a note made Update
available without starting another review; clicking Update requested the second
review. No tokens, account identity or raw provider payloads are included here.

The refreshed candidate received another accepted signed-in review in native
Firefox. It identified Phelps Lake Loop as a 6.4-mile moderate loop with 1,060
feet of gain, treated the route as a sustained half-day effort, calculated a
1:00–5:00 PM planning window, connected the cold forecast to clothing, and told
the hiker to confirm active park notices before driving. It then stated that the
profile was complete and needed no additional planning details. The packing list
remained rule-owned and unchanged. Incomplete profiles instead show one visible
"Best next step." The provider still selects only approved fact IDs, and the
display is capped at three approved highlights.

The new private plan saved with HTTP 201. Its first library request returned
500 and a visible error; one normal reload returned 200 and displayed both the
new plan and an older plan. The saved packing list reopened correctly. No code
or data changed between those two reads. The cause of that one failed request
is unconfirmed; a transient database query failure is a hypothesis, not a
diagnosis. Do not claim the hosted walkthrough was error-free or weaken the
saved-record parser based on this incident.

Jared explicitly approved deleting both displayed plans. Both DELETE requests
returned 204, and Firefox showed the empty library. The temporary Phelps plan
and older Jenny plan were permanently removed; TrailPack has no restore action.
Sign-out then returned the account controls to Google sign-in. Updating a plan
while signed out produced a new **Guest review ready** result. A third accepted
live review occurred when generating the plan needed to expose sign-out controls;
the first two remain the recorded provider-acceptance checks above.

The earlier [full CI run passed](https://github.com/jaredsrice/TrailPack/actions/runs/34683963217)
with 887 unit/integration tests, the NPS comparison, build and all 151 Firefox
tests. Two refreshed-candidate CI attempts stopped when the NPS site returned a
valid 200 page shell with neither Open Canyon route; each attempt failed on a
different route from the same official page, while immediate local reads passed
50/50 unchanged. Repeated diagnostics reproduced a short shell among complete
responses. The checker now retries one parser-rejected fetch. Changed facts still
fail review, and the final local comparison passed 50/50 unchanged.

The [refreshed full CI run passed](https://github.com/jaredsrice/TrailPack/actions/runs/34716374761)
on the repaired runtime commit with 895 tests, 50/50 NPS sources, deterministic
and fixed-seed stress checks, generated-evidence verification, the production
build and all 151 Firefox flows.

Both CodeQL analyses passed on the refreshed runtime commit. The bounded passive scan
and its retained warnings are recorded in the
[security review](2026-09-12-security-review.md).

Final evidence updates change documentation only. The runtime, dependencies,
configuration and database migration bytes remain identical to the verified
runtime commit. Keep that evidence lineage explicit rather than claiming a
new provider or security run for every documentation-only commit.

## Handoff

No further feature or refactor work is required by this approved pass. The
remaining decision is Jared's review and separate authorization to merge and
publish production. The one recovered saved-library failure and retained CSP
limitations stay visible. Academic submissions and presentation delivery remain
owner-managed and are not claimed complete here.
