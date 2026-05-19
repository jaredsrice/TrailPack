# TrailPack Week 5 UI/UX Workflow

Date: 2026-05-19  
Course phase: CSE 499A Week 5  
Milestone: Low-fidelity UI/UX workflow note completed with main screens/states, required hike-profile fields, missing-detail prompts, uncertainty labels, and AI/explanation boundaries.

## Direction

TrailPack will use a single-page, search-led workflow for the prototype. The page should feel simple and outdoors-focused: a nature or mountain background, a large title near the top that says "Where would you like to go?", and one primary search bar directly below it.

The prototype will use a hybrid search path. The search experience should feel open-ended to the user, but suggestions will prioritize supported parks, supported trails, and a manual-entry fallback. This keeps the product vision simple while making the Week 8 thin vertical slice realistic even if live trail lookup is limited.

## Primary User Flow

1. The user lands on the TrailPack page.
2. The user sees the title "Where would you like to go?" and a search bar.
3. As the user types, TrailPack shows suggested parks, supported trails, and a manual-entry option.
4. If the user selects a park, the same page reveals a trail prompt filtered to that park when possible.
5. If the user selects a trail, the page reveals known trail details and source labels.
6. If important details are missing, the page asks only for the missing fields that would improve the packing list.
7. TrailPack generates a packing list lower on the same page.
8. The user sees essential items, optional items, short explanations, and uncertainty labels.

## One-Page States

Although the experience stays on one page, the interface should move through clear states.

### State 1: Initial Search

The page shows the scenic background, TrailPack branding, the main title, and an empty search bar.

Primary action: Search for a park or trail.

Empty-state copy can stay minimal. The page should not explain the entire product before the user starts.

### State 2: Suggestions

As the user types, suggestions appear below the search bar.

Suggestion types:

- Supported park
- Supported trail
- Manual hike entry
- Future live lookup result, if Week 6 feasibility research supports it

Each suggestion should make its type clear so the user understands whether they are selecting a park, a trail, or entering details manually.

### State 3: Park Selected

If the user selects a park, the page keeps the selected park visible and reveals a trail prompt below it.

The trail prompt should show supported trails for that park first. If no supported trail fits, the page should offer manual trail entry.

### State 4: Trail Selected Or Entered

Once a trail is selected or entered, the page shows a compact hike profile summary.

The summary should include known values and label where they came from, such as supported profile, user-provided, forecast-based, inferred, missing, or unavailable.

### State 5: Missing-Detail Prompts

If TrailPack does not have enough information to make useful recommendations, the page asks for only the fields that matter most.

The prompt should avoid becoming a long form. It should feel like the app is asking for a few useful details, not handing the user homework.

### State 6: Packing List Output

The bottom section shows the generated packing list.

Output groups:

- Essential items
- Optional items
- Missing details that could improve the result

Each item should include a short reason tied to trail data, weather/context, user input, or an uncertainty label.

## Required Hike-Profile Fields

The structured hike profile should support these fields for the prototype and future requirements spec.

- Trail name
- Park, region, or area
- State or general location
- Coordinates, if available
- Distance in miles
- Elevation gain in feet
- Route type, such as out-and-back, loop, or point-to-point
- Expected duration, if known or user-provided
- Difficulty or effort level, if available
- Weather date or planned hike date
- Weather/context summary, such as heat, cold, rain, wind, snow, or sun exposure
- Known trail conditions from the user, such as muddy, icy, exposed, shaded, or unknown
- Official alerts or closures, if available
- User notes
- Source labels for each major field

## Missing-Detail Prompts

TrailPack should ask for missing details only when the answer would materially change the packing list.

High-priority prompts:

- "How long is the hike?"
- "About how much elevation gain is there?"
- "What type of route is it?"
- "When do you plan to hike?"
- "How long do you expect to be out?"
- "Do you know of any current trail conditions?"

Lower-priority prompts:

- "Is the trail mostly exposed or shaded?"
- "Will you have reliable water access?"
- "Are there any official alerts or closures you already know about?"

For the prototype, the app can still generate a limited packing list when some details are missing, but the output should clearly explain what is missing and how that limits the recommendation.

## Uncertainty Labels

TrailPack should label data honestly so the user knows what is known, inferred, or missing.

Labels to use:

- Supported profile: From a saved prototype hike profile.
- User-provided: Entered or confirmed by the user.
- Forecast-based: Based on weather or weather-like context.
- Official: From an official park, recreation, or alert source.
- Inferred: Reasonable estimate from available data, not confirmed trail truth.
- Missing: Needed field has not been provided.
- Unavailable: TrailPack looked for the field but does not have it.
- Future work: Useful signal that is outside the current prototype scope.

## AI And Explanation Boundaries

The CSE 499A prototype should not depend on AI to generate the core packing list. The Week 5 design should support AI later, but the Week 8 thin vertical slice should work with saved profiles, user-provided details, weather/context data, and rule-based recommendation logic.

If AI-assisted explanations are added later, the AI should only receive structured data that TrailPack already has. It should not invent trail conditions, imply official knowledge without a source, ignore missing fields, or recommend items without a reason tied to available data.

Every explanation should be short, practical, and evidence-based. If a recommendation depends on uncertain information, the explanation should say so plainly.

## Prototype Scope

For the first working version, TrailPack should focus on:

- One search-led page
- Supported park and trail suggestions
- Manual-entry fallback
- Compact hike profile summary
- Missing-detail prompts
- Rule-based packing list output
- Essential and optional item groups
- Clear source and uncertainty labels

Live trail lookup, expanded trail coverage, official alerts, review sentiment, wildlife risk, water-source data, and remoteness indicators should remain optional until the Week 6 feasibility work shows what is reliable.

## Week 6 Handoff

This workflow gives Week 6 a clear data question to answer: which public sources can reliably support the search suggestions and hike-profile fields?

If live lookup is limited, the prototype can still move forward with supported hike profiles and manual entry. If live lookup is useful, it can be added behind the same one-page search experience without changing the main workflow.
