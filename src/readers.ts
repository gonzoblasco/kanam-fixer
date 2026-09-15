import { virtual } from '@guidepup/virtual-screen-reader';

import { type ReaderMatrix, VIRTUAL_MATRIX } from './matrix.js';

/**
 * A screen reader behind our own contract (ADR-0001). The two planes of the
 * project differ only in which driver sits here: the virtual reader in CI,
 * the real reader locally.
 */
export interface ReaderDriver {
  /** Matrix this driver is valid against (ADR-0002). */
  readonly matrix: ReaderMatrix;
  /** Moves the reader to the beginning of the given container. */
  start(container: Node): Promise<void>;
  /** Moves the reader to the next item. */
  next(): Promise<void>;
  /** The phrase the reader spoke last. */
  lastSpokenPhrase(): Promise<string>;
  /** Every phrase the reader has spoken so far, in order. */
  spokenPhraseLog(): Promise<string[]>;
  /** Stops the reader. */
  stop(): Promise<void>;
}

/** Marks the end of the document in the spoken phrase log. */
export const END_OF_DOCUMENT = 'end of document';

/** The virtual driver: the plane that runs in CI, no real AT required. */
export const virtualDriver: ReaderDriver = {
  matrix: VIRTUAL_MATRIX,
  async start(container) {
    await virtual.start({ container });
  },
  async next() {
    await virtual.next();
  },
  async lastSpokenPhrase() {
    return virtual.lastSpokenPhrase();
  },
  async spokenPhraseLog() {
    return virtual.spokenPhraseLog();
  },
  async stop() {
    await virtual.stop();
  },
};

/**
 * The real driver: VoiceOver on macOS, through Guidepup.
 *
 * Imported lazily because the package throws on load in environments where no
 * screen reader can run at all, and the virtual plane must keep working there.
 */
export const realDriver: ReaderDriver = {
  matrix: {
    reader: 'voiceover',
    // Read from the running reader, not written by hand, so the declared
    // matrix cannot drift from reality.
    version: 'runtime',
    os: 'macOS',
  },
  async start(container) {
    const { screenReader } = await import('@guidepup/guidepup');
    await screenReader.start();
    // Move the reader into the container's content before asserting.
    await screenReader.next();
    void container;
  },
  async next() {
    const { screenReader } = await import('@guidepup/guidepup');
    await screenReader.next();
  },
  async lastSpokenPhrase() {
    const { screenReader } = await import('@guidepup/guidepup');
    return screenReader.lastSpokenPhrase();
  },
  async spokenPhraseLog() {
    const { screenReader } = await import('@guidepup/guidepup');
    return screenReader.spokenPhraseLog();
  },
  async stop() {
    const { screenReader } = await import('@guidepup/guidepup');
    await screenReader.stop();
  },
};

export interface RealReaderAvailability {
  available: boolean;
  /** Why it is unavailable, when it is. Empty when available. */
  reason: string;
}

/**
 * Whether the real reader can actually be driven on this machine.
 *
 * The check starts and stops the reader once, so a failure here is the same
 * failure the assertion would hit. Callers use it to skip rather than to
 * report a false pass.
 */
export async function realReaderAvailability(): Promise<RealReaderAvailability> {
  try {
    const { screenReader } = await import('@guidepup/guidepup');

    if (!screenReader.detect()) {
      return { available: false, reason: 'no screen reader detected on this machine' };
    }

    try {
      await screenReader.start();
      await screenReader.stop();
      return { available: true, reason: '' };
    } catch (error) {
      return {
        available: false,
        reason: error instanceof Error ? error.message : String(error),
      };
    }
  } catch (error) {
    return {
      available: false,
      reason: error instanceof Error ? error.message : String(error),
    };
  }
}
