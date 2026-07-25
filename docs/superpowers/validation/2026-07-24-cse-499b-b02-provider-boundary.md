# CSE 499B B-02 Live AI Provider Boundary Validation

- Date: 2026-07-24
- Requirement: B-02 advanced guarded AI recommendation refinement
- Branch: `codex/b02-guarded-live-ai`
- Status: Week 6 provider boundary implemented; live credential, UI integration,
  and live acceptance demo remain pending

## Scope Gate

This slice implements the Week 6 schedule output only:

- select an approved AI provider and model
- add a server-only provider boundary
- enforce runtime input and output schemas
- minimize the provider payload
- map timeout, quota, configuration, provider, and invalid-response failures
- prove accepted and rejected behavior with deterministic mocks

The visible TrailPack UI remains on the saved Jenny Lake review fixture. It does
not call the live route yet. That separation is intentional: the schedule says
that no user-facing live AI result is accepted during the provider-boundary
slice.

## Provider Decision

Use the Google Gemini Developer API through a direct server-side REST
`generateContent` request. The default model is the generally available
`gemini-3.5-flash-lite`; `GEMINI_MODEL` may override it with another bounded
Gemini model identifier.

The choice fits the current proposal and project constraints:

- Gemini is already named as an acceptable provider in the project proposal.
- The model supports structured JSON output.
- The model has a free tier and a comparatively low paid token price.
- A direct REST call avoids adding an SDK dependency for this narrow first
  boundary.
- The existing TrailPack validator, not the provider, remains the acceptance
  authority.

Official references:

- Model:
  `https://ai.google.dev/gemini-api/docs/models/gemini-3.5-flash-lite`
- Structured output:
  `https://ai.google.dev/gemini-api/docs/structured-output`
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
- defaults to `gemini-3.5-flash-lite`
- sends a structured-output schema with no deprecated sampling parameters
- aborts provider work after seven seconds
- rejects provider bodies larger than 256,000 characters
- returns `Cache-Control: no-store`
- never returns the provider key, raw provider error body, or internal prompt

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
| `rejected` | Structured output changes the packing set or labels, crosses trail facts, or makes unsupported safety claims | Deterministic template fallback plus safe validation reasons |
| `timed-out` | Local abort, provider 408, or provider 504 | Deterministic template fallback |
| `quota-limited` | Provider 429 | Deterministic template fallback |
| `missing-key` | `GEMINI_API_KEY` is absent | Deterministic template fallback without a network request |
| `invalid-response` | Missing candidate text, malformed JSON, oversized response, or wrong runtime shape | Deterministic template fallback |
| `provider-error` | Network failure or other non-success provider response | Deterministic template fallback without raw upstream details |

The rule-based packing recommendation is already complete before this route is
called. No outcome can add, remove, reprioritize, or relabel baseline items.

## Verification

| Check | Result | Evidence |
|---|---|---|
| Focused guarded-contract, provider, and route tests | Pass | 3 files, 22 tests |
| ESLint | Pass | `npm run lint`; no errors or warnings |
| TypeScript direct check | Pass | `tsc --noEmit --incremental false` |
| Full Vitest suite | Pass | 11 files, 153 tests |
| Standard Next type generation | Pass | `npm run typecheck`; route types generated successfully |
| Scenario stress matrix | Pass | `npm run scenario:stress`; existing 27-scenario rule-engine report regenerated |
| Production build | Pass | Next.js compiled successfully and lists `/api/trailpack/ai-review` as dynamic |
| Local production homepage | Pass | Terminal HTTP 200 with `<title>TrailPack</title>` |
| Local missing-key fallback | Pass | HTTP 200, `no-store`, outcome `missing-key`, review status `fallback` |
| Local invalid contract | Pass | Controlled HTTP 400 with no internal details |
| Vercel preview missing-key fallback | Pending | Publish after all local checks pass |
| Live accepted provider response | Pending | Requires an approved Gemini key; do not store one without confirmation |

Focused coverage includes accepted, semantic rejection, timeout, quota, missing
key, malformed response, provider error, omitted notes, malformed route input,
oversized route input, and server-only provider configuration.

## Remaining B-02 Work

1. Publish and verify the feature-branch Vercel preview with no Gemini key. The
   route must return the labeled `missing-key` fallback.
2. Obtain or approve a Gemini key and configure it for Preview only.
3. Capture one live accepted response without recording the key, prompt, or
   personal data.
4. Implement the Week 7 UI that distinguishes accepted, rejected, and unchanged
   fallback text from the rule-based packing list.
5. Run the Week 8 live accepted, rejected, timeout, quota, and missing-key demo
   matrix before closing B-02.
6. Review request-abuse controls before enabling paid or broadly available
   production traffic.

B-02 is not complete at this boundary. This record proves the server contract
and deterministic failure behavior, not a live user-visible AI result.
