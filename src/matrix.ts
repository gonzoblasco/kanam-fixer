import { createRequire } from 'node:module';

/**
 * The reader matrix, as required by ADR-0002.
 *
 * What a screen reader announces is not universal: the phrase varies by
 * reader, by reader version and by operating system. An assertion without a
 * declared matrix is not valid, so the matrix travels with the result.
 */
export interface ReaderMatrix {
  /** Reader identifier, e.g. `virtual`, `voiceover`, `nvda`. */
  reader: string;
  /** Reader version the assertion is valid against. */
  version: string;
  /** Operating system the assertion is valid against. */
  os: string;
}

const require = createRequire(import.meta.url);

function readVersion(pkg: string): string {
  try {
    return (require(`${pkg}/package.json`) as { version: string }).version;
  } catch {
    return 'unknown';
  }
}

/**
 * Matrix of the virtual driver, the plane that runs in CI.
 *
 * Its version is read from the installed package instead of being written by
 * hand, so the declared matrix cannot drift from what actually runs.
 */
export const VIRTUAL_MATRIX: ReaderMatrix = {
  reader: 'virtual',
  version: readVersion('@guidepup/virtual-screen-reader'),
  os: 'any (jsdom)',
};

/** Human readable form, used in failure messages. */
export function describeMatrix(matrix: ReaderMatrix): string {
  return `${matrix.reader} ${matrix.version} on ${matrix.os}`;
}
