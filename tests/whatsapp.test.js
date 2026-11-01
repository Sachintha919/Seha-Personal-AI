import test from 'node:test';
import assert from 'node:assert/strict';
import { getSender } from '../src/whatsapp.js';

test('uses the paired phone-number identity for direct LID messages', () => {
  assert.equal(
    getSender({
      key: {
        remoteJid: '189945666920530@lid',
        senderPn: '94771234567@s.whatsapp.net'
      }
    }),
    '94771234567@s.whatsapp.net'
  );
});

test('uses the paired phone-number identity for group LID participants', () => {
  assert.equal(
    getSender({
      key: {
        remoteJid: '120363000000000000@g.us',
        participant: '189945666920530@lid',
        participantPn: '94771234567@s.whatsapp.net'
      }
    }),
    '94771234567@s.whatsapp.net'
  );
});

test('falls back to the original direct JID when no phone-number identity is supplied', () => {
  assert.equal(
    getSender({ key: { remoteJid: '189945666920530@lid' } }),
    '189945666920530@lid'
  );
});

test('falls back to the original group participant when no paired PN is supplied', () => {
  assert.equal(
    getSender({
      key: {
        remoteJid: '120363000000000000@g.us',
        participant: '189945666920530@lid'
      }
    }),
    '189945666920530@lid'
  );
});
