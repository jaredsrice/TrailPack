# Dependency Audit Validation — 2026-07-25 Baseline And 2026-08-28 Release

## Scope

The July sections below preserve the dependency audit performed after adding
Playwright and axe accessibility testing. They are historical evidence, not the
current vulnerability count. The final section records the fresh `0.5.0`
release-candidate audit and remediation.

## Safe Remediation Applied

The unforced `npm audit fix` preview contained only patch and minor updates
within the repository's existing dependency ranges. The applied update included:

- Next.js `15.5.19` → `15.5.22`
- Tailwind CSS and `@tailwindcss/postcss` `4.3.1` → `4.3.3`
- top-level PostCSS `8.5.15` → `8.5.23`
- js-yaml `4.2.0` → `4.3.0`
- nanoid `3.3.12` → `3.3.16`
- brace-expansion `1.1.15` → `1.1.16` and `5.0.6` → `5.0.8`

This removed the direct July 2026 Next.js advisories affecting versions before
`15.5.21`, the top-level PostCSS findings, the js-yaml finding, and two older
brace-expansion findings.

## Remaining Audit Findings

After the safe remediation, `npm audit` reports twelve high-severity package
entries. These are twelve dependency-graph entries, not twelve independent
vulnerabilities:

- Three production entries are one Next.js chain: `next`, its bundled
  `postcss@8.4.31`, and its optional `sharp@0.34.5`.
- Nine development entries fan out from the brace-expansion out-of-memory
  advisory through minimatch, ESLint, ESLint plugins, and
  `eslint-config-next`.

The production-only audit therefore reports three entries. The remaining nine
are development tooling and are not deployed with the application.

## Risk Interpretation

Next.js `15.5.22` still declares PostCSS `8.4.31` and Sharp `^0.34.3`. The
current stable Next.js `16.2.12` also declares PostCSS `8.4.31` and Sharp
`^0.34.5`, so a framework major upgrade does not currently clear this audit
chain.

Vercel's maintainers state that the reported PostCSS issue does not affect
Next.js users in the normal model because the package runs at build time; an
attack would require building untrusted source content. TrailPack builds only
its reviewed repository content.

The Sharp advisory is more relevant because TrailPack uses `next/image`.
However, the patched Sharp `0.35.x` line is outside the version range currently
declared by stable Next.js. Forcing that transitive major-zero update would be
an unsupported compatibility override. The appropriate action is to retain the
patched Next.js maintenance release and adopt an official Next.js release that
supports patched Sharp when one is available.

The remaining brace-expansion path is used by local lint tooling. Exploitation
requires attacker-controlled glob expansion during development or CI; TrailPack
uses fixed, trusted lint commands. npm's suggested forced fix would cross major
tooling boundaries.

## Rejected Remediation

`npm audit fix --force` was not run. npm proposed:

- downgrading Next.js to `9.3.3`
- downgrading `@eslint/eslintrc` to `0.1.0`
- or crossing to ESLint 10 / Next.js 16 tooling

Those changes are breaking, do not represent a credible maintenance path for
this Next.js 15 and React 19 application, and would create more project risk
than the bounded transitive findings.

## Sources

- [Next.js July 2026 security release](https://nextjs.org/blog)
- [Vercel discussion of bundled PostCSS](https://github.com/vercel/next.js/issues/93234)
- [PostCSS path-traversal advisory](https://github.com/advisories/GHSA-r28c-9q8g-f849)
- [Sharp/libvips advisory](https://github.com/advisories/GHSA-f88m-g3jw-g9cj)
- [brace-expansion out-of-memory advisory](https://github.com/advisories/GHSA-mh99-v99m-4gvg)

## Follow-up

1. Re-run `npm audit --omit=dev` when Next.js publishes its next maintenance
   security release.
2. Upgrade only through a supported Next.js release; do not add a Sharp override
   without compatibility evidence.
3. Revisit the dev-only lint chain during a planned Next.js 16 and ESLint 10
   migration.

## Release-Candidate Reaudit — 2026-08-28

The dependency review was rerun after the application surface was frozen. Safe,
supported updates and explicit compatible overrides moved the release to:

- Next.js and `eslint-config-next` `15.5.24`;
- js-yaml `4.3.1`;
- nanoid `3.3.18`;
- PostCSS `8.5.23`;
- Sharp `0.35.3`; and
- brace-expansion `1.1.18` and `5.0.9` in the resolved graph.

Node's supported runtime floor is now explicit as `>=20.9.0`. The application
continued to build and pass its complete validation suite with these versions.

### Current Results

| Check | Result |
|---|---|
| `npm audit --json` | 0 vulnerabilities across 498 total dependencies |
| GitHub Dependabot open alerts after merge | 0 |
| GitHub secret-scanning open alerts | 0 |
| CodeQL on the release commit | JavaScript/TypeScript and Actions analyses passed; 0 open alerts |

No forced framework downgrade or incompatible major upgrade was used. The July
finding counts above are therefore closed historical observations and must not
be quoted as the current TrailPack risk state. Dependency monitoring is now part
of protected pull-request validation and GitHub's repository security features.
