# TrailPack CSE 499B Schedule

Created: July 16, 2026  
Status: Working plan for the next senior-project course  
Requirements source: `docs/superpowers/specs/2026-07-16-cse-499b-requirements.md`

## Planning Basis

CSE 499A is closed with all six Week 12 must-have requirements complete. This
schedule replaces the older open-ended 499B candidate backlog with three product
requirements and one late verification requirement:

1. B-01 permission-compliant public trail lookup.
2. B-02 advanced guarded AI refinement.
3. B-03 Google login and private saved results.
4. B-04 cybersecurity testing, remediation, and reporting after the product
   surface is stable.

The rule engine, three curated profiles, saved demo fixtures, manual fallback,
and guest workflow remain the stable baseline. Security testing is deliberately
scheduled late; it is not part of the CSE 499A closeout.

## Delivery Rules

- Keep one implementation slice active at a time.
- Preserve a working guest rule-based flow after every merge.
- Do not add a public trail source until its access and reuse terms are recorded.
- Do not let AI change the packing set, priority, safety classification, or
  provenance without deterministic validation.
- Do not start persistent user data until the auth and ownership model is written.
- Confirm deployment with a reachable URL and live check; repository intent is
  not proof of a current deployment.
- Run security testing only against an authorized local or designated test
  environment.

## Fourteen-Week Schedule

| Week | Focus | Required Output / Exit Gate |
|---|---|---|
| 1 | Re-baseline and environment confirmation | Review the 499B requirements, confirm the current production or preview deployment, record environment variables and provider accounts without exposing secrets, and open issues for B-01 through B-04. |
| 2 | Public trail-source feasibility | Compare permission-compliant candidate sources, record access terms, response fields, quotas, attribution, and fallback behavior, then select one source or document an instructor-approved scope adjustment. |
| 3 | B-01 provider adapter and normalization | Implement the server-side client, provider contract, normalized trail mapping, provenance, and fixture tests without changing the UI search flow yet. |
| 4 | B-01 search and fallback UI | Add external results to search, preserve curated result priority, show source and missing-data labels, and route no-result/error states to manual entry. |
| 5 | B-01 verification and UAT | Test success, partial data, no result, provider failure, and rate-limit behavior; complete a hiker walkthrough and close B-01 defects. |
| 6 | B-02 live provider boundary | Select the approved AI provider, add server-side configuration, schema validation, timeout/error handling, and mocked contract tests. No user-facing AI result is accepted yet. |
| 7 | B-02 guarded refinement UI | Add accepted/rejected/fallback display, preserve the rule-based list, and make the validation result understandable without exposing internal prompts or secrets. |
| 8 | B-02 validation and midpoint demo | Run accepted, rejected, timeout, quota, and missing-key scenarios; demonstrate B-01 and B-02 together and resolve midpoint feedback. |
| 9 | B-03 auth and data design | Define saved-result fields, retention, ownership rules, guest behavior, OAuth flow, test users, and managed storage before implementing persistence. |
| 10 | B-03 Google login and persistence | Implement sign-in/sign-out and save/revisit/delete for one result while keeping the full guest workflow available. |
| 11 | B-03 authorization and integration | Add per-user access tests, cross-user denial tests, session/error handling, and an integrated two-user walkthrough. |
| 12 | Release candidate and security plan | Freeze new product scope, stabilize deployment, update dependency/runtime baselines, define the authorized B-04 test environment, and prepare the testing checklist. Security execution starts only after this gate. |
| 13 | B-04 security testing and remediation | Run agent-assisted review, static analysis, OWASP/CWE review, Burp or comparable dynamic checks, and manual penetration checks; prioritize, fix, and retest findings. |
| 14 | Final UAT, documentation, and delivery | Complete security retests, final hiker UAT, production/browser verification, demo script, requirements traceability, final report, README/changelog, and portfolio summary. |

## Requirement Milestones

| Milestone | Target | Complete When |
|---|---|---|
| M1: 499B baseline accepted | End of Week 2 | Requirements, deployment state, provider feasibility, and issue breakdown are recorded. |
| M2: Public lookup complete | End of Week 5 | B-01 success, fallback, provenance, and UAT criteria pass. |
| M3: Guarded live AI complete | End of Week 8 | B-02 live, rejected, unavailable, and deterministic fallback paths pass. |
| M4: Saved results complete | End of Week 11 | B-03 guest, save, revisit, delete, and access-isolation criteria pass. |
| M5: Release candidate frozen | End of Week 12 | Required product scope is stable in the authorized test environment. |
| M6: Final verified delivery | End of Week 14 | B-04 report and retests are complete, UAT passes, and final docs match the deployed product. |

## Scope Gates And Contingencies

### Public Trail Source Gate

If Week 2 does not identify a permission-compliant source with enough usable
data, do not quietly substitute restricted scraping. Record the evidence and ask
the instructor to approve one of these bounded alternatives: a public-source
import prototype, an expanded manual lookup workflow, or a revised B-01 success
criterion.

### AI Provider Gate

If a live AI provider cannot be used within approved cost, privacy, or quota
limits, preserve the existing fixture contract and request an explicit scope
decision. Do not weaken validation to make the live demo pass.

### Authentication Gate

If Google OAuth or storage setup blocks Week 10, complete the ownership model,
data schema, and local/fixture authorization tests first. Do not introduce custom
password storage as a shortcut.

### Security Gate

B-04 starts only after the release-candidate environment is authorized and
stable. Findings may force targeted feature changes, but unrelated product
features do not reopen after Week 12.

## Weekly Verification Baseline

For every implementation week:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Run `npm run scenario:stress` whenever recommendation behavior or AI-facing
explanation data changes. Run focused browser checks whenever the search,
recommendation, auth, or saved-result workflow changes.

