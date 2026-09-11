import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ACCESS_OPTIONS,
  CONDITIONS,
  URGENCY_OPTIONS,
  validateAssessment,
} from '@fieldready/shared';

const validAssessment = (overrides = {}) => ({
  siteName: 'Farm A',
  address: '1 Madison County Road',
  latitude: 35.8,
  longitude: -82.5,
  condition: 'Good',
  chickenCount: 100,
  access: 'Open',
  urgency: 'Routine',
  ...overrides,
});

test('validation requires core flood-site fields', () => {
  const errors = validateAssessment({ siteName: 'Farm A', condition: 'Good' });
  assert.equal(errors.address, 'Required');
  assert.equal(errors.latitude, 'Required');
  assert.equal(errors.chickenCount, 'Required');
});

test('valid assessment has no validation errors', () => {
  assert.deepEqual(validateAssessment(validAssessment()), {});
});

test('empty site name is required', () => {
  assert.equal(
    validateAssessment(validAssessment({ siteName: '' })).siteName,
    'Required',
  );
});

test('empty address is required', () => {
  assert.equal(
    validateAssessment(validAssessment({ address: '' })).address,
    'Required',
  );
});

test('condition must be a supported value', () => {
  assert.equal(
    validateAssessment(validAssessment({ condition: 'Unknown' })).condition,
    'Invalid condition',
  );
});

test('access must be a supported value', () => {
  assert.equal(
    validateAssessment(validAssessment({ access: 'Unknown' })).access,
    'Invalid access value',
  );
});

test('urgency must be a supported value', () => {
  assert.equal(
    validateAssessment(validAssessment({ urgency: 'Critical' })).urgency,
    'Invalid urgency',
  );
});

test('latitude must be numeric', () => {
  assert.equal(
    validateAssessment(validAssessment({ latitude: 'north' })).latitude,
    'Must be a number',
  );
});

test('longitude must be numeric', () => {
  assert.equal(
    validateAssessment(validAssessment({ longitude: 'west' })).longitude,
    'Must be a number',
  );
});

test('negative chicken count is rejected', () => {
  assert.equal(
    validateAssessment(validAssessment({ chickenCount: -1 })).chickenCount,
    'Cannot be negative',
  );
});

test('zero chickens is accepted', () => {
  assert.equal(
    validateAssessment(validAssessment({ chickenCount: 0 })).chickenCount,
    undefined,
  );
});

test('numeric string coordinates are accepted', () => {
  const errors = validateAssessment(
    validAssessment({ latitude: '35.8', longitude: '-82.5' }),
  );
  assert.equal(errors.latitude, undefined);
  assert.equal(errors.longitude, undefined);
});

test('numeric string chicken count is accepted', () => {
  assert.equal(
    validateAssessment(validAssessment({ chickenCount: '100' })).chickenCount,
    undefined,
  );
});

test('supported option lists remain available to the form', () => {
  assert.deepEqual(CONDITIONS, ['Good', 'Moderate', 'Bad']);
  assert.deepEqual(ACCESS_OPTIONS, ['Open', 'Limited', 'Blocked']);
  assert.deepEqual(URGENCY_OPTIONS, [
    'Routine',
    'Follow-up needed',
    'Immediate response',
  ]);
});

test('optional fields do not become required', () => {
  const errors = validateAssessment(validAssessment());
  assert.equal(errors.notes, undefined);
  assert.equal(errors.photos, undefined);
  assert.equal(errors.structuralDamage, undefined);
  assert.equal(errors.poultryImpact, undefined);
});
