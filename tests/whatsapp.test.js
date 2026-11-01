import test from 'node:test';
import assert from 'node:assert/strict';
import { getSender, isSelfChatJid, isOwnerSelfCommand } from '../src/whatsapp.js';

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

test('recognizes the linked account self-chat by its LID', () => {
  assert.equal(
    isSelfChatJid('189945666920530@lid', {
      id: '947712340411@s.whatsapp.net',
      lid: '189945666920530@lid'
    }),
    true
  );
});

test('recognizes the linked account self-chat by its phone JID', () => {
  assert.equal(
    isSelfChatJid('947712340411@s.whatsapp.net', {
      id: '947712340411@s.whatsapp.net',
      lid: '189945666920530@lid'
    }),
    true
  );
});

test('does not treat another contact as the self-chat', () => {
  assert.equal(
    isSelfChatJid('947700000000@s.whatsapp.net', {
      id: '947712340411@s.whatsapp.net',
      lid: '189945666920530@lid'
    }),
    false
  );
});

test('allows an explicit command from the linked account self-chat', () => {
  assert.equal(
    isOwnerSelfCommand({
      key: { fromMe: true, remoteJid: '189945666920530@lid' },
      message: { conversation: '.list' }
    }, {
      id: '947712340411@s.whatsapp.net',
      lid: '189945666920530@lid'
    }),
    true
  );
});

test('does not allow normal outgoing messages or commands to other chats', () => {
  assert.equal(
    isOwnerSelfCommand({
      key: { fromMe: true, remoteJid: '947700000000@s.whatsapp.net' },
      message: { conversation: '.list' }
    }, {
      id: '947712340411@s.whatsapp.net',
      lid: '189945666920530@lid'
    }),
    false
  );
  assert.equal(
    isOwnerSelfCommand({
      key: { fromMe: true, remoteJid: '189945666920530@lid' },
      message: { conversation: 'Hello' }
    }, {
      id: '947712340411@s.whatsapp.net',
      lid: '189945666920530@lid'
    }),
    false
  );
});
