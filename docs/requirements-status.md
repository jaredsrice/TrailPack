# TrailPack requirements inventory and current status

**Active planning authority:** Jared reaffirmed on September 12 that the
[CSE 499B specification](archive/project/specs/2026-07-16-cse-499b-requirements.md)
is what matters for current work. Its B-01–B-04 scope replaces the old stretch
list. The SH counts below are historical reconciliation, not an approved
implementation backlog. Alternative packing-list modes and guest export are
not required next steps.

Reviewed September 11, 2026. Original audit base:
`72593bc69e11b9fe3b4fc24a150b9a81f849eabf`. Updated after the authorized
`codex/required-completion` work and the September 12 production release. See
the [final audit](validation/2026-09-12-final-audit.md).

Current count: **6 baseline must-haves supported in production**;
**6 original nice-to-haves: 4 delivered and 2 not implemented**. This is not a
claim of six newly added production features.

## Counts and source authority

| Document | Must-have / required count | Nice-to-have count | How to use it |
|---|---:|---:|---|
| Initial Week 6 requirements | 20 functional requirements, not a final must-have count | No separate numbered list | Historical input; Week 12 explicitly consolidates this list |
| Proposal v9 | 8 must-have bullets | 4 nice-to-have bullets | Latest proposal-level scope; the eight baseline bullets map into Week 12 MH-01 through MH-06 |
| Final Week 12 requirements v6 | **6 must-haves** | **6 nice-to-haves** | Explicit numbered grading contract: MH-01–06 and SH-01–06 |
| Later 499B continuation specification | 4 continuation requirements, B-01–04, while preserving the six baseline requirements | Original stretch list replaced with selected continuation scope | Three product requirements and one security verification requirement; overlapping functionality must not be counted as separate features |

Formal documents remain outside the Git repository:

- Proposal: `/Users/jaredrice/Developer/Senior Project Local/Project Proposals/TrailPack_Proposal_v9.docx`.
- Final requirements: `/Users/jaredrice/Developer/Senior Project Local/Requirements Docs/Final/w12 Requirements Spec v6.docx`.
- Initial requirements: `/Users/jaredrice/Developer/Senior Project Local/Requirements Docs/Initial/w06_initial_reqs_jaredrice.docx`.

The [499B continuation specification](archive/project/specs/2026-07-16-cse-499b-requirements.md)
is the current completion authority, despite its archive location. The
[September 10 acceptance audit](superpowers/plans/2026-09-10-499b-acceptance-audit-and-development-plan.md)
and [current roadmap docket](roadmap.md#follow-up-docket) distinguish delivered
behavior, current defects, and queued extensions. The proposal's illustrative
multi-region coverage became reviewed Grand Teton coverage; this does not make
each illustrative park a separate unfinished requirement.

## Six must-haves: six supported in production

“Supported” below means current code, automated checks, and recorded hosted
acceptance support the implementation. Historical acceptance records remain intact.

| ID | Requirement | Current assessment | Remaining work |
|---|---|---|---|
| MH-01 | Supported hike selection and manual fallback | Supported: original three profiles remain; manual distance, gain, route, duration, and conditions feed recommendations | Retain supported/manual demo coverage; no missing feature identified in this reconciliation |
| MH-02 | Weather and official alert context | Supported: weather and active/no-active/unavailable alerts affect output with source and fallback labels | Retain live-or-fixture demonstration; saved fixtures are explicitly permitted |
| MH-03 | Essential/optional rule-based packing list | Supported: catalog and manual workflows generate output without AI | Retain short/easy, weather-affected, and incomplete-data scenarios |
| MH-04 | Reasons and source labels on recommendations | Supported for deterministic packing items: reasons and evidence labels are present; official labels require source URLs | Retain item-level demonstration; AI prose defect is recorded under MH-05 |
| MH-05 | Guarded AI contract, validation, and fallback | Approved ID selection, no raw-input forwarding, safe rejection, unchanged baseline, and practical live review are published | Retain accepted, rejected, and fallback regression coverage |
| MH-06 | Fallback and uncertainty handling | Supported: limited manual output, missing-detail prompts, and provider fallback paths remain available | Retain failed-service and incomplete-input demonstration; accepted false AI prose is counted under MH-05 rather than double-counted here |

The proposal's first three must-have bullets map to MH-01; weather maps to
MH-02; grouped packing to MH-03; explanations to MH-04; guarded AI to MH-05;
uncertainty to MH-06, with source labeling also covered by MH-04. There are not
eight additional baseline features to build on top of the six final requirements.

## Six original nice-to-haves: four delivered, two absent

| ID | Requirement | Current assessment | What remains |
|---|---|---|---|
| SH-01 | Live public lookup beyond supported profiles | Narrow NPS lookup is published: correct live record, partial facts, Generate/Update, source labels and empty-result fallback | Promoted into and completed through B-01; retain quota and fallback monitoring |
| SH-02 | Expanded supported trail coverage | Delivered in substance: 39 discovery entries and 52 route profiles versus the original three | Demonstrate an additional profile and fallback. Extra profiles are reviewed imports/calculated routes, not all the internal `curated` type; a second park is not required by the “additional trails or regions” success clause |
| SH-03 | One extra evidence-supported context signal | Delivered in substance through Grand Teton wildlife/bear context affecting the bear-spray recommendation, with official source and inference labels | Demonstrate the sourced effect; no requirement to implement every candidate signal such as water, cell coverage, or sentiment |
| SH-04 | AI comparison/refinement of packing-list variants | **Not delivered as written.** Current AI reviews explanations while packing decisions remain fixed | Historical requirement replaced by the 499B scope; not queued for this completion pass |
| SH-05 | Google login and saved results | Delivered; owner-passed production save/revisit/delete and separate-account privacy evidence | No new feature identified. Promoted into B-03; preserve access controls when other work changes |
| SH-06 | Guest email or export | **Absent and explicitly deferred from 499B** | If selected, one no-account preservation path, such as a text download, is sufficient. Backend email is not required |

The proposal has one additional named nice-to-have idea, official alerts. It is
already delivered and was included in Week 12 MH-02. Therefore the union of
nice-to-have ideas mentioned across the two formal lists is seven: four delivered,
one local candidate and two not implemented. That is not seven additional optional requirements today;
count alerts once and show their promotion to must-have scope.

## What the 499B continuation requires

| ID | Current position | Remaining obligation |
|---|---|---|
| B-01 | Published with the shared quota, partial NPS facts, manual fallback, and hosted checks | No missing requirement; no hosted exhaustion/load test was performed |
| B-02 | Published with approved fact selection, practical complete/incomplete reviews, unchanged rule-owned lists, and 50/50 NPS comparison evidence | No missing requirement; retain rejected and fallback regressions |
| B-03 | Published with sign-in and private save, revisit, delete, and sign-out evidence | No missing requirement; retain the one recovered library-read failure as a limitation |
| B-04 | Published after necessary repairs, privilege removal, full CI, CodeQL, automated review, and passive Preview scanning | No missing requirement; retain CSP risks and bounded scan limitations |

B-02 permits explanations, summaries, or variants; its production addendum
specifies explanation-only output. Original SH-04 variants are consequently a
separate extension. The Generate/Update correction supersedes the earlier
auto-on-edit/refresh interaction; do not reintroduce obsolete behavior.

The [final audit](validation/2026-09-12-final-audit.md) tracks the active finishing
pass: necessary repairs, complete tests, live acceptance, security evidence and
simple documentation. Jared approved publication, and PR #61 was merged to
`main` on September 12, 2026.
Original SH-04 variants and SH-06 export are not part of this completion pass.
Requirement counts are not percentages of the remaining effort.

## Original inventory evidence, before implementation

- Read the final Week 12 requirement clauses directly from v6, the proposal v9
  requirement lists and evaluation expectations, and the initial Week 6 document.
- Inspected the current catalog/search, packing, source-label tests, AI contract,
  provider request builder, and AI display component. Runtime catalog count is
  52 route profiles and 39 discovery groups.
- Ran the existing unit suite: **777 tests passed across 52 files**.
- Reproduced the September 10 AI findings through the current provider parser
  and guard using a fake key and an injected local fetch function. Three
  deliberately false synthetic summaries were each accepted with no validation
  reasons: a fabricated closure/safety claim, advice to omit an essential item,
  and a fabricated 99-mile distance. These were test inputs, not trail guidance.
- Synthetic markers in start time, duration, and trail conditions survived into
  the mocked outbound request body. No live provider call or real personal data
  was used. The UI still does not render the returned validation reasons.
- Existing tests passing does not establish the AI guard meets its requirements;
  the separate counterexamples demonstrate the uncovered acceptance failure.
- Login/privacy and owner UAT rely on the dated
  [August 28 delivery record](archive/validation/2026-08-28-cse-499b-closeout.md).
  Live provider/deployed browser/security tests were not repeated here. The NPS
  maintenance gaps use the September 10 audit of the same code commit.
- Academic submissions, hours, final demo delivery, and stakeholder contact
  completion cannot be inferred from feature delivery. Existing owner UAT is
  documented; administrative completion should be checked separately as needed.

## Current next step

The approved implementation, necessary audit and test pass are complete on the
review candidate. No additional feature selection is needed. Jared's test-site
review and separate production approval come next. Recommend Sol Medium, one
main agent, for explaining the results and recording owner feedback. Any new
implementation or release phase needs its own confirmed setup. See the
[handoff](project-handoff.md) for the preserved worktree.
