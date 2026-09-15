import { describe, expect, it } from 'vitest';

import { expectAnnouncement, readAnnouncements } from '../src/index.js';
import {
  optionPositions,
  settleWitness,
  WITNESS_OPTIONS,
  witnessHtml,
} from './fixtures/witness-listbox.js';

/**
 * Witness case: radix-ui/primitives #4109 and #4110.
 *
 * This suite is a CHARACTERIZATION test of the virtual driver, written to
 * answer one question: can this plane reproduce the witness case at all?
 *
 * It cannot, and these tests pin down exactly why, so the reason cannot be
 * lost or re-guessed later. The assertions describe observed driver
 * behaviour, verified with discriminating probes, not assumptions.
 *
 * The real case, read from the issues on 2026-09-15:
 *   #4109 added computed aria-posinset/aria-setsize to Select.Item.
 *   #4110 (open) reports the FIRST option announcing nothing to VoiceOver +
 *   Chrome when no value is preselected: a timing race, plus a count that
 *   the browser derives from the options visible in the viewport.
 *
 * Both causes live in the real AT and the browser. Neither exists in a
 * driver that walks the accessibility tree once and derives what the markup
 * does not declare.
 */

/** Renders a listbox whose options declare deliberately wrong positions. */
function listboxWithWrongAttributes(): string {
  const items = WITNESS_OPTIONS.map(
    (label, index) =>
      `<li role="option" aria-posinset="${index + 9}" aria-setsize="99" aria-selected="false">${label}</li>`,
  ).join('');
  return `<ul role="listbox" aria-label="Fruits">${items}</ul>`;
}

/** Renders a listbox whose options declare no position at all. */
function listboxWithoutAttributes(): string {
  const items = WITNESS_OPTIONS.map(
    (label) => `<li role="option" aria-selected="false">${label}</li>`,
  ).join('');
  return `<ul role="listbox" aria-label="Fruits">${items}</ul>`;
}

describe('witness case: what the virtual plane can see', () => {
  it('announces declared positions when the markup is correct', async () => {
    document.body.innerHTML = witnessHtml('correct');
    settleWitness('correct');

    const { phrases } = await readAnnouncements(document.body);

    expect(phrases).toContain('option, None, not selected, position 1, set size 4');
  });

  it('echoes declared attributes even when they are wrong', async () => {
    document.body.innerHTML = listboxWithWrongAttributes();

    const { phrases } = await readAnnouncements(document.body);

    // The reader trusts what the markup declares: it reports position 9 of
    // 99 for a list of 4. It reflects the declaration, not the truth.
    expect(phrases).toContain('option, None, not selected, position 9, set size 99');
  });
});

describe('witness case: what the virtual plane cannot see', () => {
  it('DERIVES position and size from structure when the attributes are absent', async () => {
    document.body.innerHTML = listboxWithoutAttributes();

    const { phrases } = await readAnnouncements(document.body);

    // This is the finding. With no aria-posinset at all, the reader still
    // announces "position 1, set size 4", derived from the list structure.
    //
    // Consequence: the virtual plane does NOT detect the missing-attribute
    // regression that #4109 fixed. The real AT got the count wrong in the
    // wild; this driver recomputes it correctly and stays silent.
    expect(phrases).toContain('option, None, not selected, position 1, set size 4');
  });

  it('is insensitive to WHEN the attribute is applied, so it cannot model the race', async () => {
    const readTimingRace = async (settled: boolean): Promise<string[]> => {
      document.body.innerHTML = witnessHtml('timingRace');
      if (settled) {
        settleWitness('timingRace');
      }
      const { phrases } = await readAnnouncements(document.body);
      return phrases;
    };

    const beforeSettle = await readTimingRace(false);
    const afterSettle = await readTimingRace(true);

    // Identical output either way. The driver reads the tree at one point and
    // derives what is missing, so "the attribute arrives later" and "the
    // attribute never arrives" are indistinguishable to it. There is no
    // announcement moment to race against, which is exactly why the #4110
    // bug class cannot be reproduced here.
    expect(beforeSettle).toEqual(afterSettle);
  });

  it('reads the DOM it was given, so a green run here is not proof of the audio', async () => {
    document.body.innerHTML = witnessHtml('timingRace');
    settleWitness('timingRace');

    // The unit-test view and the announcement view agree, because both read
    // the same tree. Agreement here says nothing about what a user hears.
    const positions = optionPositions();
    expect(positions[0]).toEqual({
      label: 'None',
      posinset: '1',
      setsize: String(WITNESS_OPTIONS.length),
    });

    const { phrases } = await readAnnouncements(document.body);
    expect(phrases).toContain('option, None, not selected, position 1, set size 4');
  });
});

describe('witness case: the assertion still works as an assertion', () => {
  it('fails when the announcement does not match, on this fixture too', async () => {
    document.body.innerHTML = listboxWithWrongAttributes();

    await expect(
      expectAnnouncement(document.body, ['option, None, not selected, position 1, set size 4']),
    ).rejects.toThrow(/Announcement mismatch/);
  });
});

describe('witness variant sanity', () => {
  it('the timing-race fixture really omits the first position before settling', () => {
    document.body.innerHTML = witnessHtml('timingRace');

    expect(optionPositions()[0]?.posinset).toBeNull();
    expect(optionPositions()[1]?.posinset).toBe('2');
  });

  it('the correct fixture declares the first position from the start', () => {
    document.body.innerHTML = witnessHtml('correct');

    expect(optionPositions()[0]?.posinset).toBe('1');
  });
});
