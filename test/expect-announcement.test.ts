import { describe, expect, it } from 'vitest';

import { describeMatrix, expectAnnouncement, readAnnouncements } from '../src/index.js';
import { settingsPanel } from './fixtures/settings-panel.js';

/**
 * The announcement the panel must produce. Written against phrases observed
 * from the virtual driver, not against guessed output.
 */
const EXPECTED_ANNOUNCEMENT = [
  'document',
  'main',
  'heading, Notification settings, level 1',
  'form',
  'group, Channels',
  'button, Email, pressed',
  'button, SMS, not pressed',
  'end of group, Channels',
  'end of form',
  'end of main',
  'end of document',
];

function render(markup: string): void {
  document.body.innerHTML = markup;
}

describe('expectAnnouncement', () => {
  it('passes for the correct panel', async () => {
    render(settingsPanel());

    await expectAnnouncement(document.body, EXPECTED_ANNOUNCEMENT);
  });

  it('reports the matrix the assertion was valid against', async () => {
    render(settingsPanel());

    const { matrix } = await readAnnouncements(document.body);

    // ADR-0002: an assertion without a declared matrix is not valid. The
    // version is read from the installed package, so it cannot drift.
    expect(matrix.reader).toBe('virtual');
    expect(matrix.version).not.toBe('unknown');
    expect(describeMatrix(matrix)).toContain('virtual');
  });
});

/**
 * The exit criterion of S2: the assertion has to FAIL when the component is
 * mutated, and it has to fail for the right reason.
 *
 * The failure message always lists the expected phrases, so matching on those
 * would pass for any mismatch at all. These tests therefore assert on what
 * the reader actually ANNOUNCED for the broken variant, which is the thing
 * that must have changed.
 */
describe('the assertion detects a broken announcement', () => {
  it('announces the group without its name when the name is dropped', async () => {
    render(settingsPanel({ break: 'missingGroupName' }));

    const { phrases } = await readAnnouncements(document.body);

    // The correct panel says "group, Channels"; the broken one loses the name.
    expect(phrases).toContain('group');
    expect(phrases).not.toContain('group, Channels');
    await expect(expectAnnouncement(document.body, EXPECTED_ANNOUNCEMENT)).rejects.toThrow(
      /Announcement mismatch/,
    );
  });

  it('announces the toggle without its pressed state when aria-pressed is dropped', async () => {
    render(settingsPanel({ break: 'pressedOnToggleOnly' }));

    const { phrases } = await readAnnouncements(document.body);

    // The attribute is what makes the state audible: without it the reader
    // says the name alone. The visual button is unchanged.
    expect(phrases).toContain('button, Email');
    expect(phrases).not.toContain('button, Email, pressed');
  });

  it('announces a named container instead of a heading when the heading is dropped', async () => {
    render(settingsPanel({ break: 'labelInsteadOfName' }));

    const { phrases } = await readAnnouncements(document.body);

    // Same text on screen, different structure: no level is announced.
    expect(phrases).toContain('Notification settings');
    expect(phrases).not.toContain('heading, Notification settings, level 1');
  });

  it('names the matrix in the failure message', async () => {
    render(settingsPanel({ break: 'pressedOnToggleOnly' }));

    await expect(expectAnnouncement(document.body, EXPECTED_ANNOUNCEMENT)).rejects.toThrow(
      /matrix: virtual/,
    );
  });

  it('fails for every break, so passing means something', async () => {
    for (const broken of [
      'missingGroupName',
      'pressedOnToggleOnly',
      'labelInsteadOfName',
    ] as const) {
      render(settingsPanel({ break: broken }));

      await expect(expectAnnouncement(document.body, EXPECTED_ANNOUNCEMENT)).rejects.toThrow(
        /Announcement mismatch/,
      );
    }
  });
});
