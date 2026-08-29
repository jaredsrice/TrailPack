# Production Guarded AI Rollout Gate

- Date: 2026-08-29
- Release: `0.6.0`
- Branch: `codex/production-guarded-ai`
- Pull request: [#41](https://github.com/jaredsrice/TrailPack/pull/41)
- Gate status: Preview, database, environment, and local release checks passed;
  protected merge and one Production smoke review remain as deployment actions

## Decision

Enable the existing Gemini explanation review in Production for signed-in
accounts only. Run it automatically once when a supported packing list and its
weather context settle, retain a user-controlled refresh, and allow no more than
five reviews per account during an hour-long window.

The deterministic rule engine remains the sole packing authority. The provider
cannot change item membership, order, priority, source labels, or the
rule-engine missing-detail list. Any blocked or unsuccessful request keeps the
same usable fallback.

## Controls

| Boundary | Control |
|---|---|
| Identity | The server obtains the current user from the validated Supabase session; no user id is accepted from the request body |
| Allowance | An account-scoped transaction lock makes the five-per-hour claim atomic across serverless workers |
| Database access | Browser roles cannot read or write the quota table directly; authenticated callers can execute only the bounded claim function |
| Request minimization | The existing 64,000-byte schema excludes account identifiers, OAuth data, unrestricted notes, and provider credentials |
| Provider response | Bounded structured output is checked against the exact rule-based contract before display |
| Failure behavior | Signed-out, rate-limited, unavailable, timed-out, rejected, malformed, and provider-error states retain the deterministic result |
| Caching | AI route responses use `Cache-Control: no-store` |

## Applied Infrastructure

1. `20260829000000_add_ai_review_quota.sql` creates the quota table, revokes
   direct browser access, and exposes the authenticated atomic claim function.
   Its checked-in function uses a non-reserved timestamp name for clean
   installations.
2. `20260829174000_fix_ai_review_quota_timestamp.sql` replaces the ambiguous
   `current_time` variable discovered by the first live claim on deployments
   that had already recorded the original migration.
3. The corrected Production function source was re-read and an authenticated
   claim was executed inside a rollback transaction. It returned one allowed
   claim with four remaining and retained no test row.
4. The existing encrypted `GEMINI_API_KEY` was expanded from Preview-only to
   Production and Preview. Vercel confirmed the saved scope and that the next
   deployment will consume it.

No secret value, access token, OAuth response, or personal identifier is
recorded in this evidence.

## Preview Acceptance

The protected branch Preview deployment
`25AeVjArBoQw8pVya4YM334FWY9d` reached Ready. After OAuth completed through the
exact Preview `/auth/callback` URL, Jenny Lake produced a live accepted review
from `gemini-3.5-flash`. The deterministic packing list remained unchanged.

The first attempt safely returned a generic unavailable state because the
database function hit PostgreSQL error `42804`. After the follow-up migration,
the same visible refresh path succeeded. This is both the defect reproduction
and the remediation retest; raw database/provider details were not exposed in
the browser response.

## Release-Candidate Verification

| Check | Result |
|---|---|
| ESLint | Pass |
| Type generation and TypeScript | Pass |
| Vitest | Pass — 28 files, 255 tests |
| Firefox/axe | Pass — four flows, including automatic guarded review |
| Optimized Production build | Pass — Next.js `15.5.24` |
| Recommendation stress matrix | Pass — 27 scenarios |
| Live NPS source integrity | Pass — all five official sources unchanged |

## Deployment Acceptance

Merge is allowed only through the protected pull request after required hosted
checks pass. The post-merge acceptance action is one signed-in Production Jenny
Lake review. It must show the accepted state while leaving the rule-based list
unchanged; otherwise the release remains safe but the live provider rollout is
treated as unavailable and investigated through bounded server logs.
