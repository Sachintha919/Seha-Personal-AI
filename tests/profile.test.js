import test from 'node:test';
import assert from 'node:assert/strict';
import { createProfile, extractProfileUpdates } from '../src/profile.js';

test('creates a profile using the WhatsApp display name', () => {
  const profile = createProfile({ id: '94770000000@s.whatsapp.net', displayName: 'Nimal' });
  assert.equal(profile.name, 'Nimal');
  assert.equal(profile.age, null);
});

test('extracts explicit first-person age and name', () => {
  const profile = createProfile({ id: 'x', displayName: 'Friend' });
  const updates = extractProfileUpdates('My name is Kasun. I am 21 years old.', profile);
  assert.equal(updates.name, 'Kasun');
  assert.equal(updates.age, 21);
});

test('does not overwrite a profile when there are no personal details', () => {
  const profile = createProfile({ id: 'x', displayName: 'Friend' });
  assert.deepEqual(extractProfileUpdates('My brother is 25 years old.', profile), {});
});
