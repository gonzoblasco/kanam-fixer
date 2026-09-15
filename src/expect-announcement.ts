import { describeMatrix, type ReaderMatrix } from './matrix.js';
import { END_OF_DOCUMENT, type ReaderDriver, virtualDriver } from './readers.js';

/**
 * A hard stop for the traversal loop. Every reader walks a finite DOM, so
 * reaching this means something is wrong with the walk itself and the test
 * must fail loudly instead of hanging.
 */
const MAX_STEPS = 1000;

export interface AnnouncementOptions {
  /** Driver used to read. Defaults to the virtual driver (the CI plane). */
  driver?: ReaderDriver;
}

export interface Announcement {
  /** Every phrase the reader spoke while walking the container, in order. */
  phrases: string[];
  /** Matrix the phrases were observed against (ADR-0002). */
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
  const driver = options.driver ?? virtualDriver;

  await driver.start(container);
  try {
    for (let step = 0; step < MAX_STEPS; step += 1) {
      if ((await driver.lastSpokenPhrase()) === END_OF_DOCUMENT) {
        break;
      }
      await driver.next();
    }
    return { phrases: await driver.spokenPhraseLog(), matrix: driver.matrix };
  } finally {
    await driver.stop();
  }
}

/**
 * Asserts what a screen reader announces for the given container.
 *
 * `expected` is matched against the ordered phrases, so an assertion states
 * the announcement as a sequence rather than as a bag of strings. The same
 * call runs on either plane: only the driver changes.
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
