# TrailPack website, privacy, and release audit

Date: September 12, 2026. Scope: local code and mocked browser tests prepared on
`codex/privacy-accessibility-hardening` and later committed to local `main` with
Jared's approval. This is issue spotting for an academic project. It is not
legal advice, a compliance certification, or approval for a public release.

## Executive summary

TrailPack is strong enough for an academic demonstration. Its core packing list
is deterministic, guest use does not require an account, saved plans are owner
scoped, provider failures have visible fallbacks, and the interface works at
desktop and mobile widths.

The project is not ready for a broad public release without owner decisions and
some follow-up work. The main release risks are the lack of verified automatic
retention and full account deletion, the need to verify Google and Gemini terms
for the actual account tier, and the lack of an attorney-reviewed public policy
set. This pass adds honest in-product data notes, explicit Gemini choice, bulk
saved-plan deletion, linked weather attribution, and focused accessibility
repairs. It does not claim to solve the unresolved items.

## What is already strong

- **Confirmed:** Guest planning works without Google, Supabase, or Gemini.
- **Confirmed:** The rule engine owns the packing list. Gemini can select only
  approved explanation IDs, and invalid or unavailable responses fall back to
  TrailPack's standard review.
- **Confirmed:** AI input excludes account identity and free-form notes. The
  provider request also sets `store: false`.
- **Confirmed:** Saved plans use server-validated identity, an owner filter, and
  Supabase row-level security. Free-form notes are excluded from saved records.
- **Confirmed:** There is no analytics package, advertising tracker, third-party
  embed, or nonessential cookie implementation in the reviewed code.
- **Confirmed:** Existing layouts, controls, reduced-motion behavior, labels,
  focus styles, failure states, and responsive tests provide a solid baseline.
- **Confirmed:** TrailPack clearly distinguishes official, calculated, imported,
  user-provided, forecast, fallback, and unavailable information.

## Must address before a broad production release

### 1. Retention and full deletion are not complete

**Severity: Must address before broad production.** Users can now delete one or
all saved plans, but that does not delete the Supabase Auth identity. The owner's
90-day saved-plan target is provisional, and no verified automatic deletion job
exists. This matters because public promises must match actual database behavior.

**Smallest practical fix:** Confirm that 90 days is the final rule, add one
database-owned scheduled deletion mechanism, test old and new records, and add a
privileged server endpoint for complete account deletion with reauthentication.
Do not describe either behavior as active until hosted verification passes.

### 2. Public policy and jurisdiction choices are unresolved

**Severity: Must address before broad production.** The new `/privacy` page is a
plain-language academic project notice. It is intentionally not a formal privacy
policy or terms document. The applicable requirements depend on where users live,
whether TrailPack later becomes commercial, and whether minors are permitted.

**Smallest practical fix:** Before public promotion, document the intended
audience, operator identity, contact method, jurisdictions, and business model.
Have qualified counsel decide whether a privacy policy, terms, consent wording,
and jurisdiction-specific notices are needed.

### 3. Provider and deployment terms need owner verification

**Severity: Must address before broad production.** Google OAuth, Supabase,
Gemini, Vercel, NPS, Open-Meteo, and external source links all apply. The owner
believes Gemini is on a free tier, but that account setting was not verified in
this local-only pass. Preview and Production currently share Supabase, so test
activity can affect the same account and saved-data boundary.

**Smallest practical fix:** Record the actual OAuth publication status, Gemini
tier and data-use terms, Supabase region and retention settings, Vercel domains,
and whether Preview should receive a separate database before public testing.

## Should improve

### Screen-reader and keyboard confirmation

**Severity: Should improve.** Automated Axe checks, visible focus, labels, and
keyboard browser flows pass, but automation cannot confirm a good VoiceOver or
NVDA reading order. The carousel now exposes one indicator in the Tab order,
header and footer sit outside the main landmark, and a visible-on-focus skip link
targets the real main content.

**Smallest practical fix:** Run one manual Firefox keyboard pass and one short
VoiceOver or NVDA pass across search, generation, optional AI, save, library,
bulk deletion, and the data notice.

### Content Security Policy

**Severity: Should improve.** The September 12 security review retains a medium
defense-in-depth concern because inline scripts and styles remain allowed. No
working injection path was found.

**Smallest practical fix:** Treat nonce or hash support as a separate Next.js
hardening task with full authentication and browser regression testing.

### Data notice maintenance

**Severity: Should improve.** The data page accurately states that automatic
90-day deletion and auth-identity deletion are not active. It will become stale
if analytics, monetization, new providers, or new storage are added.

**Smallest practical fix:** Make the data notice part of every release checklist
that changes providers, storage, authentication, cookies, or analytics.

## Optional future improvements

- A deliberate Taste experiment could test a shorter public-facing landing
  introduction or portfolio presentation. Do this only after the real public
  audience is defined. The current planner hierarchy and outdoor identity do not
  need a redesign.
- A small account settings page could later combine identity details, saved-data
  deletion, account deletion, and retention status. The current saved-plans page
  is sufficient for the academic project.
- Analytics may be useful later, but it should not be added until the owner has a
  concrete question to measure and has reviewed consent and notice requirements.

## Owner decisions needed

1. Confirm whether the 90-day target applies to saved plans, inactive accounts,
   or both.
2. Confirm that public users must be 18 or older, and decide how prominently to
   state that rule.
3. Decide whether a future public site is personal, portfolio-only, nonprofit,
   or commercial.
4. Choose a public contact method for privacy and deletion requests.
5. Decide whether Preview and Production should use separate Supabase projects.
6. Verify the Google OAuth publication state and the actual Gemini billing tier.
7. Decide whether future analytics is worth the added notice and consent work.

## Legal-review questions

Qualified counsel should answer these only if TrailPack moves beyond a private
academic demonstration:

- Which privacy disclosures and user rights apply in the intended jurisdictions?
- Is an age statement sufficient, or is stronger age handling required?
- What terms and liability language are appropriate for hiking and AI-assisted
  planning guidance?
- Are the NPS, USGS, Open-Meteo, photograph, icon, and font attribution and
  licensing records sufficient for the planned public use?
- Do Google's OAuth and Gemini terms permit the intended personal, portfolio, or
  later commercial use under the actual account configuration?

## Exact evidence

### Code and documentation

- `src/features/trailpack/lib/ai-approved-review.ts`: provider input is limited
  to approved TrailPack facts and explanation choices.
- `src/features/trailpack/lib/ai-provider.ts`: provider request uses `store: false`
  and returns sanitized diagnostics.
- `src/features/trailpack/components/AiReviewPanel.tsx`: Gemini now requires an
  explicit button press with visible age and data wording.
- `src/features/trailpack/lib/saved-results.ts`: saved-plan construction excludes
  free-form notes.
- `src/app/api/trailpack/saved-results/route.ts`: authenticated list, save, and
  owner-scoped bulk deletion.
- `supabase/migrations/20260730000000_create_saved_results.sql`: owner-linked
  rows, row-level security, and delete-on-auth-user cascade.
- `src/app/privacy/page.tsx`: current in-product data notice and unresolved items.
- `src/features/trailpack/components/ContextStatusPanel.tsx`: linked Open-Meteo
  attribution beside displayed forecast data.
- `src/features/trailpack/components/TrailPackShell.tsx` and
  `src/features/trailpack/components/ParkPhotoShowcase.tsx`: corrected landmarks,
  skip link, home link, and reduced carousel Tab stops.
- `docs/validation/2026-09-12-security-review.md`: retained CSP and external
  service risks from the current release review.

### Browser observations

- Local Firefox at 1280 by 900 and 390 by 844 preserves the existing green,
  outdoor visual identity with no horizontal overflow in covered flows.
- The mobile landing page keeps the photo, search, popular trails, park browser,
  safety statement, and data link readable without a separate mobile redesign.
- The data notice is a quiet, text-first page matching the existing color and
  typography system. It adds no new visual dependency.
- The explicit Gemini control leaves the rule-based plan visible before, during,
  and after a provider request.

### Test results

- Baseline before edits: 61 files and 895 tests passed after installing the
  existing lockfile.
- Final unit and integration run: 61 files and 900 tests passed.
- Final Firefox run: 154 tests passed in 4.8 minutes, including both responsive
  widths, Axe scans, provider failures, saved-plan lifecycle, bulk deletion,
  explicit AI choice, focus structure, and stale-request behavior.
- Lint, documentation links, TypeScript, and the optimized production build
  passed. The build prerendered `/privacy` and reported 183 kB first-load
  JavaScript for the homepage.

## Completed and deferred ledger

| Item | Status | Evidence or reason |
|---|---|---|
| Plain-language data notice | Completed locally | `/privacy`, linked from the footer and saved library |
| Explicit Gemini request | Completed locally | No AI route call occurs during list generation; the user presses the disclosed control |
| AI data minimization wording | Completed locally | Approved trip facts only; no name, email, or free-form notes |
| Open-Meteo attribution | Completed locally | Linked beside weather output |
| Skip link and landmarks | Completed locally | Browser-tested header, main, and footer structure |
| Shorter carousel Tab path | Completed locally | One current indicator is tabbable; other indicators remain clickable |
| Delete all saved plans | Completed locally | Two-step confirmation and authenticated owner-scoped route |
| Automatic 90-day deletion | Deferred | Provisional rule; requires an approved and hosted-tested scheduler |
| Delete Google or Supabase identity | Deferred | Requires privileged deletion and account lifecycle decisions |
| Formal privacy policy or terms | Deferred | Depends on audience, jurisdiction, operator, and qualified legal review |
| Analytics or cookie notice | Not needed now | No analytics, ads, embeds, or nonessential cookies found |
| New UI or animation dependency | Not added | Existing React, CSS, and controls cover the identified needs |
| Remote push, Preview, or production deployment | Not performed | This pass is committed only to local `main` |

## Smallest recommended next-step plan

1. Review this local branch and the new data wording.
2. Confirm the seven owner decisions above.
3. If a broad public release is planned, implement and hosted-test retention and
   full account deletion before drafting final policy text.
4. Obtain qualified legal review for the final public policies and safety terms.
5. Run manual keyboard and screen-reader checks, then use the normal review and
   Preview process. Keep main merge and production publication as separate owner
   approvals.
