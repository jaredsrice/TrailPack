# TrailPack security review

Date: September 12, 2026.
Status: Complete for release 0.8.0. The review was performed on the test
candidate before the approved production publication.

## Summary

TrailPack's code, database permissions, automated checks, and test website were
reviewed for common security problems. No critical or high-severity problem was
confirmed. The review found several medium and low concerns. The necessary fixes
were made and retested.

Some risk remains. The website still allows inline scripts and styles in its
Content Security Policy. This is a real defense-in-depth weakness, but the review
did not find a way to inject or run unsafe code. Changing that policy safely would
require a separate rendering and browser-compatibility project. It was not treated
as a quick closeout edit.

This report is evidence of a careful review, not a guarantee that the application
has no security weaknesses.

## What was reviewed

The review covered:

- Google sign-in and server-side identity checks
- Private saved plans and database row ownership
- AI request privacy, validation, and hourly limits
- Public NPS lookup limits and source validation
- Request sizes, time limits, redirects, and provider failures
- Dependencies, possible exposed secrets, and GitHub CodeQL results
- A limited passive scan of the deployed test website

An independent security reviewer inspected the code and controls. Other agents
retested the repairs. Database tests used synthetic users. Hosted database checks
verified tables, rules, and permissions without reading private saved plans.

## Problems fixed

### 1. Slow or incomplete uploads could hold requests open

**Risk: Medium.** An incomplete AI or saved-plan upload did not have its own
application time limit. A client could keep the request waiting and consume
server resources.

**Fix:** TrailPack now stops reading these request bodies after two seconds.
Tests confirm that a stalled upload is rejected before it can use an AI quota,
call the provider, or write to the database. This relates to CWE-400, uncontrolled
resource consumption.

### 2. Saved-plan accounts had three unnecessary database permissions

**Risk: Medium.** Signed-in users had `TRUNCATE`, `REFERENCES`, and `TRIGGER`
permissions on the saved-plan table. The website did not provide a way to use
those commands, but they were unnecessary and violated least privilege.

**Fix:** With Jared's approval, those permissions were removed. Signed-in users
retain only the normal `SELECT`, `INSERT`, and `DELETE` permissions used to view,
save, and remove their own plans. Anonymous users remain denied. No saved data was
read or changed by this repair. This relates to CWE-732, incorrect permission assignment.

### 3. A malformed NPS alert response could look like “no alerts”

**Risk: Medium.** A provider response with the wrong structure could be mistaken
for a valid empty result. That could make unavailable information appear clear.

**Fix:** TrailPack now checks the response structure, record count, park identity,
and every alert before marking the result official. Invalid data is labeled
unavailable. Only a valid zero-count response means no active alerts. This relates
to CWE-20, improper input validation.

### 4. Source-page redirects needed earlier validation

**Risk: Low.** The maintenance tool checked the final NPS address after automatic
redirects. Each destination should be approved before it is requested.

**Fix:** The tool now follows redirects manually, allows only secure official NPS
addresses, rejects embedded credentials and unusual ports, limits the redirect
chain, and uses one overall deadline. External and looping redirects are covered
by tests. This is a defense against server-side request forgery, CWE-918.

### 5. Failed provider responses were not always released promptly

**Risk: Low.** Failed daylight and alert responses could retain network resources
longer than necessary.

**Fix:** TrailPack now releases failed response bodies. Failure during cleanup
cannot block the application's saved-data fallback.

The broader audit also corrected dated-weather labels and account error states.
The [final audit](2026-09-12-final-audit.md) explains those changes.

## AI safety and privacy

The Gemini feature does not create packing advice. TrailPack creates the packing
list with fixed rules. Gemini can only select from explanation IDs that TrailPack
already approved, and TrailPack supplies the displayed wording.

Raw trip notes, account identity, and free-form planning text are not sent to
Gemini. A provider response cannot add or remove packing items, change their
priority, invent a source label, or display arbitrary AI-written safety advice.
Invalid responses are rejected and the normal rule-based plan remains available.

## Risks that remain

### Content Security Policy

**Retained risk: Medium.** The current policy allows inline scripts and styles,
which weakens one layer of protection against injected page content. React escapes
displayed text, the production policy blocks `unsafe-eval`, framing is denied, and
script sources are restricted. The scan found no working injection path.

A stronger policy would use nonces or hashes. That change affects how Next.js
starts, renders, caches, and hydrates pages, so it needs its own full browser and
authentication regression pass.

### Public lookup availability

**Retained risk: Medium.** Anonymous visitors share one public NPS lookup budget.
A person could use the available requests and temporarily prevent other visitors
from using live lookup. They cannot read or reset the database quota. When the
budget is unavailable, TrailPack keeps the manual planning workflow available.

### External services

Weather, NPS, daylight, and Gemini services can fail or change. TrailPack treats
missing or invalid information as unavailable instead of claiming that conditions
are clear. This reduces harm but cannot guarantee that every provider is current.

## Test results

The tested runtime is commit
`6a49b4952ae3e20610bcd91d6e946432c1de4b73`, deployed as Preview
`dpl_CYjah6Nt2oDoGZ8B13uTHJiEXmhw` at the
[immutable test website](https://trailpack-db0080ubs-jared-s-rice.vercel.app).
The later evidence commit changes documentation only.

- 887 unit and integration tests passed across 61 files.
- 151 Firefox tests passed locally and in GitHub CI.
- 181 focused security and provider tests passed in an independent review.
- All 50 saved NPS source profiles matched their reviewed facts.
- CodeQL passed for JavaScript/TypeScript and GitHub Actions.
- `npm audit` reported zero known dependency vulnerabilities.
- GitHub showed zero open code-scanning, dependency, or secret-scanning alerts.
- Database tests passed for normal owner actions and cross-user denial.
- Hosted permissions and all seven migration records were verified.

The final account walkthrough also passed sign-in, a private save, reopening the
saved list, two approved deletions, sign-out, and a new guest review. One saved-list
request returned 500 and then succeeded on a normal reload without any code or
data change. The exact cause is unknown, so the walkthrough is not described as
error-free.

## Passive website scan

ZAP 2.17.0 passively inspected the immutable test website. A passive scan reads
normal responses and checks their headers and content. It does not attack the site.

The scan made 17 explicit GET requests to public pages, public JavaScript, two
method-denial endpoints, and the guest saved-plan denial. It did not sign in,
submit attack payloads, call AI or NPS providers, use quotas, change data, or scan
production.

ZAP reported **0 high, 3 medium, 0 low, and 2 informational alert types**:

- Two medium alerts were the inline-script and inline-style policy risks described above.
- One medium alert reported wildcard cross-origin access on public pages and
  JavaScript. Those files contain no private saved plans. The private API returned
  401 to a guest, used `Cache-Control: no-store`, was a cache miss, and did not
  return the wildcard access header. No private-data exposure was demonstrated.
- Two informational alerts concerned caching of public pages and files. Private
  saved data is fetched separately after authentication.

No scanner warning was hidden or suppressed. The private raw report remains
outside Git. Its SHA-256 is
`6306318c13eb8784b193183e24b71f803839ca0d797ebf8ef9a5fdd0ae704d49`.

## Limits of this review

The passive scan did not inspect authenticated responses, run attack payloads,
crawl every deployed file, test external websites, or scan production. The live
two-account privacy test from August 28 remains historical evidence; current
cross-user database checks used synthetic accounts.

The review therefore cannot prove that XSS, CSRF, ownership errors, provider
abuse, or every secret exposure is impossible. It shows that the reviewed controls
and tests passed, the known findings were handled or documented, and no critical
or high-severity release blocker was confirmed in the reviewed scope.

## OWASP and CWE reference

These labels connect the report to common security-review standards:

| Topic | TrailPack evidence |
|---|---|
| Access control (CWE-639/862) | Server identity checks, owner filters, row-level security, cross-user denial tests |
| Secrets and secure transport (CWE-200/319) | HTTPS providers, server-only keys, secret-pattern checks |
| Injection (CWE-79/89) | Escaped React text, structured database calls, bounded JSON, no provider-authored HTML |
| Resource abuse (CWE-400) | Atomic quotas, request deadlines, size limits, bounded caches, guest fallback |
| Configuration (CWE-732/693) | Reduced table permissions, exact callback list, reviewed security headers |
| Authentication (CWE-287/601) | Server-validated Google identity, PKCE callback, same-origin redirects |
| Data integrity (CWE-20) | Approved AI IDs and checks for source, date, park, and alert structure |
| Logging and privacy (CWE-532) | No raw trip notes, identity, or tokens in AI input; sanitized reports |
| Server-side requests (CWE-918) | Fixed runtime providers and validated maintenance redirects |
