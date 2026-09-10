# Repository and documentation cleanup audit

Date: 2026-09-09
Scope: Priority 2 repository and documentation cleanup

## Before the cleanup

- The root README was 570 lines and combined product guidance, setup details,
  implementation history, course context, and release status.
- The root changelog was 903 lines and its unreleased section still described
  route work that had already shipped in PRs #55 and #56.
- The `docs/` tree contained 78 files without a documentation index. Current
  guides, generated evidence, dated plans, research, validation notes, and UI
  screenshots were mixed together.
- About 12 MB of the documentation tree consisted of historical UI concepts and
  screenshots. Moving them preserves the material but does not reduce Git
  history or clone size.
- The generated hiker-scenario report was stored beside historical validation
  records even though a generator and CI depend on its exact path.
- No tracked environment files, credentials, or likely secret values were found.
  Local build, test, and artifact directories were already ignored.

## Decisions

| Decision | Material | Result |
|---|---|---|
| Keep | Current source data, geometry, photographs, attributions, ADRs, security policy, agent guides, and trail-onboarding records | Retained in their established locations |
| Rewrite | README, changelog, roadmap, and current contributor documentation | Shorter, current entry points with links to detail |
| Move | Dated research, implementation plans, specifications, validation records, and UI concepts | Preserved under `docs/archive/` |
| Separate | Generated stress evidence used by CI | Moved to `docs/evidence/` and its generator updated |
| Remove | Redundant current-facing copies after their archived replacements existed | Removed through tracked moves; no evidence was discarded |
| Exclude | Local build output, test output, dependencies, and onboarding drafts | Remain ignored and outside the documentation index |

## Current structure

- `README.md` is the product and repository front door.
- `docs/README.md` routes users, contributors, data maintainers, and technical
  reviewers to current material.
- `docs/evidence/` contains evidence that is regenerated or directly used by a
  current check.
- `docs/archive/` contains dated records whose status language may be historical.
- `docs/superpowers/` remains as a compatibility location for future active
  plans; completed plans and specifications are archived.
- `npm run docs:check` validates local Markdown paths and section anchors.

## Marked assumptions for owner review

1. **Version interpretation:** the route-coverage milestone is represented as
   version 0.7.0 dated 2026-09-09. No Git tag existed for that release, so the
   version groups the deployed PR #55/#56 work and supporting changes into a
   coherent documented milestone.
2. **Historical wording:** archived records keep statements such as “pending” or
   “local” when those words accurately reflect the captured document. Each
   copied snapshot is labeled historical, and current guides carry current
   release status.
3. **Archive purpose:** moving binary UI evidence improves navigation but does
   not shrink repository history. A later history rewrite would be a separate,
   destructive maintenance decision.
4. **Remote metadata:** the GitHub repository description was empty during the
   audit. This cleanup does not change repository settings; that remains a
   separate owner decision.
5. **Future product scope:** reducing trail-selection clutter, adding an
   interactive supported-trail map, and composing custom routes from reviewed
   segments are recorded in Priority 3. They are intentionally not implemented
   by this documentation-only change.

## Reversal

Git records every move and rewrite in this branch. Revert the cleanup commit to
restore the previous layout as one operation. If only a moved record needs to
return, use `git mv` from its archived path and update references; run
`npm run docs:check` afterward. The generated stress report must remain aligned
with the output path in `scripts/generate-hiker-scenario-report.mjs`.
