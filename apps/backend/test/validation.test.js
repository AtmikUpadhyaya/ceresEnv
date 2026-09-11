import test from 'node:test';
import assert from 'node:assert/strict';
import { validateAssessment } from '@fieldready/shared';

test('validation requires core flood-site fields', () => {
  const errors = validateAssessment({ siteName: 'Farm A', condition: 'Good' });
  assert.equal(errors.address, 'Required');
  assert.equal(errors.latitude, 'Required');
  assert.equal(errors.chickenCount, 'Required');
});
