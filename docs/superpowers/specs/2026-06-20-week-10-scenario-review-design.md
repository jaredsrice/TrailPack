# Week 10 Scenario Review Design

Date: 2026-06-20
Project: TrailPack
Scope: CSE 499A Week 10 evaluation scenarios and prototype buffer

## Goal

Complete the Week 10 milestone by running five scenario evaluations against the
current TrailPack prototype, fixing every weakness that is genuinely within Week
10 scope, and recording any later-week issues as explicit deferrals rather than
letting them blur into the current milestone.

## Proposal Alignment

The latest proposal defines Week 10 as:

- run `3-5` evaluation scenarios against the baseline recommendation output
- record which expected categories are covered, missing, or unclear
- use remaining time for `1-2` small rule, label, or interface fixes before the
  prototype demo

This design intentionally uses all five planned scenario types so the milestone
evidence is stronger than the minimum requirement.

## Current Product Boundary

TrailPack is still a narrow, rule-based prototype:

- supported trails are limited to three Grand Teton trails
- weather and alerts are demo data
- the app is intentionally `Rule-based · no AI`
- unsupported hikes still fall back to a limited manual-entry state

Week 10 work must respect that boundary. The goal is to make the current
prototype clean, defensible, and demo-ready, not to quietly expand it into a
larger product.

## Scenario Set

The evaluation set will cover the proposal's five scenario types:

1. `Short, low-risk day hike`
   - mapped to `Taggart Lake`
   - confirms the app avoids overpacking on an easy short hike

2. `Hot or exposed hike`
   - mapped to the most sun-exposed currently supported scenario, expected to
     be `Taggart Lake` or `String Lake Loop` after the initial review pass
   - confirms hydration and sun-protection behavior

3. `Cool, rainy, windy, or mountain-weather hike`
   - mapped to the saved `Jenny Lake Loop` weather context
   - confirms forecast-based weather protection behavior

4. `Steep, strenuous, or slippery hike`
   - mapped to `Jenny Lake Loop` with a long day and slippery conditions
   - confirms the strongest Week 9 rule path remains clean

5. `Incomplete-data case`
   - uses the current unsupported/manual-entry fallback
   - confirms the prototype still shows limited output expectations honestly and
     prompts only for missing details that materially help

If one trail proves to be a better fit during the initial review pass, the
mapping may shift, but the final evaluation set must still preserve one
scenario per proposal category.

## Evaluation Method

Each scenario will be reviewed using the running UI, not only unit tests.

For every scenario, the review note will capture:

- scenario name and inputs
- expected output categories based on the proposal
- actual visible output
- weaknesses found
- disposition for each weakness:
  - `fix now`
  - `defer`
  - `acceptable current behavior`

The review will judge the scenario against the proposal's evaluation language:

- core categories appear when appropriate
- reasons are specific and understandable
- source/evidence labels are honest
- missing-detail prompts are targeted
- the list avoids obvious unsupported claims or obvious overpacking

## Fix-Now Policy

An issue is `fix now` only when it directly harms one of the Week 10 scenario
reviews or the strongest live demo path and can be solved with a reasonably
small change.

Typical `fix now` categories:

- incorrect or missing rule behavior within current supported data
- confusing or misleading copy in the current UI
- weak or inconsistent labels that make the scenario harder to defend
- small interface friction in the primary demo path
- missing or weak milestone documentation

Typical `defer` categories:

- new data sources
- broader trail coverage
- AI-assisted recommendation work
- major UI redesign
- large manual-entry feature expansion
- anything that needs a new subsystem rather than a targeted polish change

## Validation Loop

The work should proceed in this order:

1. verify the current automated baseline still passes
2. run the five UI scenarios and record findings
3. cluster findings into `fix now`, `defer`, and `acceptable`
4. implement the `fix now` items
5. rerun the affected scenarios to confirm the weaknesses are gone
6. save the Week 10 scenario-review note
7. update `README.md` and `CHANGELOG.md` only if the final repo state or
   milestone claims materially changed

## Success Criteria

Week 10 is complete when all of the following are true:

- five proposal-aligned scenarios have been reviewed
- every in-scope weakness found during those reviews has been fixed
- every out-of-scope weakness has been explicitly deferred
- the strongest demo path is clean and low-friction
- one concise saved review note makes the milestone easy to defend

## Out Of Scope

The following are not required for Week 10 completion:

- new supported trails
- live production-grade weather or alerts
- AI generation or explanation features
- overnight-hike or broader trip-planning support
- major visual redesign unrelated to scenario-review weaknesses
