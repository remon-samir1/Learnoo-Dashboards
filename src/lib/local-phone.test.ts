import assert from 'node:assert/strict';
import test from 'node:test';

import { isValidLocalPhone, normalizeLocalPhone } from './local-phone.ts';

test('accepts Egyptian local numbers and rejects country-prefixed entries', () => {
  assert.equal(isValidLocalPhone('EG', '01234567890'), true);
  assert.equal(isValidLocalPhone('EG', '0201234567890'), false);
  assert.equal(normalizeLocalPhone('01234567890'), '1234567890');
});
