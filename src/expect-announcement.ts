import { virtual } from '@guidepup/virtual-screen-reader';

import { describeMatrix, type ReaderMatrix, VIRTUAL_MATRIX } from './matrix.js';

/**
 * A hard stop for the traversal loop. The virtual reader walks a finite DOM,
 * so reaching this means something is wrong with the walk itself and the test
 * must fail loudly instead of hanging.
 */
const MAX_STEPS = 1000;

/** Marks the end of the document in the spoken phrase log. */
const END_OF_DOCUMENT = 'end of document';

export interface AnnouncementOptions {
  /** Matrix the assertion is valid against. Defaults to the virtual driver. */
  matrix?: ReaderMatrix;
}

export interface Announcement extends AnnouncementOptions {
  /** Every phrase the reader spoke while walking the container, in order. */
  phrases: string[];
  /** Matrix the phrases were observed against. */
  matrix: ReaderMatrix;
}

/**
 * Walks the whole container with a screen reader and returns every phrase it
 * spoke, in order.
 *
 * This is the raw observation. The assertion below builds on it; keeping the
 * two apart means a failing test can show what was actually announced.
 */
export async function readAnnouncements(
  container: Node,
  options: AnnouncementOptions = {},
): Promise<Announcement> {
  const matrix = options.matrix ?? VIRTUAL_MATRIX;

  await virtual.start({ container });
  try {
    for (let step = 0; step < MAX_STEPS; step += 1) {
      if ((await virtual.lastSpokenPhrase()) === END_OF_DOCUMENT) {
        break;
      }
      await virtual.next();
    }
    return { phrases: await virtual.spokenPhraseLog(), matrix };
  } finally {
    await virtual.stop();
  }
}

/**
 * Asserts what a screen reader announces for the given container.
 *
 * `expected` is matched against the ordered phrases, so an assertion states
 * the announcement as a sequence rather than as a bag of strings.
 */
export async function expectAnnouncement(
  container: Node,
  expected: readonly string[],
  options: AnnouncementOptions = {},
): Promise<void> {
  const { phrases, matrix } = await readAnnouncements(container, options);
  const declared = describeMatrix(matrix);

  const same =
    phrases.length === expected.length &&
    phrases.every((phrase, index) => phrase === expected[index]);

  if (same) {
    return;
  }

  throw new Error(
    [
      `Announcement mismatch (matrix: ${declared}).`,
      '',
      'Expected:',
      ...expected.map((phrase) => `  ${JSON.stringify(phrase)}`),
      '',
      'Announced:',
      ...phrases.map((phrase) => `  ${JSON.stringify(phrase)}`),
    ].join('\n'),
  );
}
