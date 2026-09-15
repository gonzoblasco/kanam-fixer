# AGENTS.md - kanam-fixer

Project-specific operating rules. They complement, not replace, the workspace-global rules (which live in `../AGENTS.md` and are applied through the root `CLAUDE.md`): always use the hyphen `-` (never the em dash U+2014 / en dash U+2013), atomic commits in English, mandatory verification before committing.

## What this project is (one line)

**From attributes to what is heard:** assert the **screen reader announcement**. Same assertion, two planes: virtual driver in CI, real reader (VoiceOver) locally.

## The idea that must not break

- **We test what the screen reader SAYS, not what the DOM has.** An ARIA attribute that is correct in the DOM is NOT proof it announces well (see `witness-case`). Do not "fix" an assertion to use the DOM instead of the announcement.
- **The virtual plane is an honest subset, not the full truth.** Measured in S4: the virtual driver **derives** the position, **repeats** wrong attributes and has **no** announcement moment (timing). It produces no announcement to race against. That is why the witness case #4109 (timing + viewport) only reproduces on the real reader, and why the virtual plane can give a **false green** on that class of bug.
- **Always document the limitation.** Every time the README or an ADR is touched, keep the table of which bug classes the virtual plane catches and which it does not. Over-promising is what killed `a11y-fixer` (0 users).

## Stack and commands (verified)

- **TypeScript + Node** (`type: module`), **Biome 2** (lint+format), **Vitest 5**, **Playwright**, **jsdom**.
- Real-plane tests use **Guidepup/Playwright + `@guidepup/guidepup`**; the virtual plane uses `@guidepup/virtual-screen-reader`.
- **Pre-commit hooks** (`simple-git-hooks`, `prepare`): lint -> test -> build. Do not bypass them; if a hook blocks, fix the cause.
- Commands: `npm test` (vitest run), `npm run lint`, `npm run format`, `npm run build` (tsc).

## Domain rules (a11y)

- The workspace skill `a11y-at-validation` is the reference: what a unit test can verify (ARIA attributes, roles, structure) vs. what is ONLY verified by hand (the phrase, the timing, real interaction with roving focus / `aria-activedescendant`). If a change touches the reader announcement, a green test is not enough.
- **Never over-promise in the reader compatibility matrix.** The announcement is not universal (reader x version x OS). If it is not verified, write "not verified", not "supported".

## Current state and live decisions

- **Cycle 0.0.1 CLOSED.** S1-S2 and S4-S5 completed; **S3 blocked by upstream** (`guidepup/guidepup` does not publish a Darwin 27 asset; reported in guidepup/guidepup#149).
- **Decision: do not open 0.0.2 yet.** The next step depends on S3, which depends on Guidepup publishing that asset. Opening 0.0.2 today would be investing in the most fragile part without solving it first. Do not relaunch 0.0.2 without first checking if the asset now exists.
- ADR-0001 (thin layer over Guidepup) and ADR-0002 (reader matrix) are the founding decision; do not contradict them without a new ADR.
- Public repo, `private: true` package, **not published to npm**. Do not show `import from 'kanam-fixer'` examples as if it were installable.

## What is NOT done

- The witness case #4109 is not rewritten as "proof that the virtual plane covers it" - it is the **ecosystem gap**, the evidence of the problem this product attacks, not a driver feature.
- No features are added to `0.0.1` (it is closed); the next unit is `0.0.2` once the blocker clears.
