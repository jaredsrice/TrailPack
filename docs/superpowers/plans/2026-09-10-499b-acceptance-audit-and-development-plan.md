# 499B acceptance audit and development plan

Date: 2026-09-10

Audited code: `72593bc69e11b9fe3b4fc24a150b9a81f849eabf`
Status: planning complete; implementation not authorized or started

## Decision summary

The earlier feature-count scorecard was too coarse to establish acceptance.
Current B-02 has reproduced validation defects despite passing unit tests.
B-01 delivers reviewed imports, not the original live lookup. B-03 remains
passed at the owner's direction. B-04 passed for its historical release, but
needs a bounded delta review after the planned changes.

| Work | Acceptance today | Smallest next action | Estimated effort |
|---|---|---|---|
| B-01 public lookup | Stored substitute works; original live demo not met; academic substitution approval unverified | Prove one permitted provider, then add a partial-result lookup path | 19-32 hours, provider gate first |
| B-02 guarded live explanations | Implemented, but fails unsupported-claim and input-minimization criteria; rejection demo incomplete | Constrain output to approved fact IDs, remove raw trip text, show safe rejection reasons | 12-20 hours |
| B-02 NPS maintenance addendum | Broadly implemented; valid difficulty rejected and response cap applied too late | Fix those two boundaries and add regression fixtures | 3-4 hours |
| B-03 Google login/private saves | Passed by owner; excluded from this audit | None | 0 |
| B-04 cybersecurity verification | Historical pass, not a current full attestation | Delta review and dated report after new work stabilizes | 5-8 hours, excluding unknown fixes |
| Original SH-04 alternative variants | Not delivered; separately owner-queued extension, not required for current B-02 | Compare actual rule-approved list variants, with an explicit change ledger | 12-20 hours, optional to 499B closeout |
| Original SH-02 coverage | Substantive success criteria met; import/curated naming caveat; fresh UI demo pending | Demonstrate one expanded profile and fallback | 0.5-1 hour |
| Original SH-03 extra context | Minimum met through sourced Grand Teton bear guidance | Demonstrate its recommendation effect and source | 0.5 hour |
| Proposal official alerts | Current code/tests support all states; fresh live app demo pending | Demonstrate current live state plus deterministic failure/effect fixtures | 0.5 hour |
| Original SH-06 guest export/email | Explicitly deferred, absent, not enrolled by this plan | If separately selected, implement a client-only text download | Conditional 4-6 hours |

Estimates are engineering time with AI assistance, not promises of calendar
delivery or model cost. They include relevant tests and documentation. Provider
approval, credentials, stakeholder decisions, live acceptance availability, and
new findings can extend delivery. No feature should be declared passed solely
because the estimated time was spent.

## Source authority and scope accounting

The formal document sources inspected are preserved outside this repository:

- `/Users/jaredrice/Developer/Senior Project Local/Project Proposals/TrailPack_Proposal_v9.docx`
- `/Users/jaredrice/Developer/Senior Project Local/Requirements Docs/Final/w12 Requirements Spec v6.docx`
- `/Users/jaredrice/Developer/Senior Project Local/Requirements Docs/Final/TrailPack_Week12_Requirements_Specification_Draft.md`

The latest proposal controls proposal-level scope. Week 12 supplies the original
SH-01 through SH-06 contract. The [499B specification](../../archive/project/specs/2026-07-16-cse-499b-requirements.md)
selects B-01, B-02, B-03 and verification B-04. Its removed/deferred section
explicitly removes expanded profile counts, a generic extra signal, and guest
email/export as separate 499B requirements. B-04 is not an eighth nice-to-have.
Across the formal sources there are seven distinct nice-to-have feature ideas,
because official alerts appear in the proposal in addition to the six Week 12
stretch items. Those seven are not seven mandatory 499B commitments.

Two scope distinctions matter:

1. Current B-02 permits explanations, summaries, **or** variants. Its production
   addendum narrows deployment to explanation-only. Missing variants therefore
   do not fail current B-02. Original SH-04 remains separately queued because
   the owner asked to revisit it.
2. The original production auto-on-settle/refresh behavior was superseded by
   deliberate Generate/Update in the [0.6.1 correction](../../archive/validation/2026-08-29-packing-generation-live-alert-correction.md).
   Do not restore a standalone refresh or requests on every edit to satisfy an
   older paragraph. Record the supersession without rewriting historical docs.

For B-01, the [source decision](../../archive/research/2026-07-17-cse-499b-public-trail-source-feasibility.md)
and [import validation](../../archive/validation/2026-07-20-cse-499b-grand-teton-public-source-import.md)
explicitly replace runtime lookup with reviewed imports. The latter left scope
acceptance pending. [Issue 25](https://github.com/jaredsrice/TrailPack/issues/25)
and [merged PR 30](https://github.com/jaredsrice/TrailPack/pull/30) establish
delivery, but the inspected issue comments/PR reviews do not establish explicit
instructor approval of that substitution. This is an evidence gap, not proof
that approval never occurred. The software can satisfy the original live
requirement without relying on that missing approval.

### Evidence labels

- **Pass, current:** current code and relevant automated tests support the clause.
  This does not imply a fresh deployed browser demonstration.
- **Pass, historical:** a dated record demonstrates it for the recorded release.
- **Fail/gap:** current behavior contradicts the clause or the required path is absent.
- **Scope changed:** later documented behavior differs from the earlier wording.
- **Unverified:** the evidence needed to make the claim was not obtained.
- **Owner passed/deferred:** explicit user disposition, not a new test result.

## Verification performed for this audit

- Astra coordinated and reconciled the findings. Sol/High agents audited B-01
  and B-02; Sol/Medium audited retained scope and the B-04 evidence record.
- Full unit suite at `72593bc`: **777 tests passed in 52 files**. Agent focused
  runs additionally passed 18 B-01-related tests and 104 B-02-related tests.
- Root reproduced three invalid AI outputs being accepted through the actual
  provider parser and guard, using mocked fetch responses and no live AI call.
- Agent reproduced unnecessary free-text forwarding and a valid NPS refresh
  being blocked by the difficulty allowlist. Root inspected both implicated
  code paths and the absent rejection-reason rendering.
- Current [CI validation](https://github.com/jaredsrice/TrailPack/actions/runs/34524611921)
  and [CodeQL](https://github.com/jaredsrice/TrailPack/actions/runs/34524611977)
  succeeded for the audited commit. Current aggregate open CodeQL, Dependabot,
  and secret-scanning alerts were all zero. `npm audit` reported zero known
  vulnerabilities across 498 dependencies. These are bounded signals, not a
  comprehensive current security certification.
- Existing local `.artifacts/nps-source-integrity/latest.md`, checked at
  `2026-09-10T05:54:08.181Z`, reports 50/50 official profiles unchanged and zero
  needing review. It was inspected, not regenerated during this audit.
- Existing `.artifacts/system-stress/latest.md` reports 5,000 cases, 10,200
  evaluations, 52 trails, and zero invariant failures. This is stored evidence,
  not a new live-provider or database test.
- No fresh browser walkthrough, production AI call, login test, database write,
  dynamic security scan, deployment, or feature implementation was performed.

The checkout advanced externally from `846d340` to `72593bc` during the audit.
The final suite and conclusions use the latter commit. Pre-existing `AGENTS.md`
edits were preserved. This deliverable changes planning documents only.

## B-01: permission-compliant live trail lookup

### Original criteria against current evidence

Controlling clauses: 499B B-01 success/demo/fails-if; Week 12 SH-01;
[issue 25](https://github.com/jaredsrice/TrailPack/issues/25).

| Criterion | Status | Evidence or missing proof |
|---|---|---|
| Find/select at least one hike outside the original three | Pass for stored substitute | `src/features/trailpack/lib/search.ts:47` searches stored groups; expanded catalog contains 52 profiles |
| Original SH-01 live retrieval outside the supported catalog | Gap | Search has no runtime provider; adding another stored trail does not satisfy this clause |
| Reliable permitted source; document access/reuse, quota and attribution | Pass for stored substitute; runtime unproven | Source decision records NPS/USGS import review and rejection of Nominatim |
| Name/location plus useful recommendation inputs | Pass for stored profiles | `trail-definition.ts` compiles validated source facts; a genuinely partial runtime result needs a separate model |
| Source URL, retrieval status, confidence and missing fields retained | Pass for stored profiles | `TrailProfileSummary.tsx:177` renders source/retrieval/missing-field evidence |
| Do not claim non-NPS facts are official NPS | Pass for stored profiles | NPS display values and USGS comparison geometry remain separate |
| Normalized result generates packing output and prompts for gaps | Pass for stored profiles; runtime gap | `trail-catalog.test.ts` exercises admitted profiles; partial provider result not implemented |
| No result returns to manual entry | Pass, current | `search.ts:76` and `search.test.ts` |
| Provider errors, timeout, malformed result and rate limit preserve manual path | Gap | No runtime provider exists to exercise these cases |
| Curated and manual workflows remain usable | Pass, current | Local search and manual packing tests; must remain regression gates |
| Demo search, retrieve, show sources/gaps, add detail, generate, fail gracefully | Incomplete | Stored selection works; live retrieval/provider-failure steps cannot be shown |
| Fails-if guards: no unauthorized scraping, hidden source, false completeness, broken baseline | Stored path passes | Re-prove at new provider boundary; do not inherit a blanket pass |
| Current hosted walkthrough and configuration names documented | Unverified for proposed path | Requires a new reachable preview and exact deployed test record |

### Feasible implementation: narrow NPS lookup, not universal trail search

Provisional candidate: the official NPS Things To Do API, limited to NPS hiking
records. NPS provides the API for external applications, and its schema exposes
query/filter/result fields that may provide identity, location, coordinates and
duration. This is a candidate, not a proven trail catalog. Current access and
quota guidance must be recorded at the proof gate. Sources:
[NPS developer resources](https://www.nps.gov/subjects/developer/index.htm),
[official API schema](https://www.nps.gov/subjects/developer/customcf/swagger.json?03142019),
[API guides](https://www.nps.gov/subjects/developer/guides.htm).

Do not resurrect Nominatim by default. The historical 24-trail experiment
rejected it for identity/coverage problems. Do not use restricted scraping,
assume a public map segment is a complete hike, or invent distance/elevation.

| Slice | Deliverable | Exit test | Estimate |
|---|---|---|---|
| B01.1 Provider proof | Dated source/terms/quota/attribution record and sanitized sample | 12 hiking records across at least 3 parks outside current catalog; correct identity in top 5 for at least 10/12 and top 1 for at least 8/12; zero wrong identities admitted; at least 3 usable results repeat across two runs | 2-4h |
| B01.2 Server boundary | Fixed NPS endpoint adapter and search route, bounded requests/responses, explicit outcome union | Valid, empty, 400, 429, timeout, 5xx, malformed, missing key, oversized body and hostile URL fixtures; key never reaches client/logs | 5-8h |
| B01.3 Partial-result path | A discriminated lookup result beside the strong catalog type; verified fields seed manual recommendation logic | Missing fields remain null; user edits labeled user-provided; no defaults masquerade as NPS facts; one verified field actually improves output | 5-8h |
| B01.4 Search interaction | Explicit Search NPS action with curated results first and immediate manual fallback | Select live result, inspect NPS identity/source/gaps, add missing detail, Generate; every failure leaves manual flow usable | 4-7h |
| B01.5 Acceptance evidence | Unit/route/UI fixtures, full gates, dated hosted demonstration and setup docs | Original B-01 demo passes with one uncataloged hike; baseline supported/manual flows pass | 3-5h |

The sample thresholds above are **proposed engineering gates**, not numbers in
the original specification. A result is selectable only with a validated NPS
URL, unambiguous hiking identity, related park/state, and at least one useful
structured fact. Prefer structured duration; coordinates count only if they
actually drive an implemented recommendation-relevant path. Coordinates alone
with no downstream use do not prove improvement over blank manual entry.

Proposed request limits: explicit submit, trimmed 3-100 character query, at most
five results, five-second timeout, streamed 128 KiB response cap, short cache,
bounded request frequency and explicit rate-limited result. Validate production
quota behavior across workers; a process-local limiter is not application-wide
enforcement. Do not print or change the existing NPS key during proof work.

Likely affected paths: new adapter/client/API route/tests; `types.ts`,
`trailpack-flow.ts`, `TrailPackShell.tsx`, missing-detail inputs, source summary,
and `packing.ts`. Do not weaken every catalog field to optional. Do not widen
AI or saved-result support accidentally. Live weather currently accepts catalog
IDs and alerts use supported park codes; extending those services to arbitrary
lookup results is a separate estimated 6-10 hours. The minimum path may use
clearly unavailable weather/alerts and a verified duration-driven rule result.

Stop this slice if the provider proof fails, terms or attribution cannot be
satisfied, useful results require prose/HTML scraping, usable fields do not
actually influence packing, credentials require new authority, or reliable
identity is impossible. Report that outcome rather than shipping ambiguous
results. A source gate failure must lead to a newly approved source or an
explicit scope decision, not a false completion claim.

## B-02: guarded live explanations

### Core and production acceptance matrix

Controlling clauses: 499B B-02 and production addendum; [issue 26](https://github.com/jaredsrice/TrailPack/issues/26);
[production rollout record](../../archive/validation/2026-08-29-production-guarded-ai-rollout.md).

| Criterion | Status | Evidence or gap |
|---|---|---|
| Rule engine creates complete baseline first | Pass, current | `TrailPackShell.tsx:621`; generation precedes optional review |
| Optional live structured provider path | Pass, current; live success historical | `ai-provider.ts`; August 29 preview and production accepted reviews recorded |
| Exact runtime schema and bounded parsing | Pass for structural schema | `ai-contract-runtime.ts:94`; schema validity alone is not semantic truth |
| Cannot add/remove items, change priorities or evidence labels | Pass for structural baseline | `ai-contract.ts:176`; provider cannot mutate packing authority |
| Provenance and safety validation before display | **Fail** | Three unsupported claims accepted through provider boundary, detailed below |
| Record accepted/rejected/timeout/fallback/provider errors | Pass, current | Provider/route outcome types and tests |
| Quota, missing key, malformed response and failures keep usable deterministic list | Pass, current | Focused route/provider suite; guest baseline independent |
| AI text visibly distinguished from deterministic output | Pass, current | `ai-review-display.ts` and `AiReviewPanel.tsx` |
| Deterministic saved fixtures/template fallback | Pass, current | Contract/provider tests |
| Demo structured input, accepted live response, rejected response, reason and unchanged fallback | Partial | Historical live acceptance; current rejection reason not rendered; new demonstration needed after repair |
| No unnecessary personal data sent | **Fail for free-text boundary** | Notes excluded, but raw start time, expected duration and trail-condition strings forwarded |
| Server-validated account identity; browser cannot override identity/count/reset | Pass, current code/tests | `ai-review-quota.ts:24`, route tests; B-03 login itself not retested |
| At most five reviews/hour, atomic across workers | Pass in current migration/tests; historical infrastructure evidence | `supabase/migrations/20260830000000_dedupe_ai_review_generations.sql`; fresh live concurrency not run |
| Blocked or exhausted request never reaches provider | Pass, current tests | Signed-out, duplicate, exhausted and unavailable route fixtures |
| Stable-input auto requests and separate refresh | Superseded | 0.6.1 Generate/Update correction controls: edits make zero calls; one deliberate generation ID requests one review |
| Fails-if: AI required, personal-data excess, unsupported safety prose, unvalidated baseline changes | **Overall fail** | Optionality and structural baseline pass; text and input-minimization failures remain |

### Reproduced failure, not a hypothetical concern

Starting from a valid deterministic contract, a mocked provider returned each
of these synthetic statements separately in `tripSummary`. All three returned
`accepted` with an empty validation-reasons list:

1. `Jenny Lake Loop is closed due to a grizzly bear and avalanche danger, but you will be safe on this hike.`
2. `You can leave your bear spray at home for this trip.`
3. `Jenny Lake Loop is 99 miles long.`

These are deliberately false test inputs, not trail advice. The exact item set
and labels remained valid, so the guard accepted the prose. The UI renders
`tripSummary` directly. The current safety blacklist at `ai-contract.ts:308`
does not establish fact provenance or prevent advice contradicting an essential
item. Prompt instructions are not a substitute for validation.

Separately, the agent placed synthetic personal/medical sentinel text in the
free-text `startTime`, `expectedDuration` and `trailConditions` inputs. It reached
the mocked outbound provider body at `ai-provider.ts:362`. This demonstrates a
data-minimization weakness; no real personal data was used or transmitted.

`AiReviewPanel.tsx` also omits `validationReasons`. An API-level reason exists,
but the normal screen does not currently show the specific reason required for
the demo. This is a demo/observability gap, not another baseline mutation.

### Recommended repair: server-owned facts and text

Use AI to select or rank useful explanation/fact IDs from a server-generated
approved set. Resolve all displayed wording from that set after validation.
Do not echo arbitrary provider-authored factual prose. This is deliberately
narrower than free-form rewriting and still provides a constrained
explanation/refinement path under current B-02. Confirm that this reduced
expressiveness is acceptable before implementation; do not claim it delivers
original SH-04 list variants.

| Slice | Deliverable | Exit test | Estimate |
|---|---|---|---|
| B02.1 Contract redesign | Approved explanation/fact IDs and deterministic renderer; provider selects useful distinctions only | Unknown/duplicate IDs, invalid cardinality, injected strings and IDs not present for this trip reject; output text originates only from approved server entries | 4-6h |
| B02.2 Input minimization | Omit raw trip text; send only necessary locally derived flags/buckets | Sentinel names, phone/medical strings, notes and identifiers absent from serialized provider payload; canonical facts still sufficient | 1-2h |
| B02.3 Safe outcome details | Bounded enumerated rejection reason visible in existing details panel | Rejected review shows safe reason and unchanged fallback; no raw provider payload/error/PII rendered | 1-2h |
| B02.4 Adversarial and regression suite | Counterexamples across every output field, deterministic generation/quota tests | Zero accepted malicious cases in the defined corpus; baseline item set/order/priorities/labels/missing facts identical; edits zero calls, new generation one call, retry zero extra provider calls | 3-5h |
| B02.5 Release acceptance package | Full checks, browser demonstration, source/config/privacy/cost notes, updated current scope addendum | Structured input, accepted mock, rejected mock, visible reason and fallback demonstrated; authorized live acceptance captured separately | 3-5h |

Total 12-20 hours. A finite test corpus is a regression gate, not proof that all
possible natural-language claims are safe. Structural elimination of untrusted
displayed prose is the key control. Adding a longer blacklist or a second model
judge alone is not the recommended repair.

No paid AI call is needed for local regression tests. To claim the repaired live
path passed, run one authorized signed-in preview acceptance with credentials
already configured and a recorded allowance state. This is a B-02 provider
check, not reopening the user's passed Google-login requirement. If live access
is unavailable, report local pass/live unverified separately.

## B-02 supporting task: NPS source integrity

| Original success/demo/fails-if clause | Current evidence | Status/action |
|---|---|---|
| Monthly non-runtime check of known official pages | `.github/workflows/nps-source-integrity.yml` scheduled workflow | Pass; no user-flow page scraping |
| Cover every profile with a saved NPS URL | 50 direct official profiles checked; two calculated mixed itineraries reuse parent sources | Document derived-parent coverage explicitly; do not fabricate independent official mixed-route snapshots |
| Compare distance, gain, duration, difficulty, route wording and extractable accessibility | `nps-source-integrity.ts`; reports retain unsupported/missing extraction states | Pass for supported fields; do not silently treat skipped extraction as observed equality |
| Reviewable changed, removed/fetch, parse/config and update outcomes | JSON/Markdown report generation | Pass, current |
| Fixtures for unchanged, changed, missing field and changed layout | `nps-source-integrity.test.ts:39` | Pass, current |
| Two matching fetches, valid types/ranges, full gate before applying | Refresh planner and workflow tests | Mostly pass; valid `Very Strenuous` is incorrectly blocked |
| Only managed snapshot can be automatically written | Script/publisher job stage snapshot only; protected PR flow | Pass; catalog/geometry/rules remain outside write scope |
| Show published trail-specific accessibility | `TrailProfileSummary.tsx:149` | Pass; absent source information remains a visible gap |
| Demo report, confirmed small update, inconsistent/implausible no-write | Current report plus fixtures exist | Repeat bounded fixture demonstration after fix; no live snapshot mutation needed for test |
| No catalog expansion, outside writes, single-response update, parse-as-truth or gate bypass | Planner/workflow safeguards | Pass in inspected code/tests |
| Bounded remote response, additional robustness gate | CLI measures body only after `response.text()` | Gap: post-allocation check is not a streamed cap |

The agent reproduced a confirmed Paintbrush distance change from 19.9 to 20.0
miles being blocked solely because its existing `Very Strenuous` difficulty is
absent from `nps-source-refresh.ts:181`'s allowlist.

Plan, 3-4 hours:

1. Align allowed difficulty values with the real admitted catalog. Add an exact
   Very Strenuous profile regression, plus invalid-difficulty and out-of-range
   changes that must remain blocked.
2. Replace the CLI's post-buffer 1 MB check with bounded streaming and early
   cancellation. Test over-limit chunked input, timeout, bad status and malformed
   page, while preserving no-write behavior.
3. Test two matching responses update only the managed snapshot in a temporary
   fixture; mismatched responses and parse failures leave it byte-identical.
4. Add a documented/tested parent-source mapping for derived profiles and record
   which fields are intentionally estimated or unavailable. Do not broaden
   official-source claims for the two mixed itineraries.
5. Run full gates and retain the report/diff. Any actual snapshot update follows
   the existing protected PR workflow, not a direct push to main.

## B-04: final cybersecurity verification

This is verification, not another nice-to-have feature. The [August 28 review](../../archive/validation/2026-08-28-b04-cybersecurity-review.md)
is valid historical evidence for its frozen `30f183c` candidate. It is not a
fresh full review of `72593bc` or the planned provider/AI changes.

| Required method or acceptance clause | Existing proof | Remaining work |
|---|---|---|
| Agent-assisted code review with independent verification | Dated review methods and verified finding dispositions | Review changed trust boundaries; independently reproduce proposed findings |
| SonarQube or comparable static analysis | CodeQL documented historically and green for current commit | Retain final-commit CodeQL/dependency/secret aggregate evidence |
| OWASP Top 10 and relevant CWE/SANS Top 25 coverage | Historical mapping table | Update mapping for new lookup input/provider handling and AI data flow |
| Burp or comparable deployed dynamic testing | Historical passive ZAP 2.17 crawl of 72 URLs | Authorized bounded passive preview rerun; do not claim passive scanning proves active exploit resistance |
| Manual auth/authorization/input/secrets/abuse/leakage/error checks | Historical manual checks and retests | Guest/API delta and B-02 server identity checks; reference user-passed B-03, do not repeat login/saved-results walkthrough |
| Report scope, environment, tools, severity, remediation, accepted risk and retests | Historical sanitized report has each field | New dated final-commit delta report with explicit exclusions |
| No unresolved critical/high at submission | Historical pass; current automated alert counts zero | Cannot establish comprehensive current pass until final delta review and disposition |
| Medium/low fixed or justified; fixes retested | Historical findings/risk table | Recheck inherited risks relevant to changes and record new dispositions |
| Sanitized report without secrets/personal data/dangerous unnecessary details | Historical report deliberately sanitizes findings | Preserve that policy; sanitized evidence is sufficient |
| Demo summary, one remediation/retest and residual-risk statement | Historical report supports it | Show updated report and one current retested example |
| Fails-if unauthorized testing, copied unverified findings or serious unresolved issues | No historical trigger established | Freeze exact authorized target and scope; independently verify all new findings |

Feasible final delta plan, 5-8 hours before remediation of unknown findings:

1. Freeze release candidate, preview URL, authorization and exclusions.
2. Review provider/AI/NPS/workflow changes with independent finding validation.
3. Retain static analysis and dependency/secret results for that exact commit.
4. Update the OWASP/CWE delta checklist and run authorized passive dynamic checks.
5. Manually exercise guest/API malformed input, response bounds, error leakage,
   cache and abuse handling. Verify signed-out/invalid-session B-02 requests
   stop before quota/provider work and browser identity cannot override the
   validated server identity. Retain current automated authorization/RLS evidence
   without repeating the user-passed Google login/save lifecycle. Do not target
   third-party providers with attacks.
6. Fix confirmed in-scope findings only under implementation authorization,
   retest, and write the sanitized report with residual-risk decisions.

Inherited CSP inline allowances already have a documented risk decision. Do not
launch an unrelated frontend rewrite as part of this bounded acceptance plan.
If new findings expand the necessary scope, estimate and obtain direction before
continuing. Final security acceptance belongs after B-01/B-02 changes, not before.

## Retained nice-to-haves: verify rather than rebuild

### SH-02 expanded coverage

Original success is additional trails **or** regions, with source quality and
fallback preserved, not a mandatory multi-region count. Current inventory has
39 discovery entries and 52 route profiles in one park, compared with the
initial three. `trail-catalog.test.ts` checks source/model integration and
generation for admitted NPS profiles. Mixed itineraries explicitly retain
estimated geometry and unverified gain/accessibility.

Nomenclature caveat: the original description says more curated profiles, but
the code reserves `profileKind: curated` for the original three. The additional
profiles are reviewed stored public-source imports or calculated mixed routes.
The broader success clause is substantively met; the exact internal category
name has not expanded. Do not imply all 52 have the curated discriminator.

Acceptance, 0.5-1 hour: choose a non-initial direct NPS profile such as Leigh
Lake; inspect name/park/state/distance/gain/route/duration/difficulty and working
source labels; Generate essential/optional output; force weather/alert
unavailability and confirm usable labeled fallback; check desktop/mobile and
keyboard access. The fail conditions are weakened provenance, inadequate facts
or degraded output, not absence of a second park. If these checks pass, record
verification only; no feature development is required.

### SH-03 one extra context signal

Use the Grand Teton wildlife signal as the acceptance case. `packing.ts:1714`
adds essential bear spray for supported Grand Teton profiles, marks the effect
as Wildlife, and retains Official plus Inferred labels and an NPS URL.
`packing.test.ts:935` checks this provenance. NPS currently recommends bear
spray throughout the park and keeping it accessible:
[NPS bear safety](https://www.nps.gov/grte/planyourvisit/bearsafety.htm).

Acceptance, 0.5 hour: demonstrate the supported regional context, affected item,
reason and working official source; contrast an unsupported manual hike that
does not invent Grand Teton-specific wildlife context. An unsupported region
must not inherit the park's official claims. This meets the original one-signal
minimum without adding water, cell coverage, remoteness and sentiment too.

Do not use the app's March 15-August insect window as proof of established
regional risk. The code infers that window; generic prevention guidance does
not establish those specific regional dates. An optional 2-4 hour wording/source
cleanup could distinguish general prevention from local seasonal evidence,
but it is not necessary to satisfy SH-03 through the bear-context example.

### Proposal official alerts

The proposal treats official alerts as nice-to-have; Week 12 MH-02 makes the
alert-state behavior mandatory. Count the idea once across documents.
`external-context.test.ts:599` covers active, no-active, unavailable, cache and
timeout behavior; browser fixtures in
`tests/accessibility/trailpack-accessibility.spec.ts` exercise source labeling,
recommendation effects and honest park-wide relevance limits. The August 29
live-alert correction records successful production retrieval historically.

Acceptance, 0.5 hour: show a current production official-alert or explicit
no-active state, use a saved active fixture to demonstrate its list/caution
effect, and simulate unavailable service while keeping Generate usable. Clearly
distinguish park-wide notice from confirmed selected-trail impact. Fail if
unavailability is presented as no alerts, unsupported trail impact is invented,
or guest generation depends on service success. No new alert feature is planned.

## Separately queued extension: original SH-04 variants

This is not needed to repair current B-02. It is on the owner's docket for a
feasible plan, but implementation would extend the explanation-only production
scope and must be explicitly approved before changing that behavior.

Original success: compare/rank/refine multiple packing-list variants, produce
one refined version secondary to the rule-based baseline, and record accepted
or rejected changes. Original fails-if: bypass baseline, unsupported safety
claims, or changes without validation.

Recommended minimum, 12-20 hours after B-02 guards pass:

1. Define a small set of actual list variants generated by deterministic rules.
   Preserve all essential/safety items. Any optional inclusion or omission must
   be authorized by an explicit rule and have a reason; no AI-invented item facts.
2. Send only approved variant/change IDs to AI for comparison/ranking. Validate
   IDs, dependencies, permitted differences and invariant preservation. Do not
   equate ranking explanation sentences with ranking packing-list variants.
3. Display baseline beside the selected variant and a per-change ledger of
   accepted/rejected/no-change decisions. Keep the baseline available and do
   not silently replace it. Invalid AI output returns the baseline.
4. Demonstrate at least two meaningfully different valid lists for one trip,
   one accepted rule-authorized optional change, one rejected essential removal,
   and unchanged evidence/source/priority authority. Use stable fixtures for
   accepted, rejected, timeout and unavailable states, then an authorized live
   demonstration if selected for delivery.
5. Add unit/UI/a11y tests and update current scope/user documentation. Keep
   persistence unchanged unless variant saving is separately requested.

Suggested slices: variant/change contract 3-5h; guarded selection/ledger 3-5h;
comparison UI 3-5h; tests/demo/docs 3-5h. Stop if meaningful safe variants cannot
be generated without weakening essential-item rules or inventing unsupported
tradeoffs. Cosmetic explanation changes alone do not meet original SH-04.

## Deferred reference only: SH-06 guest email/export

Guest export was explicitly deferred in the 499B specification because saved
results moved to B-03. The inspected documents do not establish a technical
blocker or an instructor-mandated removal. It remains absent and is not activated
by this plan.

If the owner selects it later, the smallest compliant path is a client-only
Download packing list (.txt) action, not backend email. Original SH-06 expressly
allows a downloadable copy or another no-account saved-result format.

Conditional plan, 4-6 hours: pure snapshot serializer and tests; accessible output
button using a temporary object URL with cleanup; browser download/no-network
assertions; docs. Include selected trail, generated timestamp, displayed trip
inputs, alerts, essential/optional groups, reasons and source labels. Export the
last generated snapshot, not unsaved edits or another user's saved state.

Pass: guest download works without login or provider call, file matches displayed
snapshot, regenerated list exports new content, filename is safe, keyboard/mobile
flow works. Fail: unnecessary email collection, private-data publication,
account requirement or hidden network delivery. Backend email would additionally
need abuse controls and is not part of this minimum.

## Delivery sequence and final gate

| Order | Work package | Dependency / decision |
|---|---|---|
| 1 | B-02 explanation guard, minimization and visible reason | Review the proposed approved-ID design before implementation |
| 2 | NPS maintenance repairs | Independent small patch; preserve bounded snapshot-only workflow |
| 3 | B-01 provider proof | Stop/go gate; no full lookup implementation if source fails |
| 4 | B-01 thin vertical slice | Source proof passed; supported/manual baseline remains independent |
| 5 | Coverage, extra-context and official-alert demonstrations | Verification only unless a concrete regression is found |
| 6 | SH-04 variants, if owner wants this queued extension delivered now | Separate scope approval; requires repaired B-02 first |
| 7 | B-04 final delta review and acceptance report | Freeze candidate after all chosen changes |

Core repair/live-lookup/verification envelope: approximately **41-66 hours**,
excluding separately queued SH-04, deferred export, optional arbitrary-result
weather/alerts, and unknown security remediation. Provider proof can stop work
early. No general map, route builder, multi-region expansion or broad code-quality
rewrite is included.

For each implemented package, run relevant focused tests and then the existing
full gates: lint, unit tests, typecheck, build, and documentation-link check.
Run accessibility/browser checks for changed interactions and scenario/system
stress checks for packing/data changes. Keep fixture evidence distinct from
live evidence. Run live NPS checks only as explicitly scoped provider/maintenance
verification; do not apply snapshots as a side effect of a read-only audit.

Each final acceptance record must identify requirement/subcriterion, exact
commit, environment, input/fixture, expected outcome, actual outcome, artifact,
pass/fail and residual gap. Retain at least one failure/fallback demonstration,
not just a happy-path screenshot. Add a current scope addendum for superseded
behavior; preserve original proposal/spec/archive wording.

Update README and CHANGELOG when implemented capabilities change, then use the
normal protected PR and verified deployment workflow only when release is
authorized. Keep changes in independently reviewable patches; rollback should
restore the previous provider/AI path without disturbing catalog, login or saved
data. No irreversible schema migration is needed for the proposed minimums.
