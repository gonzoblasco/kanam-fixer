# kanam-fixer

Assert what a screen reader announces, not the attributes.

**Status: cycle 0.0.1 closed. The bet holds for part of the problem, and measuring that is the result.** See [What the cycle found](#what-the-cycle-found).

## The problem

Every mainstream accessibility tool tests **attributes and structure**. None of them tests **what the screen reader says**.

That gap is documented in our own practice. A real case, [radix-ui/primitives#4109](https://github.com/radix-ui/primitives/pull/4109) and [#4110](https://github.com/radix-ui/primitives/issues/4110): a component shipped correct `aria-posinset` in the DOM, with all unit tests green, and VoiceOver still announced **nothing** for the first option. A timing race between mount and the announcement. No unit test could catch it, because the attributes were right.

Today that class of bug is found by hand: open the storybook, turn on the screen reader, listen. It is specialist work, and it does not scale to every pull request.

## What this is

An assertion over the **announcement** of a screen reader, written once and run on two planes:

| Plane | Driver | Where it runs | What it is for |
|---|---|---|---|
| Fast | virtual screen reader | CI, any OS | Catch announcement regressions on every pull request |
| Truth | real screen reader (VoiceOver, NVDA) | locally, macOS / Windows | Confirm before shipping |

The same assertion, two drivers behind it:

```ts
import { expectAnnouncement } from '../src/index.js';

await expectAnnouncement(container, [
  'group, Channels',
  'button, Email, pressed',
]);
```

The driver is optional (`{ driver: realDriver }` switches planes). Pass either; the assertion is the same call.

> **Not published.** The package is `private: true` and is not on npm. The import above is the in-repo path, not an installable dependency. Publishing is a separate decision that this cycle did not take.

## What the cycle found

Cycle 0.0.1 did not ship features. It tested the bet, and the answer is **partial**. Measured, not assumed:

| Bug class | Does the virtual plane catch it? | Evidence |
|---|---|---|
| **Attributes and composition** | **Yes** | Removing `aria-pressed` changes the announcement from `button, Email, pressed` to `button, Email`. Same for a missing `aria-label` on a group and a heading replaced by a labelled container. |
| **Timing and viewport** | **No** | See below. |

The witness case above is a **gap in the ecosystem, not a demonstration of this tool**. Verified with discriminating probes:

| Probe | What the driver did |
|---|---|
| Position attributes **absent** | Still announced `position 1, set size 4`, derived from the list structure. It does not notice the missing attribute. |
| Attributes **deliberately wrong** (`9` of `99` on a list of 4) | Echoed them as given. It reflects the declaration, not the truth. |
| Attribute applied **late** vs **never** | Identical output. There is no announcement moment to race against. |

Both real causes live in the real screen reader and the browser: a count derived from the visible viewport, and a race at the moment of announcement. A driver that walks the accessibility tree once has neither.

**Consequence worth stating plainly: the virtual plane can give a false pass on timing bugs.** It is a cheap regression net for attributes, not proof that a user hears the right thing.

## What this is not

- **Not a scanner.** It does not replace axe-core, and it does not compete with it. If the problem is an empty `alt`, axe-core already solves that better.
- **Not a replacement for testing with real users.** The virtual plane is a net; only the real reader, and ultimately people, decide.
- **Not a reporting dashboard.**
- **Not SaaS.** No lock-in, it runs on the machine of whoever uses it.

## The reader matrix

What a screen reader announces is **not universal**: the phrase varies by reader, by reader version, and by operating system. An assertion without a declared matrix (reader x version x OS) is not valid, and the matrix travels with the result. See [`docs/adr/ADR-0002-matriz-de-lectores.md`](docs/adr/ADR-0002-matriz-de-lectores.md).

The matrix version is read from the installed package rather than written by hand, so it cannot drift from what actually runs.

## Dependencies

This project builds on **[Guidepup](https://github.com/guidepup/guidepup)**, which automates real screen readers (VoiceOver on macOS, NVDA on Windows) and provides the virtual driver used in CI. Our own API is the only supported surface: Guidepup is never exported to users directly. See [`docs/adr/ADR-0001-capa-sobre-guidepup.md`](docs/adr/ADR-0001-capa-sobre-guidepup.md).

### Known limitation: the real plane needs a supported platform

Guidepup selects its VoiceOver driver by the **major Darwin version** of the host. On a platform with no matching asset it cannot start the reader, and the error it throws (`VoiceOver cannot be started`) hides the actual cause (`macOS version not supported`) in a nested one. Reported upstream as [guidepup/guidepup#149](https://github.com/guidepup/guidepup/issues/149).

On such a platform the real-reader suite **skips and prints why** rather than passing quietly:

```
REAL_READER_UNAVAILABLE: VoiceOver cannot be started | macOS version not supported
```

This is exactly the risk ADR-0001 anticipated as the hardest one: the virtual driver runs on any OS, while the real one depends on an asset existing for the exact system version.

## Development

```bash
npm install
npm test      # vitest run
npm run lint  # biome check
npm run build # tsc
```

Git hooks run lint, test and build before each commit.
