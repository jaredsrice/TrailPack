# TrailPack 499B demo

Use the reviewed test website in Firefox. Check the
[final audit record](validation/2026-09-12-final-audit.md) for the exact candidate
and any remaining acceptance limits. This script does not claim the demo has
already been delivered to the instructor.

## 1. Make a guest plan

Search for Jenny Lake Loop, select the supported profile, and wait for the
weather and NPS notices. Point out official facts, forecast data and missing
information. Enter a date and expected duration, then generate the list.
Open an item's explanation. The rules decide the items and their priorities;
an account and AI are not required.

## 2. Find a hike outside the catalog

Search live NPS hikes in Bryce Canyon for Fairyland Loop. Select the result.
Its NPS duration seeds the expected time out; unknown distance, elevation,
route type and accessibility remain unknown. This partial path does not check
weather, daylight or alerts. Generate a list, edit the duration, and update it.
The edited duration is now user-provided. Search for an invented trail name
to show the empty-result message and available manual entry.

## 3. Show optional AI and private saves

Return to the supported Jenny Lake Loop profile. Sign in with Google, then
select and generate the plan again after returning. Show one accepted live
review and its provider label. AI selects approved explanation highlights;
it cannot add items, remove items or change priorities and evidence labels.

Show a rejected-response test and its visible fallback without trying to make
the live provider generate an unsafe answer. Then save the plan, open Saved
plans, revisit its list and delete the disposable demo record. Sign out and
show that guest planning still works.

## 4. Explain source checks and security

Show the 50-profile NPS comparison report and the tests for confirmed versus
inconsistent changes. No page scraping occurs in the normal supported planner;
the monthly maintenance process is separate and only manages saved NPS facts.

Show the final security summary, one fixed issue and its regression test, and
the remaining risk decisions. Distinguish local tests, real provider checks,
hosted account checks and inherited two-account evidence.

## Simple feedback questions

1. Can you tell which information is official, forecast-based or unknown?
2. Is it clear why each important item is on the list?
3. Do the live lookup limits and AI fallback make sense?
4. Can you generate, update, save and revisit a plan without help?
5. What wording or action was confusing?

## Portfolio summary

TrailPack is a Next.js and TypeScript day-hike planner. It combines reviewed
trail facts, weather, official notices and trip inputs in a deterministic
packing engine. Optional AI is limited to validated explanation highlights.
Google sign-in enables private saved plans, while guests retain the full core
workflow. The project demonstrates source labeling, failure handling,
database access controls and automated unit, browser and security verification.
