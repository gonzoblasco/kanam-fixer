# kanam-fixer

Assert what a screen reader announces, not the attributes.

## The problem

Every mainstream accessibility tool tests **attributes and structure**. None of them tests **what the screen reader says**.

That gap is documented in our own practice. A real case: a component shipped correct `aria-posinset` in the DOM, with 51 unit tests green, and VoiceOver still announced **nothing** for the first option. A timing race between mount and the announcement. No unit test could catch it, because the attributes were right.

Today that class of bug is found by hand: open the storybook, turn on the screen reader, listen. It is specialist work, and it does not scale to every pull request.

| Verifiable by a unit test | Only verifiable by listening |
|---|---|
| ARIA attributes in the DOM | **The announced phrase** |
| Roles, `aria-labelledby`, `aria-selected` | **Announcement timing** (whether it is said at all) |
| Accessibility tree structure | Real interaction (roving focus, `aria-activedescendant`) |

## What this is

An assertion over the **announcement** of a screen reader, written once and run on two planes:

| Plane | Driver | Where it runs | What it is for |
|---|---|---|---|
| Fast | virtual screen reader | CI, any OS | Do not break the announcement on every pull request |
| Truth | real screen reader (VoiceOver, NVDA) | locally, macOS / Windows | Confirm before shipping |

The same assertion, two drivers behind it. That is the point: what today is manual specialist work becomes a repeatable check.

## What this is not

- **Not a scanner.** It does not replace axe-core, and it does not compete with it. If the problem is an empty `alt`, axe-core already solves that better.
- **Not a reporting dashboard.**
- **Not SaaS.** No lock-in, it runs on the machine of whoever uses it.

## Honest status

**Version 0.0.1, slice S1: skeleton only.** This package currently ships project setup and tooling, and **no accessibility logic**. The assertion API described above lands in slice S2. Nothing here is part of that API yet.

The 0.0.1 cycle does not ship features: it tests the bet. If the bet does not hold, it is discarded before more is invested.

## The reader matrix

What a screen reader announces is **not universal**: the phrase varies by reader, by reader version, and by operating system. An assertion without a declared matrix (reader x version x OS) is not valid. See `docs/adr/ADR-0002-matriz-de-lectores.md`.

## Dependencies

This project builds on **Guidepup**, which automates real screen readers (VoiceOver on macOS, NVDA on Windows) and provides the virtual driver used in CI. Our own API is the only supported surface: Guidepup is never exported to users directly. See `docs/adr/ADR-0001-capa-sobre-guidepup.md`.

## Development

```bash
npm install
npm test      # vitest run
npm run lint  # biome check
npm run build # tsc
```

Git hooks are installed on `npm install` and run lint, test and build before each commit.
