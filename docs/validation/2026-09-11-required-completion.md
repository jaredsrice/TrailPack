# Required-completion candidate: local verification

## September 12 preview deployment and hosted checks

Status: **READY, Preview only**, Next.js, 41-second remote build.
[Review the test website](https://trailpack-8ksthnzzs-jared-s-rice.vercel.app).
Deployment: `dpl_GQNbRvNem91dQRdAq5bnbbtfuVJw`.
Candidate remains uncommitted on `codex/required-completion`, based on
`72593bc69e11b9fe3b4fc24a150b9a81f849eabf`; this is not a final commit release.
The deployment metadata records the sorted upload path/SHA manifest digest:
`0c736e6a23ff05b8fc8029338d647fa09b60f3f9a247279f3a9d932ae4dd0648`.
Upload dry-run: 298 files, no environment files, private folders, local evidence,
agent instructions or CLI temporary metadata. Later documentation edits do not
change the deployed runtime.

Owner authorization: the shared quota addition is specifically approved.
Verified project changes may routinely be uploaded to Preview for owner review.
Main merges and production website publication still require explicit approval.
The production alias still resolves to the prior deployment
`dpl_Am6La8gGcQPQkQs1cUacwkYZ3YxV`, not this preview.

### Hosted migration

Applied exactly `20260911000000_nps_lookup_quota.sql` with the normal CLI
migration mechanism from a private single-file release directory. Its SHA-256 is
`372e331a447da146bfc9e1fb9eceb8054c6193864b8dfdb06bdea5561238aa42`.
Byte comparison passed and dry-run named only this migration, no roles/seeds.
The full repository dry-run would have replayed five historical migrations
because the existing deployed schema had no CLI history. Those migrations were
not rerun or marked applied. Future full-repository pushes require deliberate
history reconciliation.

Postchecks: one quota row, RLS enabled, anon SELECT denied, authenticated UPDATE
denied, anon function execution allowed, and history contains only the new
version. Two simultaneous independent Node processes each made one anonymous
REST claim and received HTTP 200/true. The next read showed one row with
18.00102516666666666667 tokens. This demonstrates shared consumption across
independent clients; it is not an exhaustive multi-region load/exhaustion test
or proof of which Vercel worker instance handled a request.

### Acceptance evidence

- Independent tester's full local Firefox suite: **139/139 passed**, one worker,
  4.4 minutes. This supersedes the earlier split 135-plus-two browser evidence.
- Independent hosted API checks: GET lookup 405; invalid text/plain POST 415
  with safe invalid-query response; Fairyland Loop/Bryce 200 with one correct
  official record, 4–5-hour source duration and five-hour upper estimate,
  timestamp and null distance/gain/route facts; nonsense query 200/empty.
  Exactly two requests could reach NPS.
- Coordinator's hosted browser walkthrough: explicit Search, park selection,
  partial source/gaps display and five-hour seed, no packing list until Generate,
  NPS source link on affected Water guidance, edit 5→8→5, stale notice with
  enabled Update, then user-provided attribution and removed NPS-duration link.
  No AI request was made in this partial-lookup path.
- Independent passive security checks: homepage HEAD 200; valid guest AI POST
  returned 401/sign-in-required with safe fallback and no-store. CSP, HSTS,
  frame denial, nosniff, restricted Permissions Policy and strict-origin
  referrer policy were present. Existing CSP inline allowances remain.
  Exactly two passive requests; no login, provider attack, or quota exhaustion.
- Prior current-source checks remain 844 unit/integration tests, lint and
  production build passing. No new runtime edits followed those checks;
  deployment exclusions and project/documentation guidance changed.

B-01 is verified on the test preview, not published to production. B-02
signed-in live Gemini acceptance still has not occurred; configured secrets,
guest denial and mocked tests are not substitutes. B-04 final immutable-commit
scanners remain pending. Canonical Open Canyon automated delivery remains
needs-review despite manually corroborated unchanged official facts.
Continue Astra High coordinating, Sol High testing and a separate Astra High
security reviewer for remaining acceptance; do not publish production without
owner approval.

## September 12 hosted target gate

Vercel and Supabase CLI sign-ins are restored. The verified hosting target is
`prj_xrwPozS0EfR5O87mnxNspeU1pj6u` under
`team_wqE80IHRIqqs1jLkuJCiIMQk`; Supabase lists TrailPack
`wdxilooepbakbcvlqaaw`. Preview and Production share the same Supabase
configuration, and Supabase reports no branches. Both provider keys are
configured for previews; the sensitive Gemini key is not locally downloadable.

The independent reviewer checked backward compatibility with released base
`72593bc6`: the proposed migration creates only its own quota table, one row
and function. It does not alter existing save/account/AI-allowance objects, and
released code does not reference the new objects. Nevertheless, its anonymous
consume-only RPC becomes publicly callable as soon as the migration is exposed,
even before preview deployment. This is a shared production database change,
not an isolated preview-only change.

Specific owner approval for that boundary is required before application.
Alternatively, a separate preview database needs deliberate authorization/setup.
No hosted migration or deployment has occurred. Hosted schema drift and
migration history remain unverified: the read-only CLI query failed its IPv6
connection setup before executing SQL. Do not apply the non-idempotent migration
until those preflight checks pass; use the migration mechanism transactionally.

## September 12 independent review and retest addendum

Jared approved the temporary native Codex review arrangement and the proposed
database update/test preview. Astra High reviewed security independently; Sol
High checked acceptance. The coordinator retained all write/deployment ownership.
No permanent team or archived orchestration machinery was resumed.

The independent tester found two defects, now repaired with observed red/green
regressions:

- Duration provenance was inferred from value equality. Editing 5 hours to 8
  and back to 5 incorrectly restored NPS attribution, and could leave Update
  disabled. Explicit source state now survives edits and participates in the
  generated-plan stale check. Two browser regressions cover edits both before
  and after first generation.
- Duration normalization bounded only the range end. Both converted endpoints
  must now fit 0.25–12 hours. Two negative and three inclusive-boundary tests
  cover this behavior.

Fresh coordinator checks: **844 tests in 60 files passed**, all **9 lookup
Firefox cases passed**, lint passed, and the production build including type
validation passed (main route approximately 178 kB). The full earlier browser
suite, stress run and dependency audit below were not repeated in this step.
The September 11 manifest below identifies the earlier candidate, not these
subsequent changes. A final immutable candidate remains pending.

The tester independently rechecked the fix with 36 targeted tests and fresh
probes: both out-of-range examples were rejected, and an edited-back five-hour
duration retained user-provided labels without an NPS duration link.

Independent security reviewer: 84 changed-boundary tests passed; additional
embedded-PostgreSQL probes denied 18 table operations across anon, authenticated
and unrelated roles, denied unrelated RPC execution, and allowed exactly 20 of
100 immediate anonymous claims while retaining one row. Seven hostile URLs and
seven inapplicable/prototype AI IDs were rejected. No new blocking defect was
confirmed. This was local validation, not hosted concurrency or final-commit
security certification. Public consume-only RPC access still permits deliberate
guest-bucket exhaustion: an availability risk, not quota replenishment or private
data access. Production disposition remains open.

Open Canyon: the tester obtained full content from the official
[home.nps.gov page](https://home.nps.gov/thingstodo/open-canyon.htm), which declares
the existing www URL as its canonical social URL and a May 15, 2026 update date.
The existing parser reported both saved profiles unchanged. This manually
corroborates the saved facts; it does not convert the **48/50 automated result**
into a pass. Preserve both snapshots and canonical URLs. Automated www delivery
still needs review; no implicit alternate-host fallback was added.

Manual source fields: Open Canyon 14.8 miles / 3,820 feet; Open Canyon to
Rendezvous 19.4 miles / 3,440 feet. Both retain 7–14 hours, Very Strenuous and
matching accessibility text. Route type was intentionally not checked under
the existing refresh policy.

Hosted work is blocked on access: the Vercel connector is disconnected, Vercel
CLI reports an invalid token, and Supabase CLI has no access token. No hosted
migration, preview, production change, push, commit or live Gemini call occurred.
No new credentials were created or existing secrets exposed.

Next: restore authorized Vercel/Supabase sign-in, confirm the exact database
target and preview environment, apply only the reviewed migration, then verify
shared quota and deliberate live lookup/AI acceptance. No production deployment
or account/private-save re-audit is authorized by this step. Continue with Astra
High coordinating, Sol High testing and a separate Astra High security reviewer.

## September 11 evidence (historical candidate)

Date: September 11, 2026. Base: `72593bc69e11b9fe3b4fc24a150b9a81f849eabf`.
Candidate: uncommitted `codex/required-completion` worktree. No merge, push,
deployment, live database migration, or paid Gemini call was performed.
The final 37 changed code/test/config files have a sorted path/content SHA-256
manifest digest of
`a8b11bb8e156f4c03dd4894c8c3df2da095b4917f78266491e56adf5c346310a`.
Documentation is excluded from this digest. It identifies local evidence but
does not replace a final Git commit.

## Requirement disposition

| Work | Candidate result | Remaining acceptance |
|---|---|---|
| MH-05/B-02 | Provider selects approved IDs; unsupported prose and raw-input forwarding repaired; safe rejection details displayed | B-02 needs a configured, authorized signed-in live Gemini preview demonstration |
| B-02 NPS maintenance | Valid Very Strenuous changes accepted by guarded planner; streamed page cap and cancellation tested; parent geometry/snapshot separation preserved | Current live Open Canyon page response needs source review; do not overwrite snapshots |
| B-01/SH-01 | Narrow NPS lookup, partial model, duration-driven rules and explicit Generate/Update implemented; 12/12 identities pass two live adapter runs | Approved hosted quota migration, shared-worker checks and end-to-end preview demonstration |
| B-03 | Existing behavior preserved; original owner acceptance retained | No repeat login/save lifecycle requested |
| B-04 | Local changed-boundary review, negative tests, dependency audit and browser checks performed | Final candidate commit/static checks, independent review and authorized passive preview checks still pending |
| Original SH-04/SH-06 | Not implemented | Optional variants/export remain separately scoped |

This is **not** final 499B acceptance or a production security certification.
All six baseline requirements now have local implementation/test support in the
candidate; deployed acceptance does not inherit that claim.

## Local evidence

- Full unit/integration suite: 839 tests across 60 files, including real migration
  execution in embedded PostgreSQL. Lint and TypeScript pass.
- Production build passes. Main route first-load JavaScript is about 178 kB.
- Full existing-plus-lookup Firefox browser run: 135 tests passed. It covers
  desktop/mobile catalog profiles, manual entry, context failures, controlled
  generation, AI outcomes and accessibility. Two added rejection/invalid-selection
  detail cases also passed in a separate focused run: **137 distinct browser
  cases passed across the two runs**, not a single 137-case final run.
- System stress: 5,000 cases, zero invariant failures.
- Dependency audit: zero known findings after the development-only PGlite
  addition. This is a dated dependency-database result, not exhaustive analysis.
- A heuristic scan of the 37 changed code/test/config files found zero matching
  private-key, Google-key or GitHub-token patterns. This limited pattern check
  is not a dedicated secret scan or the final GitHub aggregate acceptance.
- NPS adapter: final two live runs each found all 12 expected records across
  three parks and admitted zero unrelated sample results. See
  [the provider proof](2026-09-11-nps-lookup-provider-proof.md).
- Red/green regressions cover the three original false summaries, arbitrary
  input sentinels, invalid IDs/cardinality, valid/invalid Very Strenuous refresh,
  oversized streams, stalled input, safe rejection display, and real NPS
  Front-Country Hiking categorization.
- Embedded PostgreSQL: the exact migration executes; 20 of 21 immediate claims
  succeed; anon read/update/delete are denied; authenticated callers consume the
  same bucket; a six-second refill permits one further claim; storage remains
  one row. This single-connection test is not hosted concurrency proof.

Evidence under ignored worktree `.artifacts/` includes source-integrity reports,
system stress output, desktop/mobile lookup screenshots, and browser results.
These are not public release artifacts or a replacement for a frozen commit.

## Local security delta review

Method: one main agent reviewed the changed code and independently reproduced
the original findings through regression inputs. There was no second reviewer,
new remote CodeQL run, active exploit scan, or third-party attack. Scope excludes
the owner's passed Google/private-save lifecycle and unrelated shelved features.

| Boundary / OWASP-CWE area | Control inspected and checked | Limit |
|---|---|---|
| Untrusted AI output; injection/integrity, CWE-20 | Exact ID selection, unique applicable entries, server-owned wording; provider prose never becomes a new displayed fact | Supplied weather/user context is not independently re-fetched by the AI route |
| Data minimization; disclosure, CWE-200 | Provider request contains approved facts only; synthetic raw-input markers absent | NPS receives the explicit trail search query; UI discloses this |
| External lookup; SSRF/input, CWE-918/20 | Fixed upstream host/path, no redirects, strict returned source URLs, hiking/park/title/duration checks | A finite identity sample cannot establish universal NPS accuracy |
| Resource consumption, CWE-400 | Query/body limits, deadlines, streaming caps, bounded cache/in-flight map and database token bucket | Public clients can consume the guest bucket; manual/catalog flows remain independent |
| Access control, CWE-862/863 | Existing AI server-account/quota tests retained; new SQL table privileges denied and RPC has no client-controlled budget/clock/identity | New hosted migration and multi-worker enforcement unverified |
| Script injection, CWE-79 | React text rendering, plain provider titles, validated HTTPS NPS links; no provider HTML rendered | Existing documented CSP allowances unchanged |
| Error handling, CWE-209 | Enumerated lookup/AI failures; no raw provider errors, responses or credential values exposed in these new paths | Not a full application logging audit |
| Dependencies/configuration | Lint, type checks, build, dependency audit and exact local migration execution | Final-commit CodeQL/secret aggregates and deployed checks pending |

No new critical/high finding was confirmed within this bounded local review.
That does not establish the final requirement of no unresolved serious findings
for a submitted/deployed candidate. The previously reproduced unsupported-AI-
prose and minimization findings now have passing local retests.

### Residual and open items

1. **Release gate:** Gemini key is absent locally. Use a configured approved
   preview for one authorized signed-in accepted review, plus rejected/fallback
   evidence and allowance behavior. Do not substitute a mock for live acceptance.
2. **Release gate:** apply the reviewed NPS lookup quota migration to the approved
   environment. Verify guest permissions and concurrent workers share its
   budget before claiming hosted lookup availability.
3. **Release gate:** freeze the final commit; obtain static/dependency/secret
   checks and a bounded independent review/passive dynamic preview check.
4. **Source review:** the September 11 live maintenance run reports **48/50
   unchanged**, with `open-canyon` and `open-canyon-rendezvous` parse errors.
   Repeated direct HTTP 200 responses for their shared
   [NPS page](https://www.nps.gov/thingstodo/open-canyon.htm) contained the site
   shell but no route facts. A separately indexed copy still exposed the older
   details. This is not evidence of a changed distance or a safe replacement
   value. Preserve snapshots and investigate/verify the official source before
   refreshing them. The checker correctly returned needs-review, not pass.
5. **Accepted local limitation, production disposition pending:** guest quota can
   be deliberately exhausted, even through its public consume-only RPC.
   This does not permit resetting the budget or accessing private data.
6. **Inherited limitations:** CSP inline allowances, single-park complete catalog,
   weather/notice uncertainty and original optional variants/export remain as
   previously documented.

## Next action and setup

Review the candidate, resolve the Open Canyon source response, and authorize the
hosted migration/preview acceptance boundary. Keep the branch/worktree intact
until integration is chosen. Recommended: GPT-6 Astra, high reasoning, one main
agent for release-risk review and the acceptance work. This is a recommendation,
not a claim that the active model was switched.
