# B-01 NPS lookup provider proof

Date: September 11, 2026. Scope: a narrow live hiking-activity lookup, not a
universal trail catalog or admission of new complete route profiles.

## Permission, attribution and limits

The official [NPS developer guides](https://www.nps.gov/subjects/developer/guides.htm)
permit API use with a key, document the `X-Api-Key` header, and state a default
1,000 requests per hour per key across endpoints. The
[official API schema](https://www.nps.gov/subjects/developer/customcf/swagger.json?03142019)
documents Things To Do query, park, result-limit and relevance-sort fields.
The [NPS disclaimer](https://www.nps.gov/aboutus/disclaimer.htm) distinguishes
NPS-created public-domain material from third-party exceptions and disclaims
endorsement. TrailPack attributes each result to its official NPS source link;
it does not import activity HTML, photographs, third-party media, or imply NPS
endorsement. No runtime page scraping is used.

Requests use the fixed HTTPS Things To Do endpoint, a server-only key header,
one chosen park, 3–100 characters, relevance sorting, five candidates, a
five-second deadline and a streamed 128 KiB cap. Redirects fail closed. Query
text goes to NPS only on explicit Search NPS. No trip notes, account identifiers,
or other planning inputs accompany the search.

The app caches successful/empty searches for 60 seconds in bounded local memory
and coalesces identical in-flight requests. These are optimizations, not global
quota enforcement. The new database-owned token bucket permits 20 initial
claims then one every six seconds, at most 620 claims in an hour. It is shared
across workers and retains no search text or user/IP identifiers. RPC/config
failure prevents an upstream call. The quota migration is tested locally but
has **not** been applied or verified on the hosted database. The NPS key is also
used by alerts and may have other consumers, so this budget is not a guarantee
against all upstream 429 responses.

## Benchmark and observed results

Twelve hiking records outside the Grand Teton catalog were queried twice.
Raw-provider results found 12/12 expected identities in the top five and 11/12
at rank one on both runs. Ship Harbor was rank three. Observed response sizes
were about 21–32 KiB. These are bounded engineering samples, not exhaustive
coverage or ongoing availability guarantees.

| Park | Query / expected record | NPS ID | Structured duration | Raw rank |
|---|---|---|---|---:|
| Zion | Watchman Trail | 671CA42A-5287-4EC6-AD13-4841D2F9B724 | 1–2 hours | 1 |
| Zion | Riverside Walk | 823A078C-D324-4648-B910-F15507E67244 | 1–2 hours | 1 |
| Zion | Canyon Overlook | 97CF105C-B416-4CDC-B84F-2A2C96D870DB | 1–2 hours | 1 |
| Zion | Timber Creek Overlook | 9D7B17DE-663C-4A85-A09D-183C71E5EE96 | 30–60 minutes | 1 |
| Acadia | Hike Wonderland Trail | 499B5C65-0F4F-4142-A07E-16247BDB6041 | 30–60 minutes | 1 |
| Acadia | Hike Ship Harbor Trail | E338EECC-5B91-413F-B458-530F4259BFBD | 30–60 minutes | 3 |
| Acadia | Hike Jordan Pond Path | 41462DC0-C153-477C-879E-7E6B96DC5605 | 1–3 hours | 1 |
| Acadia | Hike Gorham Mountain Loop | 10F40DD4-C607-4F92-9F57-4AEE7764D305 | 1–3 hours | 1 |
| Bryce Canyon | Navajo Loop Trail | 81107E17-255C-437C-8D29-CEC5FA52A18A | 1–2 hours | 1 |
| Bryce Canyon | Fairyland Loop | 6E21CE5C-45E4-4B66-9445-8764E89BCEC5 | 4–5 hours | 1 |
| Bryce Canyon | Mossy Cave Trail | 319A8199-8F7F-4A71-832D-02F7BD8A4389 | 30–60 minutes | 1 |
| Bryce Canyon | Bristlecone Loop Trail | 5011BA4F-E4A2-4A60-A723-18E2AA391728 | 30–60 minutes | 1 |

The implemented adapter was then exercised against the live provider for these
same 12 queries in two additional final runs. Both returned **12 expected
identities, zero unrelated admitted results**. An earlier normalization run
rejected Bryce results because NPS calls their activity `Front-Country Hiking`,
not `Hiking`. The real category was added with a red/green regression before
the successful final runs. Broad/nongeneric NPS searches are not uniformly
reliable: exploratory Rocky Mountain queries returned unrelated activities,
and Yosemite records could lack useful duration. Those parks are not enabled.

## Normalization and useful output

Selectable records require a bounded plain title, official HTTPS
`www.nps.gov/thingstodo/*.htm` URL without query/credentials, record ID,
matching park/name/state, Hiking or Front-Country Hiking category, all query
tokens in the title, and a parseable 0.25–12-hour duration. Choices remain
explicit; the app never silently takes provider rank one.

The separate partial model stores identity, source URL, retrieval time,
duration, and explicit null distance/gain/route type. It never weakens the
complete catalog model. For example, Fairyland's 4–5-hour duration seeds five
hours and changes hydration and power-backup guidance versus blank manual
entry. Item-level notes identify the NPS duration input. Edited time out and
other entered facts are user-provided, not promoted to NPS facts.

The partial path uses conservative manual packing rules, an explicit
Generate/Update boundary, and prompts for missing details. It does not request
weather, daylight, alerts, AI, or private persistence. Missing alerts mean
unavailable, not clear. No-result, malformed, timeout, unavailable, or
rate-limited lookup leaves manual entry accessible.

## Acceptance boundary

Unit/route/SQL and desktop/mobile browser fixtures validate the local path.
The live adapter proof above uses the real existing key without printing it;
it is not a hosted end-to-end demo. Before B-01 is marked delivered, apply the
quota migration to the approved environment, verify its shared behavior there,
deploy an approved preview, and demonstrate search, source/gaps, added detail,
generation, and manual fallback on that preview.
