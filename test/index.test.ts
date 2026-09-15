import { describe, expect, it } from 'vitest';

import { version } from '../src/index.js';

describe('kanam-fixer skeleton (S1)', () => {
  it('exposes the package version', () => {
    expect(version).toBe('0.0.1');
  });
});
