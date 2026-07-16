# TrailPack CSE 499B Requirements Specification

Jared Rice  
CSE 499B continuation working specification  
Updated: July 16, 2026  
Project repository: https://github.com/jaredsrice/TrailPack

## Document Purpose

This document defines TrailPack's planned CSE 499B scope. It preserves the six
must-have requirements completed during CSE 499A and replaces the old six-item
stretch list with the smaller continuation scope requested in instructor
feedback.

The submitted Week 12 version remains the historical CSE 499A grading contract:
`Requirements Docs/Final/w12 Requirements Spec v6.docx`. This document does not
rewrite that submission. It records what was completed, what changed after
instructor review, and what must be verified during CSE 499B.

## Revision Summary And Instructor Notes

The Week 12 specification contained six completed must-have requirements and six
stretch requirements. The updated scope makes these changes:

- Preserve MH-01 through MH-06 as the completed CSE 499A baseline.
- Promote live public trail lookup beyond the supported catalog into a CSE 499B
  product requirement.
- Promote advanced guarded AI refinement into a CSE 499B product requirement.
- Promote Google login and saved results into a CSE 499B product requirement.
- Remove expanded curated trail coverage as a separate requirement.
- Remove the generic extra-context-signal requirement.
- Remove no-account email or export as a separate requirement.
- Add a separate cybersecurity testing, remediation, and reporting requirement.

The cybersecurity requirement is included for future planning, but its testing
work is explicitly deferred during the July 2026 CSE 499A closeout. It begins
only after the primary 499B features and deployed test environment are stable.

## Section 1: Product Definition

### Purpose

TrailPack helps day hikers turn trail facts, weather, official alerts, daylight,
and trip details into a concise packing list. Each recommendation shows a clear
action first and keeps the explanation and evidence available for users who want
the reasoning.

### Audience

TrailPack is designed for everyday day hikers, including people with limited
hiking experience who need specific, practical preparation guidance.

### Product Boundary

TrailPack supports day-hike planning. It does not replace current official park
guidance, emergency services, a navigation device, local judgment, or medical
advice. It is not an overnight backpacking, mountaineering, live rescue, or
real-time trail-condition service.

The generated list is a suggested item list, not a comprehensive checklist.
Needs vary by person, group, health considerations, route changes, and actual
conditions.

### Decision Authority

The deterministic rule engine remains the source of truth for packing items,
priority, safety classification, and source labels. AI may explain or propose
refinements, but it cannot silently override the rule-based baseline. Official,
forecast-based, user-provided, inferred, missing, unavailable, and saved-fixture
evidence must remain distinguishable.

## Section 2: Completed CSE 499A Baseline

| Requirement | Status | Completion Evidence |
|---|---|---|
| MH-01 Supported Hike Input Workflow | Complete | Three supported Grand Teton profiles plus manual distance, elevation gain, route type, date, start time, duration, and condition input. |
| MH-02 Weather And Official Alert Context | Complete | Live-path Open-Meteo, Sunrise-Sunset.org, and NPS route handlers; saved fixtures; visible active, no-alert, and unavailable states. |
| MH-03 Rule-Based Baseline Packing List | Complete | Deterministic essential and optional output for supported profiles and manual fallback without AI. |
| MH-04 Recommendation Explanations And Source Labels | Complete | Grouped accordion recommendations with clear actions, expandable reasons, context markers, and source labels. |
| MH-05 Guarded AI Contract And Fallback Validation | Complete by accepted fixture path | Structured fixture-first review, validation, rejection behavior, and template fallback. Live AI was optional under the Week 12 contract. |
| MH-06 Fallback And Uncertainty Handling | Complete | Manual fallback, missing-detail prompts, unavailable-service states, saved fixtures, and AI fallback remain usable and labeled. |

The CSE 499A completion record is
`docs/superpowers/validation/2026-07-16-cse-499a-closeout.md`.

## Section 3: CSE 499B Product Requirements

### B-01: Permission-Compliant Public Trail Lookup

TrailPack must let a user search for at least one day hike outside the curated
three-trail catalog using a reliable source whose access and reuse terms permit
the application workflow. Retrieved data must be normalized into TrailPack's
existing trail model and retain source URLs, retrieval status, and confidence or
missing-data notes.

The minimum usable result includes a trail name and location plus enough of the
following to improve the recommendation over blank manual entry: coordinates,
distance, elevation gain, route type, expected duration, difficulty, or official
park association. Missing values must remain visible and may be completed through
the existing manual-entry path.

Success:

- At least one trail outside the curated catalog can be found and selected.
- Retrieved facts are labeled by source and are not represented as official NPS
  facts unless they came from a verified NPS source.
- The normalized result produces a packing list and prompts for important gaps.
- A provider failure or no-result response falls back to manual entry without a
  dead end.

Demo:

Search for an unsupported trail, select a provider result, inspect the source
and missing-data labels, add one missing trip detail, and generate the list.
Then demonstrate a provider-failure or no-result fallback.

Fails if:

The feature relies on scraping or an unauthorized source, hides the original
source, treats incomplete data as confirmed, or breaks the supported-profile and
manual workflows.

### B-02: Advanced Guarded AI Recommendation Refinement

TrailPack must add a constrained live AI provider path that uses the existing
structured contract. The rule engine must create the full baseline first. AI may
rewrite explanations, summarize trip-specific distinctions, or propose a clearly
separated refined variant. Every result must pass schema, provenance, packing-set,
and safety validation before display.

The system must record whether the result was accepted, rejected, timed out, or
replaced by fallback. Provider errors, quota limits, missing keys, and invalid
responses must leave the rule-based list fully usable.

Success:

- At least one supported scenario receives a live AI explanation or refinement.
- The UI distinguishes the rule-based list from AI-assisted text.
- Tests prove that AI cannot add or remove packing items, change priorities,
  relabel evidence, or introduce unsupported safety claims without explicit rule
  validation.
- Saved fixtures and template text remain deterministic fallbacks.

Demo:

Show the structured input, one accepted live response, one rejected response,
the validation reason, and the unchanged rule-based fallback.

Fails if:

AI becomes required for packing output, receives unnecessary personal data,
produces untraceable safety claims, or changes the baseline without validation.

### B-03: Google Login And Private Saved Results

TrailPack must offer Google sign-in for users who want to save generated packing
lists. Guest users must still be able to search, enter trip details, and generate
a complete list without an account. TrailPack must use provider-managed identity
instead of storing custom passwords.

Each saved result must be tied to the authenticated user and contain the selected
or entered trail summary, relevant trip inputs, generated recommendation result,
source labels, and creation time. A user must be able to view and delete their
own saved result. Access checks must prevent one user from reading or modifying
another user's data.

Success:

- Google sign-in and sign-out work in the deployed test environment.
- A signed-in user can save, revisit, and delete at least one packing result.
- Guest generation remains available.
- Authorization tests verify per-user isolation.
- Stored personal and trip data is minimized and protected by the managed
  platform's encryption and access controls.

Demo:

Generate a list as a guest, sign in with Google, save a result, revisit it after
navigation or a new session, delete it, and show that a different test user
cannot access it.

Fails if:

Login is required for the core workflow, TrailPack stores passwords, saved data
is publicly addressable, or cross-user access is possible.

## Section 4: CSE 499B Verification Requirement

### B-04: Cybersecurity Testing, Remediation, And Report

After B-01 through B-03 and the deployed test environment are stable, TrailPack
must receive a documented cybersecurity review. This is a verification
requirement rather than another user-facing feature.

The review must include:

- An AI-assisted or agent-assisted code review using Codex or a comparable
  review agent, with findings independently checked before changes are made.
- Static analysis with SonarQube or a comparable tool.
- Review against the OWASP Top 10 and the CWE/SANS Top 25 categories relevant to
  the application.
- Dynamic testing of the deployed test environment with Burp Suite or a
  comparable web-security tool.
- Manual penetration checks for authentication, authorization, input handling,
  secret exposure, API abuse, data leakage, and error behavior.
- A final report listing scope, environment, tools, findings, severity,
  remediation, accepted risk, and retest results.

Success:

- No unresolved critical or high-severity finding remains at final submission.
- Medium and low findings are remediated or documented with a justified risk
  decision.
- Fixed findings are retested.
- The final report does not expose API keys, tokens, personal data, or attack
  details that would unnecessarily endanger a live service.

Demo:

Show the sanitized findings summary, one remediation and retest example, and the
final unresolved-risk statement.

Fails if:

Testing is performed against a system without authorization, findings are copied
without verification, secrets or personal data appear in the report, or serious
findings remain unaddressed without an explicit decision.

Status at this revision: planned for late CSE 499B; not executed during CSE 499A
closeout.

## Section 5: Removed Or Deferred Scope

The following Week 12 stretch items are no longer separate 499B requirements:

- Expanded supported trail coverage. Additional curated profiles may be used as
  fixtures or acceptance examples, but profile count is not a primary goal.
- One generic extra context signal. New context is added only when required by a
  selected trail source or needed to make an existing recommendation accurate.
- No-account email or export. Saved results are handled through B-03; guest
  export can be reconsidered after the required scope is complete.

Also out of scope unless formally approved:

- Restricted-source scraping or use that violates provider terms.
- AI-generated packing decisions without the rule engine.
- Native mobile applications, overnight backpacking, social features, live GPS
  tracking, emergency dispatch, or a universal trail-condition guarantee.
- Broad recommendation rewrites that are unrelated to a documented defect or
  acceptance result.

## Section 6: Architecture And Data Constraints

### Application Boundary

TrailPack remains a Next.js and TypeScript application. External provider calls
that require credentials must run server-side. Keys and OAuth secrets must be
stored in deployment environment variables and must not be committed or sent to
the browser.

### Data Flow

1. The user selects a curated trail, public lookup result, or manual entry.
2. Trail facts, weather, daylight, alerts, and user input are normalized with
   provenance and availability status.
3. The rule engine creates the packing list and safety classifications.
4. The optional AI provider receives only the structured data required to explain
   or review the result.
5. Validation accepts the AI text or uses the deterministic fallback.
6. An authenticated user may save the result under their own account.

### Privacy And Retention

- Guest trip details remain client/session data unless the user explicitly saves
  a result after signing in.
- AI requests must exclude email addresses, OAuth tokens, account identifiers,
  and unrelated freeform personal information.
- Logs must not contain secrets, full OAuth responses, or raw sensitive user
  content.
- Saved data must be minimal, deletable by the owner, and protected by per-user
  authorization.

### Availability And Fallback

Public lookup, live weather, NPS alerts, daylight, AI, authentication, and data
storage are independent failure boundaries. An unavailable optional provider
must not prevent the rule-based guest workflow from producing a result from
available data.

## Section 7: Verification Plan

| Requirement | Primary Verification | Required Evidence |
|---|---|---|
| CSE 499A baseline | Existing unit, scenario, build, and browser evidence | Final closeout note and passing main branch |
| B-01 Public trail lookup | Contract tests, normalization tests, no-result/error tests, UI walkthrough | Source-labeled external result and manual fallback |
| B-02 Advanced guarded AI | Schema and validation tests, provider mocks, controlled live test | Accepted, rejected, unavailable, and fallback outcomes |
| B-03 Google login and saved results | Auth integration tests, data-access tests, two-user manual check | Guest path, save/revisit/delete, and cross-user denial |
| B-04 Cybersecurity review | Static, dynamic, manual, and agent-assisted review followed by retest | Sanitized findings and remediation report |

Every implementation pull request must pass lint, type checking, unit tests, a
production build, and relevant scenario or browser checks. Security testing is
scheduled only after the main feature surface is stable so findings apply to the
system intended for final delivery.

## Section 8: Completion Criteria

TrailPack is complete for CSE 499B when:

1. B-01, B-02, and B-03 meet their success and demo criteria or an instructor-
   approved scope change is recorded.
2. The deployed demo environment is confirmed rather than assumed from repository
   configuration.
3. The guest rule-based workflow remains usable when optional providers fail.
4. B-04 is executed, serious findings are remediated, and retest results are
   documented.
5. Final user acceptance testing confirms that important distinctions, safety-
   critical decisions, and recommendation explanations are clear to an everyday
   hiker.
6. README, changelog, proposal-alignment notes, demo script, and portfolio
   summary match the delivered system.

## Sources And Reference Documents

- Submitted CSE 499A requirements: `Requirements Docs/Final/w12 Requirements Spec v6.docx`
- CSE 499A requirements source: `Requirements Docs/Final/TrailPack_Week12_Requirements_Specification_Draft.md`
- Original project proposal: `Project Proposals/TrailPack_Proposal_v9.docx`
- CSE 499A closeout: `docs/superpowers/validation/2026-07-16-cse-499a-closeout.md`
- CSE 499B schedule: `docs/superpowers/plans/2026-07-16-cse-499b-schedule.md`
- NPS API documentation: https://www.nps.gov/subjects/developer/api-documentation.htm
- NPS Ten Essentials: https://www.nps.gov/articles/10essentials.htm
- Open-Meteo documentation: https://open-meteo.com/en/docs
- OWASP Top 10: https://owasp.org/www-project-top-ten/
- CWE Top 25: https://cwe.mitre.org/top25/
- SonarQube documentation: https://docs.sonarsource.com/sonarqube-server/
- Burp Suite documentation: https://portswigger.net/burp/documentation

