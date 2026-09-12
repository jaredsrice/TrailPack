# TrailPack project handoff

Current scope checkpoint: 2026-09-12 (America/Denver). Released baseline: 0.7.1.
Active checkout: `/Users/jaredrice/AI/projects/TrailPack/`.

## Recent handoff history

- **2026-09-12, security report rewritten for a college reader:** Preserved
  the exact findings, severities, test counts, scanner counts, residual risks
  and limits while replacing the dense audit-first structure with plain-language
  sections: summary, scope, five fixed problems, AI safety/privacy, retained
  risks, evidence, passive scan, limits, and a short standards reference.
  Documentation links and whitespace checks pass. This is a clarity change,
  not a new scan or broader security claim.

- **2026-09-12, owner feedback pauses final closeout:** Jared finds the live
  review insubstantial and wants useful planning guidance rather than repeated
  trail facts. The earlier implementation/test pass is verified, but a focused
  review redesign is now requested. Do not mark this new request complete or
  loosen AI safeguards without an approved design. Final evidence edits remain
  uncommitted in the implementation worktree; no runtime changes followed
  `6a49b495`. Next proposed step: a concrete before/after review example,
  Sol Medium with one main agent, pending setup/design confirmation.

- **2026-09-12, final runtime candidate and hosted checks:** Runtime commit
  `6a49b4952ae3e20610bcd91d6e946432c1de4b73` is pushed on
  `codex/required-completion`, review PR #61. Immutable Preview
  `dpl_CYjah6Nt2oDoGZ8B13uTHJiEXmhw` is READY at
  https://trailpack-db0080ubs-jared-s-rice.vercel.app ; stable test alias is
  https://trailpack-git-codex-required-completion-jared-s-rice.vercel.app .
  Final isolated local Firefox run passed 151/151 without failures, skips or
  retries. Hosted lookup/empty/method/content-type checks and live alerts pass.
  Firefox showed two accepted Gemini 3.5 Flash reviews; hosted metadata confirms
  AI POST 200 twice. Private save returned 201. First library GET returned 500,
  then a normal reload returned 200 and both current/older plans rendered.
  Cause is unconfirmed; do not guess a parser fix or claim an error-free run.
  Jared approved deleting both displayed plans; both returned 204. Firefox
  confirmed an empty library, sign-out and a new Guest review ready result.
  The temporary Phelps and older Jenny plans were permanently removed, with
  no restore action in TrailPack. No other saved records were deleted.
  CodeQL analyses passed. ZAP passive scan completed with 0 high, 3 medium,
  0 low and 2 informational types; CSP inline limitations remain documented.
  Dependency audit and GitHub open code/dependency/secret alerts are zero.
  CI Validate passed, including 887 tests and 151 Firefox tests (7.9 minutes).
  No main merge or production publication. Final evidence changes are docs-only.
  Approved implementation/audit/testing scope is complete on this candidate.
  Next is Jared's review and separate publication approval. Recommend Sol Medium,
  one main agent, for explaining the result and recording owner feedback.

- **2026-09-12, database reconciliation and permission repair verified:**
  Independent comparison found the cumulative older five migration effects
  already present, including function bodies, policies, column constraints,
  indexes, enabled trigger and function default argument. Recorded those exact
  versions as applied without replaying SQL. Jared separately approved removing
  unused authenticated saved-table TRUNCATE, REFERENCES and TRIGGER permissions.
  Applied only `20260912000000_restrict_saved_results_privileges.sql`;
  readback confirms authenticated SELECT/INSERT/DELETE only, anon all denied,
  quota trigger enabled and all seven migrations recorded. Full-directory
  dry-run now says up to date. No saved rows were read or changed by this repair.
  Runtime source is frozen for final checks: clean production build (static
  homepage, 179 kB first load), types and 887 tests across 61 files pass.
  An earlier browser run was invalidated by overlapping build activity; it is
  not final evidence. Tester now owns the exclusive full Firefox run.

- **2026-09-12, final completion pass in progress:** Jared approved finishing
  the remaining 499B work, full testing, and the shelved code audit with only
  necessary refactors. Confirmed roles: Astra High coordinator, Sol High builder,
  Sol High tester, and Astra High security reviewer. Documentation should be
  simple and college-level. Prefer Firefox for website checks and sign-ins.
  Current audit fixes cover failed auth states, invalid lookup responses,
  stalled uploads, NPS redirects/source delivery, malformed alert envelopes,
  provider cleanup and dated-weather provenance. All 50 NPS profiles now compare
  unchanged in a live dry run; no managed snapshot facts changed. Final tests,
  immutable candidate, live signed-in AI and updated security evidence remain.
  Google initially returned the Preview login to production because the new
  callback was not allowed. Jared explicitly approved adding exactly
  https://trailpack-git-codex-required-completion-jared-s-rice.vercel.app/auth/callback .
  The one-property change was applied and rechecked; all prior callbacks and
  undeclared settings were preserved. Use that branch alias for final acceptance.
  No main merge or production website publication is authorized.

- **2026-09-12, owner clarified active requirements authority:** Jared explicitly
  directed this discussion to the CSE 499B specification, not the old 499A
  nice-to-have list. Use B-01 public lookup, B-02 live guarded AI and supporting
  NPS maintenance, B-03 private saved results, and B-04 security verification
  as the current completion scope. The specification replaces the old stretch
  list; guest export, expanded coverage and generic extra context are not
  separate 499B requirements. B-02 permits live explanations, and its production
  addendum requires explanation-only behavior; alternative packing-list modes
  are not required or approved. Do not present the old SH list as the next
  implementation backlog. Preserve the original documents as historical evidence.

- **2026-09-12, nice-to-have wording clarified:** Jared did not remember wanting
  alternative packing lists and requested the documented write-up. Re-read
  proposal v9's four nice-to-have bullets and Week 12 v6 Section 2b's six SH
  requirements. SH-04 is titled Advanced AI Recommendation Refinement and calls
  for baseline-versus-AI-refined comparison with accepted/rejected validation.
  The assistant's Standard/Lighter/Extra-prepared modes were illustrative
  suggestions, not documented owner-selected modes. Do not treat those examples
  or the suggested build order as approved scope. No SH-04 implementation or
  formal removal from the requirements was authorized; owner is reviewing wording.

- **2026-09-12, preview READY and hosted lookup checked:** Test website:
  https://trailpack-8ksthnzzs-jared-s-rice.vercel.app .
  Deployment `dpl_GQNbRvNem91dQRdAq5bnbbtfuVJw`, Preview/Ready, remote build
  41 seconds. Independent hosted API checks and coordinator browser
  Generate/Update/provenance walkthrough pass. Two separate process clients
  consume the one hosted quota row; passive headers/guest AI denial pass.
  Full local Firefox suite 139/139. Production alias remains on
  `dpl_Am6La8gGcQPQkQs1cUacwkYZ3YxV`. No main merge/production publication.
  B-01 now preview-verified. Remaining: signed-in live Gemini acceptance, final
  immutable-candidate static checks, canonical Open Canyon delivery review,
  and eventual owner-approved publication. Historical migration bookkeeping
  remains intentionally unreconciled; never blindly push the full migration
  directory. See the [hosted evidence](validation/2026-09-11-required-completion.md#september-12-preview-deployment-and-hosted-checks).

- **2026-09-12, hosted quota applied and preview building:** Applied only
  `20260911000000_nps_lookup_quota.sql` to the approved shared database using
  a private single-migration staging directory and the normal Supabase CLI
  migration mechanism. Staged bytes matched the reviewed file; dry-run listed
  exactly one update. Postcheck: one quota row, RLS enabled, anon SELECT denied,
  authenticated UPDATE denied, anon claim allowed; migration history contains
  only this new version. Older released schema exists but had no migration
  history, so do not run a full-repository push until separately reconciled.
  Preview upload is building at
  https://trailpack-8ksthnzzs-jared-s-rice.vercel.app .
  Upload dry-run verified 298 files with no local secrets/private evidence.
  Added `.vercelignore` to the candidate. No main merge or production deployment.

- **2026-09-12, shared update and standing preview permission approved:** Jared
  approved the explained shared-database quota addition and asked that changes
  routinely be uploaded to the test website for review. Save this as project
  guidance, not permission to deploy the live site or merge into main; “main doc”
  is conservatively interpreted as those publication boundaries. Full local
  Firefox suite now passes 139/139 (one worker, 4.4 minutes), reported by the
  independent tester. Continue reviewed database preflight and preview-only
  deployment with Astra High coordinating, Sol High testing and a separate
  Astra High security reviewer.

- **2026-09-12, sign-ins restored and shared-database gate:** Vercel CLI
  authenticated as jaredsrice; Supabase login succeeded and lists TrailPack
  project `wdxilooepbakbcvlqaaw`. Confirmed Vercel project
  `prj_xrwPozS0EfR5O87mnxNspeU1pj6u` in team
  `team_wqE80IHRIqqs1jLkuJCiIMQk`. Preview and Production share the Supabase
  configuration; no Supabase branch exists. Provider keys are configured for
  both environments; Gemini's secret cannot be downloaded locally.
  Independent review confirms the migration only adds its own quota table,
  row and consume-only RPC, with no references from released code. However,
  the RPC becomes publicly callable even before preview deployment. Because
  the earlier boundary promised no production changes, obtain explicit approval
  for this shared production database addition or use a separately authorized
  preview database. No hosted write/deploy occurred. Hosted schema drift is
  unverified: the read-only CLI query stopped on IPv6 connectivity before SQL.
  Supabase CLI temporary metadata is now ignored in both checkouts.
  Next: shared-database decision, then single transactional migration through
  the release mechanism and preview acceptance. Continue Astra High coordinator,
  Sol High tester and separate Astra High security reviewer.

- **2026-09-12, independent reviews and preview access check:** Jared approved
  temporary native agents: Astra High coordinator/security reviewer and Sol High
  acceptance tester. Independent security review found no new preview blocker;
  guest-quota exhaustion remains a documented availability risk. Tester found
  duration provenance and lower-range-bound bugs; coordinator repaired both
  test-first in the existing worktree. Fresh checks: 844 tests, nine lookup
  Firefox cases, lint and production build passed. Official home.nps.gov content
  corroborates both Open Canyon snapshots; automated www delivery still needs
  review, so the earlier run remains 48/50. No snapshot change. Hosted work is
  blocked by invalid Vercel CLI authentication/disconnected connector and missing
  Supabase CLI authentication. No hosted migration, deploy, commit, push or live
  Gemini call. Next: restore authorized sign-in, confirm database/preview targets,
  then reviewed migration and hosted acceptance. Continue Astra High coordinating,
  Sol High testing and a separate Astra High security reviewer. Details:
  [review addendum](validation/2026-09-11-required-completion.md#september-12-independent-review-and-retest-addendum).

- **2026-09-12, workflow comparison before preview:** Jared agreed to the
  proposed database update/test preview, then asked whether the shelved agent
  team would be useful before starting. No hosted change or agent dispatch was
  performed during this comparison. Reviewed the archived role contracts as
  reference only, not authority to restore their old bootstrap machinery.
  Recommendation pending confirmation: native Codex delegation with an
  Astra High coordinator, Sol High acceptance tester, and separate Astra High
  security reviewer. Keep database/deployment writes with the coordinator;
  review the migration before applying it. Do not revive a permanent team.

- **2026-09-11, local required-completion candidate saved:** MH-05/B-02 now uses
  approved highlight IDs, excludes raw trip text from Gemini, and shows safe
  rejection details. NPS Very Strenuous/streaming fixes and a separate partial
  live NPS lookup for Zion/Acadia/Bryce are implemented in the worktree below.
  Final checks: 839 unit/integration tests, 135 browser tests plus two focused
  rejection-detail cases, lint/types/build, 5,000 stress cases and zero dependency
  audit findings. Real adapter proof: 12/12 identities, zero unrelated admitted,
  twice. SQL migration executed with role/burst/refill tests in embedded
  PostgreSQL. No commits, merge, push, deployment, hosted migration or live
  Gemini call. Live NPS maintenance: 48/50 unchanged; both Open Canyon profiles
  need source review because direct HTTP 200 responses omit route facts.
  Existing snapshots were preserved. See the
  [candidate verification](validation/2026-09-11-required-completion.md) and
  [updated counts](requirements-status.md).
  Next: review/integrate the candidate deliberately, resolve the source issue,
  and authorize hosted quota migration/preview acceptance for B-01/B-02/B-04.
  Recommended: GPT-6 Astra, high reasoning, one main agent.

- **2026-09-11, implementation resumed:** Owner authorized proceeding after the
  requirements inventory. Required MH-05/B-02 repair, NPS maintenance, B-01
  provider proof/lookup, and B-04 verification are now in scope. Work is isolated
  on `codex/required-completion` at
  `/Users/jaredrice/AI/projects/TrailPack/.private/worktrees/required-completion/`.
  Existing uncommitted documentation was preserved and copied there. Baseline:
  777 tests passed. AI approved-highlight selection, privacy regressions,
  rejection display, and NPS maintenance fixes are being verified. Local NPS
  credentials are available; no local Gemini key is configured, so live AI
  acceptance remains pending. Original SH-04 variants, SH-06 export, and the
  broader shelved UI/map work remain outside this implementation scope.

- **2026-09-11:** Completed the [requirements inventory](requirements-status.md)
  from proposal v9, final Week 12 v6, and later 499B scope. Current assessment:
  five of six baseline requirements supported; MH-05 needs repair. Three of six
  original stretch requirements delivered; live lookup, actual AI list variants,
  and guest export remain unfinished. Later 499B scope promotes lookup, live AI,
  and login/private saves and adds security verification. Existing 777 tests pass;
  three false synthetic provider summaries were still accepted, and synthetic
  free-text markers reached the mocked outbound payload. Next action: review the
  required completion scope, with MH-05/B-02 repair first. No implementation was
  started; browser/live-provider/security acceptance was not repeated.

- **2026-09-11:** Repaired the stale parent instructions at
  `/Users/jaredrice/Developer/Senior Project Local/AGENTS.md`. They now identify
  this checkout as the active Git repository, retain proposal v9 as the current
  academic authority, and clarify that proposals, requirements, assessments,
  and backups remain external supporting material. Added a project-local rule to
  recommend the best model, reasoning level, and collaboration arrangement before
  each new substantive TrailPack task or phase. No code, Git configuration, or
  remote state changed.

## Current scope

Route coverage and repository documentation cleanup are complete. The catalog
contains 39 discovery entries and 52 complete route profiles. Trail admission
holds, unknown gains, and closed access remain explicit in the
[route audit](data/grand-teton-day-hike-audit-2026-09-09.md).

The approved relocation to the active checkout above is complete. The September
10 acceptance audit records queued AI-validation and NPS maintenance repairs,
with live external lookup and alternative packing-list variants tracked
separately. Start with the [roadmap docket](roadmap.md#follow-up-docket) and its
linked acceptance plan when considering further work.

Required completion work resumed on September 11 after the requirements review.
Use the implementation worktree above for code changes. The September 10 audit
remains the acceptance baseline; its original lack of implementation authorization
is historical. Release/deployment acceptance will be recorded after verification.

The code candidate is committed and pushed on `codex/required-completion`,
PR #61, with the final runtime evidence recorded in the latest history entry.
Main source and the production website are unchanged. Approved shared-database
quota, permission and migration-history changes are applied and verified.
All six baseline requirements and B-01–B-04 have candidate evidence; the live
Gemini, NPS maintenance and final security checks are complete. One saved-library
request failed and recovered on reload; its cause remains unconfirmed.
Original SH variants/export are historical, not the active backlog.
The implementation, necessary-only audit, testing and simple documentation pass
is complete. Preserve the worktree for owner review; do not merge or publish
production without approval.

## September 9 closeout decisions and evidence

The following is historical evidence from the maintenance closeout before the
approved relocation and September 10 acceptance audit.

- PR #54 was superseded by PR #55. Its Taggart route definitions, evidence,
  photos, fixtures, and admission tests were compared with main and are identical.
- PR #45 contained only older check-date updates. This closeout replaces it with
  a guarded refresh of the current 50 NPS profiles: zero source-fact changes.
  The two calculated mixed routes continue to use separate geometry evidence.
- Twenty completed remote branches and nineteen local branches were removed
  after matching their exact tips to merged PRs or the superseded Taggart PR.
  A verified local Git bundle and original ref manifest preserve recovery.
- No open GitHub issues, code-scanning alerts, or secret-scanning alerts were
  found in the closeout inventory. Four dependency alerts required patching.
- Sharp 0.35.4, js-yaml 4.3.2, and Vitest/mocker 4.1.11 resolve the observed
  dependency alerts. The patched local lockfile reports zero npm audit findings.
  References: [Sharp advisory](https://github.com/lovell/sharp/security/advisories/GHSA-rgj7-g3m4-5g8c),
  [js-yaml advisory](https://github.com/nodeca/js-yaml/security/advisories/GHSA-2883-xcg3-v3hh),
  [Vitest advisory](https://github.com/vitest-dev/vitest/security/advisories/GHSA-82fw-gwwq-j7x9).
- CI artifact upload uses v7, matching the existing monthly NPS workflow and
  removing the old Node.js 20 action-runtime warning.
- Documentation cleanup from PRs #57/#58 belongs to the released 0.7.0 milestone;
  it no longer appears under Unreleased. This maintenance closeout is 0.7.1.

Security findings are dated observations, not a promise that future advisories
will remain empty. At the next session, inspect current GitHub alerts and run
`npm audit` before treating this baseline as current.

## Preservation reference for any future move

These precautions are retained from the migration handoff. They are not pending
relocation tasks for the current checkout or a requirement for switching Codex
accounts on this Mac.

| Material | Treatment |
|---|---|
| Tracked source, documentation, tests, photographs, geometry, migrations, package lock | Preserve through Git and verify the destination commit |
| `.git/` | Preserve local refs and repository configuration or reconstruct deliberately from the remote |
| `.env.local` | Copy securely when moving the working environment; never add to Git or a public context pack |
| `.private/` | Preserve private recovery material and the closeout Git bundle; exclude from public exports |
| `.vercel/` | Preserve or deliberately relink the existing project; do not create a duplicate hosted project |
| `.artifacts/` | Optional local evidence; retain anything needed to explain an unfinished check |
| `node_modules/`, `.next/`, generated types and build caches | Rebuild from the lockfile; these are disposable |
| Parent project proposals and assessment records | Preserve separately; they are outside this Git repository |

The current checkout's `.private/migration-closeout/` holds a ref manifest and
`before-branch-cleanup.bundle`. A Git clone alone does not restore these ignored
local files. Do not delete the old checkout until private material, checksums,
provider configuration, and destination operation have been verified.

Runtime source, scripts, and current guides have no dependency on an absolute
local checkout path. A move still requires reviewing saved Codex project paths,
parent agent guidance, local environment files, and hosted project linkage.
A future move requires its own confirmed destination and preservation checks.

## Maintenance while paused

- Keep the GitHub monthly NPS integrity workflow enabled. It runs on the first
  day of each month at 15:17 UTC and opens a PR for a validated snapshot refresh.
  The schedule depends on GitHub, not on this local checkout being open.
- Keep PR validation, CodeQL, Dependabot alerts, and production hosting enabled.
- At the September 9 closeout, no TrailPack Codex timer or heartbeat was found;
  the separate AI-migration automation excluded TrailPack. This is historical
  inventory, not a fresh check of current account automations.
- Resolve new data-refresh PRs and security alerts through normal review; do not
  automatically admit new trails or clear closures.
- Use the existing [testing guide](testing.md) and [setup guide](setup.md).
  A successful mocked test is not a live provider or account acceptance result.

## Intentionally retained limitations

The [historical delivery record](archive/validation/2026-08-28-cse-499b-closeout.md)
records completed real two-account privacy acceptance. No second-account task
remains from that release. This closeout does not repeat authenticated user tests.

The accepted CSP inline allowances remain documented in the
[security review](archive/validation/2026-08-28-b04-cybersecurity-review.md).
They belong in the later architecture/security audit, not an unplanned rendering
rewrite during scope review. Evidence holds such as Delta Lake remain
holds; a catalog audit is not a claim to support every possible Teton itinerary.

The release records mark the latest proposal's core packing and guarded-AI
objectives delivered. The September 10 acceptance audit below found current
AI-validation gaps, so historical delivery is not a claim that every original
pass/fail criterion is met today. The proposal's
illustrative multi-region catalog was replaced by reviewed Grand Teton coverage;
AI refines explanations while the rule engine owns packing decisions. These are
established scope decisions. Academic stakeholder-contact placeholders and
submission/assessment status cannot be inferred from software delivery and remain
owner-managed outside the repository.

## Shelved work

On 2026-09-10, the owner queued B-01 and B-02 follow-ups to revisit the original
live external trail lookup and alternative AI packing-list refinement goals.
The completed [acceptance audit and development plan](superpowers/plans/2026-09-10-499b-acceptance-audit-and-development-plan.md)
separates current B-02 validation defects from the separately queued original
SH-04 variant extension. B-01 live lookup remains absent despite the delivered
stored-import substitute. The [roadmap docket](roadmap.md#follow-up-docket)
records these distinctions. That September 10 no-implementation state was
superseded by the September 11 authorized candidate above; this does not resume
the other work below. Google login/private saved results
remain passed by the owner and were not re-audited.

Resume only when the owner explicitly asks:

The broad code-quality audit was separately resumed and completed September 12
with necessary changes only. These other ideas remain shelved:

1. Less cluttered trail-selection landing experience.
2. Accessible interactive supported-trail map.
3. Custom route composition from reviewed segments.

The [roadmap](roadmap.md) retains the three product stages and acceptance criteria.
No new task, timer, or automation starts any of this work automatically.

## Historical closeout assumptions and recovery

- **Assumption:** closing loose ends includes patch-level security maintenance,
  retiring proven completed branches, release bookkeeping, and this handoff.
- **Assumption:** existing GitHub maintenance and production hosting continue while
  local-AI migration proceeds. This was the September 9 closeout assumption;
  the later relocation is complete. Pausing development does not disable monitoring.
- **Recovery:** restore deleted refs from the local bundle and its manifest if
  needed. Revert the maintenance commit through a PR to roll back code/config
  changes; reverting dependency patches reintroduces the addressed advisories.
- **Release evidence:** use the 0.7.1 GitHub release, its commit checks, and its
  Production deployment record for the final commit. This document avoids a
  self-referential commit hash that would require another closeout commit.
