## Senior Project Memory

- `/Users/jaredrice/AI/projects/TrailPack/` is the active software repo for this senior project after the approved relocation.
- Before or during weekly project work, compare the current code state against:
  - the highest-numbered `TrailPack_Proposal_v*.docx` under `/Users/jaredrice/Developer/Senior Project Local/Project Proposals/` (currently v9); it takes precedence over the older `TrailPack_Formal_Project_Proposal_Draft.md`
  - the current `docs/roadmap.md` and active plans and specs under `docs/superpowers/`
- Track milestone progress from the proposal and use the actual code changes to assess what was completed, deferred, descoped, or added.
- When code changes materially affect project scope, supported features, milestone status, demo behavior, or user-facing capabilities, update:
  - `README.md`
  - `CHANGELOG.md`
- Keep those updates systematic rather than ad hoc: tie them to the work completed that week and to the proposal or milestone expectations they satisfy or change.
- If the code and the proposal diverge, surface the mismatch explicitly instead of silently treating the proposal as still current.

## Agent skills

### Model and collaboration setup

- Before starting a new substantive TrailPack task or phase, recommend the best
  available model, reasoning level, and collaboration arrangement for that work,
  with a brief reason, and obtain Jared's confirmation before proceeding.
- A confirmed setup remains valid for the full authorized scope. Do not repeat
  the selection step for minor follow-ups, status questions, or casual discussion.
- Follow the shared flexible model presumptions: Terra Medium for straightforward
  bounded work and Sol Medium as the normal substantive default. Recommend higher
  reasoning or GPT-6 Astra when a concrete TrailPack difficulty, uncertainty,
  long-horizon coordination need, consequence-linked failure mode, or observed
  limitation justifies it. Architecture, security, review, importance, or generic
  accuracy language does not automatically make a task an Astra task. Do not
  require a lower-cost attempt to fail when the difficulty is already evident.
- Keep the recommendation distinct from the actual session setting. Do not claim
  that a recommended model or reasoning level is active unless it is known.

### Issue tracker

Issues and PRDs for this repo live in GitHub Issues for `jaredsrice/TrailPack`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the canonical label strings `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

TrailPack is configured as a single-context repo that uses the root `CONTEXT.md` and `docs/adr/` when they exist. See `docs/agents/domain.md`.

## Project maintenance

- Prefer Firefox for website checks and sign-ins. Jared requested this on
  September 12 because it works better for him than the Codex in-app browser.
  Codex remains the coding and agent-coordination workspace.

- Jared authorizes publishing verified TrailPack changes to the existing test
  website (Vercel Preview) for review without asking each time. Wait for explicit
  approval before merging into main or publishing/promoting the live production
  website (the conservative interpretation of his “main doc” boundary).
- On September 12, Jared specifically approved the reviewed lookup-quota
  addition to the database shared by Preview and Production. This does not
  authorize unrelated destructive migrations, credential/security changes, or
  production website publication.

- Use the source precedence and milestone/documentation rules above for weekly maintenance.
- Treat `docs/archive/project/` as historical context. Its plans and specifications describe completed or superseded work and are not the current backlog.
- Use actual merged work to distinguish delivered capabilities from queued plans. The September 10 acceptance plan records current gaps; it does not authorize implementation or resume shelved work.

## Cross-account handoff

Read docs/project-handoff.md before substantive project work. After meaningful decisions or completed steps, update that existing handoff with current state, checks, open issues, next action and a short dated entry. Reuse CHANGELOG.md under the existing user-facing change rules above. Do not create a duplicate central checkpoint or resume paused plans without authority. Both local accounts use the same saved files sequentially. Follow /Users/jaredrice/AI/WORKSPACE_RULES.md and load only relevant personal context, if any.
