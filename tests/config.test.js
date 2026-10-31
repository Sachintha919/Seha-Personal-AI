import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizePhoneNumber, maskPhoneNumber } from '../src/config.js';

test('normalizes Sri Lankan local format to international format', () => {
  assert.equal(normalizePhoneNumber('077 123 4567'), '94771234567');
});

test('normalizes international format with plus and spaces', () => {
  assert.equal(normalizePhoneNumber('+94 77 123 4567'), '94771234567');
});

test('normalizes international Sri Lankan input that still contains the national zero', () => {
  assert.equal(normalizePhoneNumber('+94 077 123 4567'), '94771234567');
});

test('normalizes the 00 international dialing prefix', () => {
  assert.equal(normalizePhoneNumber('0094 77 123 4567'), '94771234567');
});

test('keeps an already international number unchanged', () => {
  assert.equal(normalizePhoneNumber('94771234567'), '94771234567');
});

test('supports 9 digit Sri Lankan mobile subscriber format', () => {
  assert.equal(normalizePhoneNumber('771234567'), '94771234567');
});

test('masks a phone number in logs', () => {
  assert.equal(maskPhoneNumber('94771234567'), '+94*****4567');
});
