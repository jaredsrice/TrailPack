# TrailPack pause and migration handoff

Maintained closeout: 2026-09-09 (America/Denver). Release: 0.7.1.

## Current scope

Route coverage and repository documentation cleanup are complete. The catalog
contains 39 discovery entries and 52 complete route profiles. Trail admission
holds, unknown gains, and closed access remain explicit in the
[route audit](data/grand-teton-day-hike-audit-2026-09-09.md).

The product can remain deployed while the separate local-AI workspace is migrated.
No TrailPack relocation or broad code rewrite is part of this closeout.

## Closeout decisions and evidence

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

## Preserve during a later migration

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
Use the separately approved migration plan to perform that move.

## Maintenance while paused

- Keep the GitHub monthly NPS integrity workflow enabled. It runs on the first
  day of each month at 15:17 UTC and opens a PR for a validated snapshot refresh.
  The schedule depends on GitHub, not on this local checkout being open.
- Keep PR validation, CodeQL, Dependabot alerts, and production hosting enabled.
- No TrailPack Codex timer or heartbeat was found. The separate AI-migration
  automation belongs to the other project and explicitly excludes TrailPack.
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
rewrite during migration preparation. Evidence holds such as Delta Lake remain
holds; a catalog audit is not a claim to support every possible Teton itinerary.

The latest proposal's core packing and guarded-AI objectives are delivered. Its
illustrative multi-region catalog was replaced by reviewed Grand Teton coverage;
AI refines explanations while the rule engine owns packing decisions. These are
established scope decisions. Academic stakeholder-contact placeholders and
submission/assessment status cannot be inferred from software delivery and remain
owner-managed outside the repository.

## Shelved work

Resume only when the owner explicitly asks:

1. Broad code-quality audit and justified rewrites, using the
   [saved execution brief](future-code-audit.md).
2. Less cluttered trail-selection landing experience.
3. Accessible interactive supported-trail map.
4. Custom route composition from reviewed segments.

The [roadmap](roadmap.md) retains the three product stages and acceptance criteria.
No new task, timer, or automation starts any of this work automatically.

## Assumptions and recovery

- **Assumption:** closing loose ends includes patch-level security maintenance,
  retiring proven completed branches, release bookkeeping, and this handoff.
- **Assumption:** existing GitHub maintenance and production hosting continue while
  local-AI migration proceeds. Pausing development does not disable monitoring.
- **Recovery:** restore deleted refs from the local bundle and its manifest if
  needed. Revert the maintenance commit through a PR to roll back code/config
  changes; reverting dependency patches reintroduces the addressed advisories.
- **Release evidence:** use the 0.7.1 GitHub release, its commit checks, and its
  Production deployment record for the final commit. This document avoids a
  self-referential commit hash that would require another closeout commit.
