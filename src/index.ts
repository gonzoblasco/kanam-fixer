/**
 * kanam-fixer
 *
 * Assert what a screen reader announces, not the attributes.
 *
 * Slice S2: the announcement assertion, running against the virtual screen
 * reader (the CI plane). The real reader plane lands in S3.
 */

export {
  type Announcement,
  type AnnouncementOptions,
  expectAnnouncement,
  readAnnouncements,
} from './expect-announcement.js';
export {
  describeMatrix,
  type ReaderMatrix,
  VIRTUAL_MATRIX,
} from './matrix.js';

/** Version of the package, mirrored from package.json. */
export const version = '0.0.1';
