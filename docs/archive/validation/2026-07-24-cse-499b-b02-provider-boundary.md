# CSE 499B B-02 Live AI Boundary And UI Validation

- Date: 2026-07-24
- Updated: 2026-08-29
- Requirement: B-02 advanced guarded AI recommendation refinement
- Branch: `codex/b02-guarded-live-ai`
- Status: original implementation and Preview validation complete; the `0.6.0`
  Production rollout is recorded in the 2026-08-29 addendum

## Scope Gate

This record covers the Week 6 through Week 8 B-02 slice:

- select an approved AI provider and model
- add a server-only provider boundary
- enforce runtime input and output schemas
- minimize the provider payload
- map timeout, quota, configuration, provider, and invalid-response failures
- prove accepted and rejected behavior with deterministic tests
- let the user explicitly request a live review
- distinguish accepted, rejected, unavailable, and request-failure states
- keep the rule-based list visible and unchanged in every state
- validate a live accepted response in a protected Vercel Preview
- keep every rule-engine missing-detail statement unchanged

The visible TrailPack UI starts on the saved Jenny Lake review fixture and calls
the live route only after the user selects **Run guarded live review**. This
keeps the deterministic demo stable and avoids automatic provider requests while
still making every live outcome understandable.

> Historical behavior: this paragraph describes the July `0.4.0` checkpoint.
> The `0.6.0` rollout supersedes the manual-only request with the authenticated,
> rate-limited automatic review described in the addendum below.

## Provider Decision

Use the Google Gemini Developer API through the current server-side REST
Interactions API. The default model is `gemini-3.5-flash`; `GEMINI_MODEL` may
override it with another bounded Gemini model identifier.

The choice fits the current proposal and project constraints:

- Gemini is already named as an acceptable provider in the project proposal.
- The model supports structured JSON output.
- A direct REST call avoids adding an SDK dependency for this narrow first
  boundary.
- The existing TrailPack validator, not the provider, remains the acceptance
  authority.
- Interactions requests set `store: false` so the provider does not retain the
  interaction for later retrieval.

Official references:

- Interactions API:
  `https://ai.google.dev/gemini-api/docs/interactions-overview`
- API-key handling:
  `https://ai.google.dev/gemini-api/docs/api-key`
- Gemini API quickstart:
  `https://ai.google.dev/gemini-api/docs/get-started`
- Pricing and data-use distinction:
  `https://ai.google.dev/gemini-api/docs/pricing`

Google states that free-tier content may be used to improve its products, while
paid-tier content is not. TrailPack therefore sends a minimized, non-account
payload and does not send unrestricted notes. If a later data policy requires
the stronger provider-side handling commitment, use the paid tier or revisit the
provider decision before enabling the route for production users.

## Implemented Boundary

`POST /api/trailpack/ai-review`:

- accepts at most 64,000 bytes
- validates the complete `AiContractInput` runtime shape
- reads `GEMINI_API_KEY` only on the server
- defaults to `gemini-3.5-flash`
- sends a structured `response_format` through the Interactions API
- sets `store: false`
- requires exact item names, exact source-label arrays, and an exact copy of the
  rule-engine missing-details list
- aborts provider work after 25 seconds
- rejects provider bodies larger than 256,000 characters
- returns `Cache-Control: no-store`
- never returns the provider key, raw provider error body, or internal prompt
- logs only bounded status, reason, envelope, and invalid-field codes for
  provider failures in Vercel

The provider payload includes only:

- bounded trail identity and planning facts
- bounded weather and official-alert context
- optional start time, expected duration, and bounded trail-condition text
- the existing rule-based essential and optional packing items
- existing missing-detail and confidence text

The unrestricted `notes` field is deliberately excluded.

## Outcome And Fallback Mapping

| Outcome | Trigger | Display result |
|---|---|---|
| `accepted` | Runtime shape and all existing semantic guardrails pass | Validated AI review |
| `rejected` | Structured output changes the packing set, labels, missing-details list, crosses trail facts, or makes unsupported safety claims | Deterministic template fallback plus safe validation reasons |
| `timed-out` | Local abort, provider 408, or provider 504 | Deterministic template fallback |
| `quota-limited` | Provider 429 | Deterministic template fallback |
| `missing-key` | `GEMINI_API_KEY` is absent | Deterministic template fallback without a network request |
| `invalid-response` | Missing candidate text, malformed JSON, oversized response, or wrong runtime shape | Deterministic template fallback |
| `provider-error` | Network failure or other non-success provider response | Deterministic template fallback without raw upstream details |

The rule-based packing recommendation is already complete before this route is
called. No outcome can add, remove, reprioritize, or relabel baseline items.

## Implemented UI

The guarded AI panel:

- labels the saved fixture separately from a live accepted result
- maps rejected, timed-out, quota-limited, missing-key, invalid-response, and
  provider-error outcomes to clear deterministic fallback copy
- validates the route response again at the client boundary
- hides malformed route bodies and upstream details behind generic request copy
- keeps the live request user-triggered instead of firing on selection or input
  changes at the original July checkpoint
- states that the rule-based packing list remains authoritative

Vercel environment inventory at the original July checkpoint, by name only:

- `NPS_API_KEY`: encrypted for Preview and Production
- `GEMINI_API_KEY`: encrypted and limited to Preview
- `GEMINI_MODEL`: optional and not required for the default model

No credential value is recorded in this note. Production has no
`GEMINI_API_KEY`, so it makes no Gemini request and retains the deterministic
missing-key fallback.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Focused guarded-contract, provider, and route tests | Pass | 3 files, 26 tests |
| ESLint | Pass | `npm run lint`; no errors or warnings |
| Standard Next type generation | Pass | `npm run typecheck`; route types generated successfully |
| Full Vitest suite | Pass | 13 files, 169 tests |
| Scenario stress matrix | Previously passed, not rerun | Recommendation decisions did not change in this provider-only update |
| Production build | Pass | Next.js compiled successfully and lists `/api/trailpack/ai-review` as dynamic |
| Local production homepage | Pass | Terminal HTTP 200 with `<title>TrailPack</title>` |
| Local missing-key fallback | Pass | HTTP 200, `no-store`, outcome `missing-key`, review status `fallback` |
| Local invalid contract | Pass | Controlled HTTP 400 with no internal details |
| Vercel Preview build | Pass | Disposable deployment `dpl_8djehtFNTYqck4L74ucyXvt24S5T` reported Ready and built the dynamic AI route |
| Git-connected Preview build | Pass | Commit `8870f6e` deployed Ready as `dpl_GQX5tyQ492wQ5eiUR4fQt3grB7pD` through the PR's Vercel check |
| Vercel preview homepage and assets | Pass | Authenticated terminal checks returned HTTPS 200 with `<title>TrailPack</title>`; every referenced JavaScript, CSS, and font asset returned HTTP 200 |
| Prior Week 6 preview UI smoke | Pass | Authenticated Firefox walkthrough loaded `<title>TrailPack</title>` and the expected Jenny Lake, Taggart Lake, and String Lake starter cards |
| Vercel preview missing-key fallback | Pass | Authenticated terminal POST returned HTTP 200, `no-store`, outcome `missing-key`, review status `fallback`, and one safe validation reason; no provider request was possible |
| Vercel preview invalid contract | Pass | Authenticated terminal POST returned controlled HTTP 400, `no-store`, and the generic supported-contract error |
| Initial live provider responses | Superseded | The earlier 12-second probes used a minimal one-item contract. They proved the provider and guardrail path but did not represent the 13-item Jenny Lake UI request and are not sufficient reliability evidence for the visible control |
| Full Jenny Lake 12-second reproduction | Safe fallback, usability failure | Two user walkthrough attempts and one authenticated terminal request of the 15 KB, 13-item contract returned the labeled `timed-out` fallback. The packing list remained unchanged, but the bound was too short for the real UI workload |
| Full Jenny Lake 25-second verification | Pass | Disposable deployment `dpl_2e4srJT5vao4G39JPMbTvjdX5Jhm` accepted three of three 15 KB, 13-item requests at 17.71s, 19.33s, and 16.03s. Every response returned HTTP 200, review status `accepted`, all 13 baseline items, the three exact missing details, and zero validation reasons |
| Seven-second timeout comparison | Pass as fallback evidence | Three of three seven-second requests returned HTTP 200 with outcome `timed-out` and the unchanged rule-based fallback, demonstrating that the original limit was too aggressive |
| Live response headers | Pass | HTTP/2 200, `Cache-Control: no-store`, JSON content type, HTTPS with strict transport security |
| Vercel preview logs | Pass | Three info-level Preview POST records returned 200; the error-level query returned no entries |
| Focused Week 7 client and display tests | Pass | Live-route parsing and every accepted/rejected/fallback presentation state passed |
| Local Week 7 Firefox walkthrough | Pass | Desktop and 390px mobile layouts rendered without a framework overlay; the control changed from saved accepted fixture to labeled missing-key fallback while the rule-based list remained visible |
| Local Firefox console | Pass with note | No application errors; only a Next development font-preload warning appeared |

Focused coverage includes accepted, semantic rejection, timeout, quota, missing
key, malformed response, provider error, omitted notes, malformed route input,
oversized route input, exact missing-detail provenance, safe provider
diagnostics, and server-only provider configuration.

## Proposal And Requirement Alignment

The implementation matches the proposal's stated AI boundary: the rule engine
creates recommendations first, Gemini receives minimized structured context,
and template explanations remain available whenever AI is unreliable. It also
meets the B-02 success criteria:

- a supported scenario received repeatable live accepted explanations
- the UI separates AI-assisted text from the rule-based list
- tests prevent packing-set, evidence-label, missing-detail, cross-trail, and
  unsupported-safety changes
- saved fixtures and template fallbacks remain deterministic

No proposal scope mismatch was found. The exact missing-details check closes a
gap discovered during live validation, where a model could otherwise describe
missing profile or preference data that the rule engine had not identified.

## Historical Remaining B-02 Work At The July Checkpoint

1. Complete PR review and merge before treating B-03 as the active track.
2. Use the deterministic rejection fixture to show the rejected response,
   validation reason, and unchanged fallback during the classroom demo.
3. Review request-abuse controls before enabling paid or broadly available
   production traffic.

B-02's implementation and Preview validation are complete on this branch.
Production remains intentionally unchanged until abuse controls and the release
decision are addressed.

## Production Rollout Addendum — 2026-08-29

The `0.6.0` release addresses the original production-abuse gate and promotes
the guarded explanation review without changing packing authority.

### Updated User Flow

- A supported plan waits for its live weather and AI contract to stabilize,
  then requests one review automatically after a 1.5-second debounce.
- The same exact contract is not requested automatically again during the
  current browser session. A signed-in hiker may use **Refresh guarded review**
  when another review is useful.
- Signed-out, exhausted, provider-failure, and validation-failure paths keep the
  complete deterministic explanation and packing list available.
- AI still cannot add, remove, reorder, reprioritize, relabel, or rewrite the
  rule-engine missing-detail list.

### Production Abuse Controls

- The route validates the bounded contract before provider work, then obtains
  the current user from the server-validated Supabase session.
- `public.ai_review_quotas` stores one bounded counter per authenticated user.
  Browser roles have no direct table privileges and row-level security remains
  enabled.
- `public.claim_ai_review_quota()` is the only authenticated operation. It uses
  `auth.uid()`, an account-scoped transaction advisory lock, and a one-hour
  window to allow at most five claims.
- A signed-out request returns the explicit deterministic `sign-in-required`
  outcome with HTTP `401`; an exhausted account returns `rate-limited` with HTTP
  `429`, `Retry-After`, and bounded allowance headers. Neither reaches Gemini.
- The encrypted `GEMINI_API_KEY` is configured for both Preview and Production;
  Vercel records that a new deployment is required for the Production scope to
  take effect.

The first live database claim exposed an ambiguous PL/pgSQL variable named
`current_time`, which PostgreSQL resolved as its time expression inside the
insert. The follow-up migration
`20260829174000_fix_ai_review_quota_timestamp.sql` replaces it with
`claim_timestamp` while preserving the same atomic behavior. The base migration
also uses a non-reserved name for clean installations; the follow-up remains for
deployments that had already recorded the original migration. The applied
Production function source was re-read to confirm the replacement.

### Preview And Database Evidence

| Check | Result | Evidence |
|---|---|---|
| Vercel Preview | Pass | Deployment `25AeVjArBoQw8pVya4YM334FWY9d` reached Ready at the branch Preview URL |
| Preview OAuth | Pass | The exact origin-local `/auth/callback` redirect completed sign-in on the branch Preview instead of falling back to the Production callback |
| Transactional quota claim | Pass | An authenticated rollback test returned `allowed = true` and `remaining = 4`; rollback left no test row |
| Live guarded review | Pass | Jenny Lake returned `Live review accepted` from `gemini-3.5-flash`; the rule-based item set, order, labels, and missing details remained unchanged |
| Environment scope | Pass | Vercel saved `GEMINI_API_KEY` for Production and Preview without exposing the secret value |

### Final Local Gate

| Check | Result |
|---|---|
| ESLint | Pass |
| Type generation and TypeScript | Pass |
| Vitest | Pass — 28 files, 255 tests |
| Firefox/axe | Pass — four flows |
| Optimized Production build | Pass — Next.js `15.5.24` |
| Recommendation stress matrix | Pass — 27 scenarios |
| Live NPS source integrity | Pass — 5/5 unchanged |

Pull request [#41](https://github.com/jaredsrice/TrailPack/pull/41) passed every
required hosted check and merged as `9e95139`. Production deployment
`864Tp5oWS5LTzCL3DGscNfFUnd9R` reached Ready, the exact Production callback
completed sign-in, and one automatic Jenny Lake request returned **Live review
accepted** from `gemini-3.5-flash`. The rule-based list remained unchanged, so
the post-deployment acceptance gate passed.
