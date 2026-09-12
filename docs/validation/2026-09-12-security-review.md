# Final candidate security review

Date: September 12, 2026. Status: final deployed and static checks pending.
Scope: the `codex/required-completion` candidate, its test website, and the
approved shared-database changes. Main and the production website are not
being published by this review.

## Method

An Astra High reviewer independently inspected source and trust controls.
The coordinator and Sol High tester checked findings and retested repairs.
Reviewers inspected actual code and tests, not only implementation summaries.
When the reviewer authored a fix, another agent checked it afterward.

Local checks include request/response limits, server-validated identity,
private saved-result routes, source labels, AI payloads, failure responses,
dependency auditing and selected secret patterns. Embedded PostgreSQL tests
execute the actual migrations with synthetic users and permissions. Hosted
read-only schema checks verify deployed definitions and grants without reading
private saved records. Final CodeQL and passive ZAP results will be recorded
against the frozen candidate below.

## Findings and fixes

| Finding | Severity | Repair and retest |
|---|---|---|
| SEC-10: incomplete AI and authenticated save uploads had no application read deadline (CWE-400) | Medium | Added two-second deadlines; stalled-upload tests verify controlled rejection, cancellation and no downstream quota/provider/database write |
| SEC-11: authenticated users retained unused saved-table TRUNCATE, REFERENCES and TRIGGER rights (CWE-732) | Medium | Owner approved removing exactly those rights. A new migration and hosted readback retain only SELECT/INSERT/DELETE. No browser-accessible TRUNCATE path was demonstrated |
| Malformed NPS alert JSON could become an official no-alert result (CWE-20) | Medium | Validate the response envelope and every returned alert before normalization; invalid counts, records or supplied park identity fall back to unavailable |
| Source redirects were checked only after automatic following (CWE-918 defense) | Low | Check each HTTPS NPS destination before requesting it, cap redirects and retain one read deadline; external and looping redirect tests pass |
| Failed daylight/alert bodies were not discarded | Low | Release bodies on failed HTTP responses; rejected or non-settling cancellation does not block fallback |

The broader audit also repaired dated-weather provenance and account error
states. These are described in the [final audit](2026-09-12-final-audit.md).
The original arbitrary AI prose path was replaced with approved highlight IDs:
the provider cannot supply new safety wording, packing changes or evidence labels.

## Remaining risks

- **Medium, retained:** the existing Next.js CSP permits inline scripts and
  styles. The prior accepted decision remains: no user-authored HTML, React
  escaping, no production `unsafe-eval`, restricted script sources, object/base
  controls and frame denial. Nonces or hashes belong in a measured rendering
  change, not a late cosmetic rewrite.
- **Medium, bounded availability risk:** anonymous callers can consume the
  shared public lookup budget. The database cannot be read or reset by them;
  exhausted lookup falls back to manual planning. This design limits upstream
  usage but is not identity-based protection or a distributed load test.
- Provider outages, changing official pages and incomplete data remain possible.
  Unknown or failed checks must remain unavailable rather than appear clear.

## Relevant OWASP and CWE coverage

| Area | Evidence |
|---|---|
| Access control; CWE-639/862 | Server identity checks, owner filters, RLS, synthetic cross-user read/delete/spoof denial and hosted grants |
| Cryptography and secrets; CWE-200/319 | HTTPS provider addresses, server-only private keys, bounded secret checks; hosting encryption is managed-platform behavior |
| Injection; CWE-79/89 | React text rendering, structured database client calls, bounded JSON and no provider-authored displayed HTML |
| Insecure design and abuse; CWE-400 | Fail-closed atomic quotas, cache limits, request deadlines, stream caps and independent guest fallback |
| Misconfiguration; CWE-732/693 | Least-privilege migration, response headers, CSP risk decision and exact callback allowlist |
| Vulnerable components | Locked dependency audit and final GitHub dependency alerts |
| Authentication; CWE-287/601 | Server-validated Google identity, PKCE callback and same-origin redirect validation |
| Integrity; CWE-20 | Approved AI IDs, source/date/park validation, repeated NPS comparison and protected CI |
| Logging and privacy; CWE-532 | No raw trip notes, identity or tokens in AI input; sanitized reports and safe failure messages |
| SSRF; CWE-918 | Fixed runtime provider endpoints, restricted returned links and validated maintenance redirects |

## Final evidence

- Commit and Preview: pending final freeze/deployment.
- Unit and integration: 887 tests across 61 files pass locally.
- Database: owner lifecycle/isolation tests pass; hosted grants and all seven
  migration records verified. The reconciliation changed no saved records.
- Dependencies: initial final-pass audit found zero known vulnerabilities.
- Static analysis and passive deployed scan: pending the exact candidate.
- Manual hosted account/provider acceptance: pending the exact candidate.

The August 28 real two-account test remains historical evidence. Synthetic
database tests are a new regression check, not a newly performed two-person
hosted walkthrough. No destructive scan, live quota exhaustion or unrestricted
external crawl is authorized or claimed.

No critical or high-severity issue has been confirmed in the reviewed source.
This is not final B-04 completion until the pending checks above are recorded.
