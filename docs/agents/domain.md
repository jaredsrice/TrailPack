# Domain Docs

TrailPack is configured as a single-context repo.

## Before exploring, read these

- `CONTEXT.md` at the repo root, if it exists
- `docs/adr/` for architectural decisions relevant to the area being changed

If either is missing, proceed silently. Do not block work on creating them up front. Use `/domain-modeling` later when the project needs formal glossary or ADR updates.

## Expected structure

Single-context repos use one shared context document and one shared ADR folder:

```text
/
|- CONTEXT.md
|- docs/
|  `- adr/
`- src/
```

## Use the glossary's vocabulary

When naming domain concepts in issues, plans, tests, or code-review notes, prefer the terms defined in `CONTEXT.md`. Avoid drifting to synonyms if the glossary defines a preferred term.

If a concept is missing from the glossary, either the project does not use that term or the glossary needs to be expanded. Note that gap for `/domain-modeling`.

## Flag ADR conflicts

If a proposed change contradicts an ADR, surface that conflict explicitly instead of silently overriding it.
