# Week 8 / Week 9 Validation Notes

Date: 2026-06-19
Project: TrailPack
Scope: CSE 499A Week 8 and Week 9 milestone closeout

## Proposal Targets Checked

### Week 8

- Create `2-3` saved or supported hike/weather profiles for prototype testing.
- Route one supported profile through normalized data into a visible packing-list output.
- Add placeholder missing-detail prompts for the most important missing fields.

### Week 9

- Implement `6-8` baseline recommendation rules for core day-hike conditions.
- Add template explanations for recommendations triggered by those rules.
- Manually check the rules against one supported scenario.

## Current Repo Assessment

### Week 8 status: complete

The current repo satisfies the Week 8 slice:

- Three supported trail profiles exist in `src/data/supported-trails.ts`:
  - `Jenny Lake Loop`
  - `Taggart Lake`
  - `String Lake Loop`
- Each supported trail has a saved demo weather/alert scenario in
  `src/data/demo-contexts.ts`.
- The main UI routes supported trails into a visible packing-list output through
  `src/components/TrailPackShell.tsx`.
- Missing-detail prompts are still present in the visible UI and recommendation
  output.

### Week 9 status: complete for the baseline milestone

The current repo satisfies the Week 9 baseline-rule milestone:

- The rule engine in `src/lib/packing.ts` already exceeds the minimum `6-8`
  baseline-rule target.
- Recommendation items carry short template explanations.
- Automated tests already cover duration handling, trail-condition handling,
  negation, provenance, and supported-trail coverage in
  `src/lib/packing.test.ts`.

## Automated Verification

Ran from the repo root on 2026-06-19:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`

Observed result:

- `lint`: passed
- `typecheck`: passed
- `test`: passed with `4` test files and `64` tests
- `build`: passed

## Manual UI Validation

Environment:

- Started the local app with `npm run dev`
- Port `3000` was already occupied, so Next.js served TrailPack at
  `http://localhost:3001`

### Week 8 manual UI check

Observed in the running app:

- Searching `teton` showed the supported Grand Teton park plus all three
  supported trail suggestions.
- Selecting `Grand Teton National Park` showed all three supported trail cards:
  `Jenny Lake Loop`, `Taggart Lake`, and `String Lake Loop`.
- Selecting `Taggart Lake` produced a visible packing list.
- Selecting `String Lake Loop` produced a visible packing list.

This is enough to defend the Week 8 milestone as complete in the current UI.

### Week 9 official validation scenario

Scenario used:

- Trail: `Jenny Lake Loop`
- Search term: `Jenny Lake`
- Expected duration: `7 hours`
- Trail conditions: `icy and muddy`

Observed visible rule-driven output in the UI:

- `Water: 2-3 liters`
- `Headlamp`
- `Bear spray`
- `Rain shell`
- `Sun protection`
- `Traction devices (microspikes)`
- `First-aid basics`
- `Extra food`
- `Trekking poles`
- `Waterproof boots or gaiters`
- `Offline map`
- `Extra warm layer`

Observed behavior notes:

- The longer planned day changed the hydration reason to the user-provided
  duration and added `Headlamp` plus `Extra food`.
- The reported icy condition added `Traction devices (microspikes)` and
  `Trekking poles`.
- The reported muddy condition added `Waterproof boots or gaiters`.
- The UI still showed only the planned-date prompt under missing details after
  duration and trail conditions were provided, which matches the current design.

Conclusion:

- The scenario visibly exercises well over the proposal's `6-8` baseline-rule
  threshold.
- The current implementation is strong enough to count Week 9 as complete for
  the baseline recommendation milestone.

## Proposal Divergence To Surface Explicitly

The codebase is in a reasonable state for Week 8 / Week 9, but it does diverge
from the broader full-proposal framing in two important ways:

- The supported-trail prototype is intentionally narrower than the proposal's
  broader multi-region examples. The current implementation focuses on three
  Grand Teton trails only.
- The current UI explicitly says `Rule-based · no AI`. The guarded AI-assisted
  path described in the proposal is still deferred and is not implemented in
  this repo yet.

Neither divergence blocks Week 8 or Week 9 completion, but both should stay
visible in future status updates so the proposal is not treated as if those
parts are already delivered.

## Milestone Conclusion

- Week 8: complete
- Week 9: complete for the baseline recommendation milestone

Next milestone implications:

- Week 10 can focus on running `3-5` scenario evaluations and recording any
  small rule, label, or UI fixes.
- Later proposal work still remains for broader coverage and any guarded AI path.
