## Agent skills

### Issue tracker

Issues and PRDs for this repo live in GitHub Issues for `jaredsrice/TrailPack`. See `docs/agents/issue-tracker.md`.

### Triage labels

Triage uses the canonical label strings `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, and `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

TrailPack is configured as a single-context repo that uses the root `CONTEXT.md` and `docs/adr/` when they exist. See `docs/agents/domain.md`.

## Project maintenance

- Compare weekly code changes against the latest senior-project proposal under `../Project Proposals/` and the active plans/specs under `docs/superpowers/`.
- Prefer the highest-numbered `TrailPack_Proposal_v*.docx` as the current proposal when it diverges from the older `TrailPack_Formal_Project_Proposal_Draft.md`.
- Use those documents plus the actual merged work to assess milestone progress and current scope.
- When completed work changes the app's user-facing behavior, supported features, milestone status, or documented scope, update `README.md` and `CHANGELOG.md` systematically.
- If the implementation and the proposal diverge, call that out explicitly instead of leaving the docs stale.
