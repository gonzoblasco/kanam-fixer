/**
 * kanam-fixer
 *
 * Assert what a screen reader announces, not the attributes.
 *
 * Slice S3: the same assertion on the real reader plane (VoiceOver on macOS),
 * behind the same contract as the virtual plane.
 */

export {
  type Announcement,
  type AnnouncementOptions,
  expectAnnouncement,
  readAnnouncements,
} from './expect-announcement.js';
export { describeMatrix, type ReaderMatrix, VIRTUAL_MATRIX } from './matrix.js';
export { createKanamFixerServer, type KanamFixerServerInfo } from './mcp-server.js';
export {
  END_OF_DOCUMENT,
  type ReaderDriver,
  type RealReaderAvailability,
  realDriver,
  realReaderAvailability,
  virtualDriver,
} from './readers.js';

/** Version of the package, mirrored from package.json. */
export const version = '0.0.2';
