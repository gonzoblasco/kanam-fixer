import { describe, expect, it } from 'vitest';

import {
  expectAnnouncement,
  readAnnouncements,
  realDriver,
  realReaderAvailability,
} from '../src/index.js';
import { settingsPanel } from './fixtures/settings-panel.js';

/**
 * The real reader plane (VoiceOver on macOS), slice S3.
 *
 * Running this requires a machine configured for screen reader automation:
 * VoiceOver must allow AppleScript control, and the accessibility permission
 * must be granted to whatever runs the tests. When that is missing this suite
 * SKIPS with the reason, so a missing setup can never be read as a pass.
 */
const availability = await realReaderAvailability();

describe.skipIf(!availability.available)('the real reader plane (VoiceOver)', () => {
  it('is available on this machine', () => {
    expect(availability.available).toBe(true);
  });

  it('reports the reader matrix', () => {
    expect(realDriver.matrix.reader).toBe('voiceover');
    expect(realDriver.matrix.os).toBe('macOS');
  });

  it('announces the panel and can be read back', async () => {
    document.body.innerHTML = settingsPanel();

    const { phrases, matrix } = await readAnnouncements(document.body, { driver: realDriver });

    // The point of S3 is that words come back from the real reader at all.
    // The exact wording is reader-specific and is not asserted here: it is
    // recorded, which is what ADR-0002 requires (the phrase belongs to the
    // declared matrix, not to the component).
    expect(matrix.reader).toBe('voiceover');
    expect(phrases.length).toBeGreaterThan(0);
  });

  it('reports the phrase the reader actually spoke', async () => {
    document.body.innerHTML = settingsPanel();

    const { phrases } = await readAnnouncements(document.body, { driver: realDriver });

    console.log('VOICEOVER_LOG_START');
    for (const phrase of phrases) {
      console.log(JSON.stringify(phrase));
    }
    console.log('VOICEOVER_LOG_END');

    expect(phrases.some((phrase) => phrase.includes('Notification settings'))).toBe(true);
  });
});

describe.skipIf(availability.available)('the real reader plane, when unavailable', () => {
  it('explains why it could not run, instead of passing quietly', () => {
    // This test exists so the skip is visible in the output with its cause.
    expect(availability.reason).not.toBe('');
    console.log(`REAL_READER_UNAVAILABLE: ${availability.reason}`);
  });

  it('still offers the same assertion through the same contract', async () => {
    document.body.innerHTML = settingsPanel();

    // The virtual plane proves the API is shared, not the real reader.
    await expectAnnouncement(document.body, [
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
    ]);
  });
});
