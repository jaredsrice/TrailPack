# B-04 Cybersecurity Review, Remediation, And Retest

Date: 2026-08-28 (America/Denver)  
Application release candidate: `30f183cd32d5841c0cca4ace606c4498e1775ac5`  
Authorized production target: `https://trailpack-ten.vercel.app`  
Status: Complete; no unresolved critical or high-severity finding. Two CSP
observations are accepted medium risk, and one public-static-asset CORS alert is
downgraded to informational after manual verification.

## Authorization, Scope, And Rules

The repository owner authorized review of the TrailPack codebase, GitHub
security configuration, managed Supabase schema, and deployed production site.
Testing covered the public guest flow and the already verified first-user OAuth
and saved-result lifecycle.

The dynamic run was deliberately passive:

- public HTTPS `GET` crawling and response analysis only;
- no active-scan job, fuzzing, credential guessing, forced browsing, or form
  submission;
- no destructive database operation or persistent test-data creation;
- no secret, token, OAuth response, email address, user identifier, or saved
  result included in this report; and
- database verification limited to aggregate/catalog booleans rather than row
  contents.

The first account is referred to only as **User A**. A genuinely separate
**User B** completed the production privacy walkthrough after the passive scan.
User B could not list User A's saved data, an authenticated RLS delete probe
affected zero User A rows, User A confirmed the row remained, and the temporary
acceptance row was removed by User A. No account identifiers or result UUIDs are
retained in this report.

## Tools And Evidence

| Review layer | Tool / evidence | Result |
|---|---|---|
| Agent-assisted review | Two independent Codex review tracks plus manual reproduction | Findings verified before remediation decisions; no critical/high auth bypass |
| Static analysis | GitHub CodeQL for JavaScript/TypeScript and Actions | Required checks passed; zero open alerts |
| Dependency analysis | `npm audit --json` and GitHub Dependabot | 0 vulnerabilities across 498 dependencies; 0 open alerts after merge |
| Secret exposure | GitHub secret scanning/push protection plus bounded current/history signature review | Enabled; 0 open alerts and no credential signature found |
| Dynamic analysis | OWASP ZAP `2.17.0`, updated add-ons including passive rules `75` | Passive plan succeeded; 72 URLs discovered; 0 critical/high/low categories |
| Browser verification | Production desktop, mobile, keyboard/accessibility, image, and core-flow checks | No broken carousel image or mobile overflow; guest plan populated |
| Header verification | Production HTTPS response inspection | CSP, HSTS, frame denial, MIME denial, referrer policy, and permissions policy present |
| Database verification | Supabase catalog/aggregate queries and real User B RLS probe after migration | Payload constraint, quota trigger, and security-invoker function all enabled; User B deleted 0 User A rows and the owner row remained |
| Regression suite | ESLint, TypeScript, Vitest, Firefox/axe, build, stress matrix, NPS integrity | 239 unit/integration tests, 3 accessibility flows, 27 scenarios, and 5/5 NPS checks passed |

The full ZAP export was retained only temporarily during review because it
contains repetitive endpoint-level detail. This checked-in record is the
sanitized report.

## Findings And Disposition

| ID | Severity | Finding | OWASP / CWE | Disposition and retest |
|---|---|---|---|---|
| SEC-01 | Medium | The OAuth callback accepted a backslash-prefixed `next` value that URL resolution could interpret as a cross-origin destination. | A01 Broken Access Control; CWE-601 | Fixed by resolving against the request URL and requiring the resulting origin to match. Regression tests cover the backslash case, protocol-relative input, encoded variants, query preservation, missing code, and successful exchange. |
| SEC-02 | Medium | Incoming request bodies and Gemini responses could be fully buffered before size checks. | A04 Insecure Design; CWE-400 | Fixed with a shared byte-counting stream reader, bounded error/success responses, prompt-size limits, and cancellation handling. Exact-limit, oversized, multibyte, declared-length, read-error, and cancellation-error tests passed. |
| SEC-03 | Medium | Authenticated clients could bypass the application route and write arbitrary or excessive own-account JSONB directly through Supabase. | A04 Insecure Design; CWE-20, CWE-770 | Fixed with exact canonical objects, a 64 KB database constraint, a serialized per-user 100-row quota, and a 100-row list cap. The production catalog returned all three safeguards enabled. |
| SEC-04 | Low | A rejected stream cancellation could turn the intended oversized-input result into a generic unreadable-input response. | A04 Insecure Design; CWE-755 | Fixed by treating cancellation as best-effort after the limit is known. Cancellation failure regression passed. |
| SEC-05 | Medium | `main` did not enforce full CI or static analysis before merge. | A08 Software and Data Integrity Failures; CWE-693 | Fixed with required Validate, CodeQL Actions, CodeQL JavaScript/TypeScript, and Vercel checks under `Protect Main`. The release commit passed every required check. |
| SEC-06 | Medium | The frozen dependency graph still had actionable GitHub/npm findings. | A06 Vulnerable and Outdated Components; CWE-1395 | Patched through supported maintenance updates and compatible overrides. Fresh npm and Dependabot queries both returned zero open vulnerability. |
| SEC-07 | Medium (accepted) | ZAP reported `script-src 'unsafe-inline'` and `style-src 'unsafe-inline'` in the CSP. | A05 Security Misconfiguration; CWE-693 | Accepted for this Next.js 15 rendering path. Compensating controls include no user-authored HTML, React escaping, same-origin script restriction, no `unsafe-eval` in production, `object-src 'none'`, `base-uri 'self'`, frame denial, exact JSON validation, and no inline third-party script. Revisit with per-request nonces or hashes during a framework-level rendering change. |
| SEC-08 | Informational after review | ZAP labeled wildcard CORS on three resources as a medium cross-domain misconfiguration. | A05 Security Misconfiguration; CWE-264 (scanner mapping) | The three instances were public immutable CSS, font, and icon assets only. No API response, authenticated data, credentialed CORS header, or private content was involved. No application change is warranted. |
| SEC-09 | Informational | ZAP noted normal modern-app and cache behavior. | A05 Security Misconfiguration; CWE-525 | Reviewed. Private saved and AI routes send `no-store`; cached items were public static/prerendered content. |

## OWASP Top 10 And Relevant CWE Review

| Category | TrailPack evidence |
|---|---|
| A01 Broken Access Control | Server identity comes from `auth.getUser()`, list/delete operations include the owner, and Supabase RLS independently enforces `auth.uid() = user_id`. Callback redirect validation is same-origin. Automated denial and the real two-account production walkthrough both passed. |
| A02 Cryptographic Failures | HTTPS/HSTS are active. Google and Supabase manage credentials and session cryptography; no custom password or service-role key is used by the runtime. |
| A03 Injection | Input is schema-checked and bounded, Supabase query builders parameterize values, and no request-controlled raw SQL, command, template, or provider URL is executed. |
| A04 Insecure Design | The deterministic rule engine remains authoritative; AI cannot alter item membership or provenance. Request, response, storage, and row-count limits now exist at both route and database boundaries. |
| A05 Security Misconfiguration | Production headers were verified and a current passive ZAP run was reviewed. The two bounded inline CSP allowances are the only accepted medium configuration risk. |
| A06 Vulnerable Components | Fresh npm and Dependabot results are zero. Node's supported floor is explicit and dependency validation is required in pull requests. |
| A07 Identification And Authentication Failures | Supabase OAuth PKCE, provider-managed Google identity, account chooser, cookie sessions, and server-side session validation are used. The first-user production lifecycle passed. |
| A08 Software And Data Integrity Failures | Protected pull requests require CI, CodeQL, and Vercel. The monthly NPS writer publishes an automation pull request instead of bypassing `main`. |
| A09 Security Logging And Monitoring Failures | Browser responses use generic failure states and avoid provider/database detail. GitHub security alerts, CI, Vercel deployment status, and Supabase health remain available without committing raw sensitive logs. |
| A10 Server-Side Request Forgery | Provider hosts and NPS trail URLs are code-controlled allowlists; public routes accept identifiers and bounded values rather than arbitrary upstream URLs. |

Relevant CWE Top 25-adjacent checks included improper input validation
(CWE-20), path/redirect trust (CWE-601), uncontrolled resource consumption
(CWE-400/CWE-770), authorization (CWE-862/CWE-863), sensitive information
exposure (CWE-200), and exceptional-condition handling (CWE-755).

## Retest And Residual Risk Statement

- PR [#39](https://github.com/jaredsrice/TrailPack/pull/39) merged only after
  eight pull-request checks passed. Its merge commit then passed Validate,
  CodeQL Actions, CodeQL JavaScript/TypeScript, and production deployment again.
- Production returned HTTP `200`, all expected hardening headers, a working
  Jenny Lake packing flow, seven intact high-resolution carousel images, and a
  valid application icon.
- GitHub reported zero open CodeQL, secret-scanning, and Dependabot alerts after
  merge.
- A real User B saw no User A saved results. A delete probe under User B's
  authenticated database identity affected zero rows, the User A row remained,
  and User A removed the temporary acceptance row afterward.
- The updated passive scan reported no critical, high, or low category. The two
  remaining medium categories are the explicitly accepted CSP allowances above.

There is no unresolved critical or high-severity finding. No medium or low
finding is left without remediation or a written risk decision. The real-account
cross-user walkthrough and final owner acceptance both passed on 2026-08-28.
