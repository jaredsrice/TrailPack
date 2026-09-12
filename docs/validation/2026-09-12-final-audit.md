# Final 499B audit and acceptance

Date: September 12, 2026. Status: final checks in progress, not a release claim.
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
migration bookkeeping is being compared with the actual schema before any
repair. No saved user data is needed for that check.

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
179 kB first load; TypeScript, 887 tests across 61 files, lint and documentation
links pass. Catalog checks passed for 52 profiles. Fixed-seed stress passed
5,000 cases with no invariant failures and 0.053 ms p95. The NPS comparison
passed 50/50 unchanged. One overlapping build/browser run was discarded after
it disrupted generated server files; only the subsequent isolated run counts.

Final isolated Firefox run: **151 passed, zero failed, skipped or retried**,
one worker, 4.8 minutes. It includes rendered account failures and the synthetic
save/revisit/delete lifecycle, partial lookup, catalog access variants,
accessibility, mobile layouts, provider failures and stale AI/weather state.

- [ ] Freeze and record the exact candidate commit and Preview deployment.
- [x] Pass lint, documentation links, types, unit tests, catalog checks,
  scenarios, stress checks, production build and full Firefox suite.
- [ ] Confirm live lookup and one accepted signed-in Gemini review on that Preview.
- [ ] Check sign-in, save, revisit, delete and sign-out on the same Preview.
- [ ] Finish current static analysis, dependency/secret checks, independent review,
  passive deployed checks and the sanitized security summary.
- [ ] Update the README, changelog, requirements status, demo notes and handoff.

Historical two-account privacy and owner acceptance remain dated evidence, not
newly repeated tests. Local mocks and embedded PostgreSQL do not prove live
provider or deployed account behavior.
