# Packing-List Generation And Live-Alert Correction

- Date: 2026-08-29
- Release: `0.6.1`
- Branch: `codex/fix-list-quota-live-alerts`
- Pull request: [#43](https://github.com/jaredsrice/TrailPack/pull/43)
- Production: [trailpack-ten.vercel.app](https://trailpack-ten.vercel.app)
- Gate status: release candidate, database migration, protected checks, and
  Preview acceptance passed

## Reported Behavior

Two user-facing problems prompted this correction:

1. A second packing-list attempt appeared to reach the five-per-hour guarded-AI
   limit. The `0.6.0` interface automatically requested a review after settled
   input changes and also offered a separate refresh, so multiple provider
   attempts could represent one planning session even though signed-out requests
   were rejected before an account quota claim.
2. The planner displayed **No active alerts in saved fixture**. That wording was
   accurate for the saved demo data, but it did not answer whether the current
   NPS service had active alerts because the primary planner had not requested
   the already available live-alert route.

At 2026-08-29 22:49 MDT, the Production alert route returned three current,
official Grand Teton NPS alerts: south-end construction, north park road
construction, and the Death Canyon trailhead construction closure. The saved
fixture's empty state therefore was not a current NPS no-alert result.

## Decision

Make packing-list generation a deliberate boundary. Selecting **Generate
packing list** or **Update packing list** snapshots the current trail, trip,
weather, and alert context, produces one deterministic packing recommendation,
and requests at most one guarded explanation for that generation. Editing fields
alone produces no list and makes no AI request.

Keep the account allowance at five distinct generated-list reviews per
hour. Give every generation a UUID and make the database claim idempotent so a
retry with the same UUID neither increments the count nor contacts Gemini again.

Request current NPS alerts alongside weather after a supported trail is
selected. Preserve the saved scenario only as an explicitly labeled fallback
when the live route is unavailable.

## Preserved Boundaries

| Boundary | Correction |
|---|---|
| Packing authority | The deterministic rule engine still owns the item set, order, priority, source labels, and missing details |
| User intent | Field edits mark an existing list stale; only Generate or Update creates a new list |
| Identity | The server still derives the quota owner from the validated Supabase session |
| Signed-out behavior | A signed-out request is rejected before the quota claim and cannot spend an account allowance |
| Retry behavior | A repeated generation UUID returns a structured duplicate result without another provider request |
| Live alerts | Only bounded NPS responses and HTTPS `nps.gov` source links enter the client model |
| Fallback | Weather, alert, authentication, quota, and provider failures retain a usable, visibly labeled deterministic result |

## Production Database Migration

Migration `20260830000000_dedupe_ai_review_generations.sql` was applied before
the application rollout. It added the bounded generation UUID array and replaced
the quota claim with a backward-compatible optional UUID argument. Direct table
access remains revoked from browser roles, the function remains a
`security definer` with an empty search path, and only the authenticated role can
execute it.

A Production transaction under an authenticated role returned these results for
the same test UUID:

- first claim: allowed, not duplicate, four remaining;
- retry: not allowed, duplicate, four remaining.

The transaction was rolled back, and a follow-up query confirmed that the test
UUID was absent from the quota table.

## Release-Candidate Verification

| Check | Result |
|---|---|
| ESLint | Pass |
| Type generation and TypeScript | Pass |
| Vitest | Pass - 30 files, 270 tests |
| Firefox/axe | Pass - four flows |
| Explicit-generation interaction | Pass - zero requests while editing; one on Generate; zero on another edit; one on Update |
| Optimized Production build | Pass - Next.js `15.5.24` |
| Recommendation stress matrix | Pass - 27 scenarios |
| Live NPS source integrity | Pass - all five official sources unchanged |
| Production quota migration | Pass - structural checks and rollback idempotency test |

## Proposal Alignment

The correction preserves the proposal's required structured packing-list flow,
guarded non-blocking AI path, rule-based fallback, and explicit uncertainty
labels. It also promotes the proposal's optional official-alert enhancement into
the primary supported-trail workflow without claiming perfect real-time trail
conditions. The saved alert context remains available for provider failures and
demo reliability.

## Protected Deployment Acceptance

Pull request [#43](https://github.com/jaredsrice/TrailPack/pull/43) passed the
required validation, CodeQL, automated critical-bug, automated vulnerability,
and Vercel checks. The protected Preview at
[trailpack-git-codex-fix-list-quota-live-alerts-jared-s-rice.vercel.app](https://trailpack-git-codex-fix-list-quota-live-alerts-jared-s-rice.vercel.app)
loaded successfully without an interstitial or blank state.

The Jenny Lake flow displayed live weather plus three current official NPS
alerts. Editing start time, duration, and conditions for 1.8 seconds produced no
packing output or AI panel. Generate then produced one deterministic list and
the expected signed-out AI fallback. Editing duration made **Update packing
list** available without replacing the existing snapshot; selecting Update
returned the list to its current state.

The same acceptance sequence is used against the stable Production URL after
the protected merge. The merge and Production deployment identifiers remain in
the pull-request delivery record rather than being predicted in this file.
