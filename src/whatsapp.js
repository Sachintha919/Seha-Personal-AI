import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestWaWebVersion
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { config, maskPhoneNumber } from './config.js';
import { generateReply } from './ai.js';
import { createProfile, extractProfileUpdates } from './profile.js';
import { handleCommand, isCommand, isOwnerJid } from './commands.js';

function unwrap(message = {}) {
  let current = message;
  while (current.ephemeralMessage || current.viewOnceMessage || current.viewOnceMessageV2) {
    current = current.ephemeralMessage?.message || current.viewOnceMessage?.message || current.viewOnceMessageV2?.message || current;
  }
  return current;
}

export function extractText(message) {
  const m = unwrap(message.message || {});
  return String(
    m.conversation
    || m.extendedTextMessage?.text
    || m.imageMessage?.caption
    || m.videoMessage?.caption
    || m.documentMessage?.caption
    || m.buttonsResponseMessage?.selectedButtonId
    || m.listResponseMessage?.singleSelectReply?.selectedRowId
    || ''
  ).trim();
}

export function getSender(message) {
  const key = message?.key || {};
  const jid = key.remoteJid || '';

  // WhatsApp may address a sender by LID. The patched Baileys build exposes
  // the paired phone-number JID from the same stanza when it is available.
  if (jid.endsWith('@g.us')) {
    return key.participantPn || key.participant || message.participant || '';
  }

  return key.senderPn || key.remoteJidAlt || jid;
}

function jidUser(jid = '') {
  return String(jid).split('@')[0].split(':')[0];
}

export function isSelfChatJid(jid = '', me = {}) {
  const user = jidUser(jid);
  if (!user) return false;
  return [me?.id, me?.jid, me?.lid]
    .filter(Boolean)
    .some((identity) => jidUser(identity) === user);
}

export function isOwnerSelfCommand(message, me = {}) {
  return Boolean(
    message?.key?.fromMe
    && isSelfChatJid(message.key.remoteJid || '', me)
    && isCommand(extractText(message))
  );
}

function getDisplayName(message, senderJid) {
  return String(message.pushName || senderJid.split('@')[0] || 'Friend').slice(0, 60);
}

class Deduper {
  constructor(max = 3000) { this.max = max; this.ids = new Map(); }
  has(id) { return this.ids.has(id); }
  add(id) {
    this.ids.set(id, Date.now());
    if (this.ids.size > this.max) this.ids.delete(this.ids.keys().next().value);
  }
}

export async function startWhatsApp(db) {
  const deduper = new Deduper();
  let reconnectTimer = null;
  let stopped = false;
  let waVersion = null;

  const connect = async () => {
    if (stopped) return;
    const { state, saveCreds } = await useMultiFileAuthState(config.authDir);

    // Use the current WhatsApp Web client revision instead of the old
    // revision bundled with legacy Baileys. Reuse it on reconnects.
    if (!waVersion) {
      const versionResult = await fetchLatestWaWebVersion({ timeout: 15000 });
      waVersion = versionResult.version;
      if (versionResult.isLatest) {
        console.log(`[WhatsApp] Using current WhatsApp Web version: ${waVersion.join('.')}`);
      } else {
        console.warn('[WhatsApp] Could not fetch current WhatsApp Web version; using Baileys fallback:', versionResult.error?.message || 'unknown error');
      }
    }

    const sock = makeWASocket({
      auth: state,
      version: waVersion,
      logger: pino({ level: config.logLevel }),
      // Pairing-code mode: do not print/render QR codes in Kaggle.
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      // These optional queries (props, blocklist, privacy settings) can time
      // out on Kaggle and are not required for basic message receive/reply.
      fireInitQueries: false
    });

    let pairingRequested = false;
    let pairingFailed = false;
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      // Baileys emits `qr` as the signal that the socket is ready for pairing.
      // In pairing-code mode we ignore the QR payload and request the 8-digit code.
      if (qr && !state.creds.registered && !pairingRequested) {
        pairingRequested = true;
        console.log(`[Pairing] Requesting code for ${maskPhoneNumber(config.whatsappNumber)}.`);
        try {
          // Give the connection handshake a short moment to become ready.
          await new Promise((resolve) => setTimeout(resolve, 1500));
          const code = await sock.requestPairingCode(config.whatsappNumber);
          console.log('\n==========================================');
          console.log('       SEHA WHATSAPP PAIRING CODE');
          console.log(`                 ${code}`);
          console.log('==========================================');
          console.log('Phone: WhatsApp → Settings → Linked Devices');
          console.log('Choose: Link a Device → Link with phone number instead');
          console.log('Enter the 8-digit code above.\n');
        } catch (error) {
          pairingFailed = true;
          const statusCode = error?.output?.statusCode || error?.statusCode || 'unknown';
          console.error(`[Pairing] Could not request a code (status ${statusCode}):`, error?.message || error);
          console.error('[Pairing] Number sent to Baileys:', maskPhoneNumber(config.whatsappNumber));
          console.error('[Pairing] Check that this is the exact phone number registered to the WhatsApp account you are linking.');
          console.error('[Pairing] Sri Lanka examples accepted by this project: 0771234567, +94 77 123 4567, or 94771234567.');
          console.error('[Pairing] Do not repeatedly retry; restart the Kaggle session after correcting the number.');
        }
      }

      if (connection === 'connecting') console.log('[WhatsApp] Connecting...');
      if (connection === 'open') console.log('✅ Seha connected to WhatsApp.');
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const detail = lastDisconnect?.error?.message || 'No additional detail';
        console.warn(`[WhatsApp] Connection closed (${statusCode || 'unknown'}): ${detail}`);

        if (statusCode === DisconnectReason.loggedOut) {
          stopped = true;
          console.error('[WhatsApp] Session was logged out. Remove the Kaggle auth folder and pair again.');
          return;
        }

        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(
          () => connect().catch((error) => console.error('[WhatsApp] Reconnect failed:', error)),
          5000
        );
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const message of messages || []) {
        try {
          await processIncoming({
            sock,
            message,
            db,
            deduper,
            me: state.creds.me || sock.user
          });
        } catch (error) {
          console.error('[Message handler]', error);
        }
      }
    });
  };

  await connect();
}

async function processIncoming({ sock, message, db, deduper, me }) {
  if (!message?.key) return;
  const jid = message.key.remoteJid || '';
  if (!jid || jid === 'status@broadcast' || jid.endsWith('@broadcast')) return;

  const text = extractText(message);
  const ownerSelfCommand = isOwnerSelfCommand(message, me);
  // Outgoing messages are normally ignored to prevent reply loops. The only
  // exception is an explicit dot-command typed in the linked account's own
  // self-chat, which is a convenient way for the owner to control Seha.
  if (message.key.fromMe && !ownerSelfCommand) return;

  const senderJid = ownerSelfCommand
    ? `${config.ownerNumber}@s.whatsapp.net`
    : getSender(message);
  if (!senderJid) return;
  if (!text) return;

  const messageId = message.key.id;
  if (messageId && deduper.has(messageId)) return;
  if (messageId) deduper.add(messageId);

  const isGroup = jid.endsWith('@g.us');
  const owner = ownerSelfCommand || isOwnerJid(senderJid);
  const settings = db.settings;
  if (settings.onlyMe && !owner) return;

  const ownerCommand = owner && /^\.owner\b/i.test(text);
  if (isGroup && !settings.groupsEnabled && !ownerCommand) return;
  if (!isGroup && !settings.privateEnabled && !ownerCommand && !ownerSelfCommand) return;

  const displayName = ownerSelfCommand ? config.ownerName : getDisplayName(message, senderJid);
  let profile = db.users[senderJid];
  if (ownerSelfCommand) {
    profile = profile || createProfile({ id: senderJid, displayName });
  } else if (!profile) {
    profile = createProfile({ id: senderJid, displayName });
    if (settings.welcomeEnabled) profile.welcomeSent = true;
    await db.setUser(senderJid, profile);
    if (settings.welcomeEnabled) {
      await sock.sendMessage(jid, { text: `ආයුබෝවන් ${profile.name || displayName} 🌸` }, { quoted: message });
    }
  } else {
    const oldWhatsappName = profile.whatsappName;
    let changed = false;
    if (displayName && oldWhatsappName !== displayName) {
      profile = { ...profile, whatsappName: displayName, updatedAt: new Date().toISOString() };
      if (!profile.name || profile.name === oldWhatsappName) profile.name = displayName;
      changed = true;
    }
    if (!profile.welcomeSent && settings.welcomeEnabled) {
      profile = { ...profile, welcomeSent: true, updatedAt: new Date().toISOString() };
      await sock.sendMessage(jid, { text: `ආයුබෝවන් ${profile.name || displayName} 🌸` }, { quoted: message });
      changed = true;
    }
    if (changed) await db.setUser(senderJid, profile);
  }

  if (isCommand(text)) {
    await handleCommand({ sock, message, text, jid, senderJid, db, profile });
    return;
  }

  const updates = extractProfileUpdates(text, profile);
  if (Object.keys(updates).length) {
    profile = { ...profile, ...updates, updatedAt: new Date().toISOString() };
    await db.setUser(senderJid, profile);
  }

  try {
    const answer = await generateReply({
      message: text,
      profile,
      settings,
      ownerName: config.ownerName
    });
    await sock.sendMessage(jid, { text: answer }, { quoted: message });
  } catch (error) {
    console.error('[AI]', error.message);
    const notice = settings.language === 'english'
      ? 'Sorry, I could not reply just now. Please try again in a moment. 🌸'
      : 'අනේ, මේ වෙලාවේ reply එකක් හදාගන්න බැරි වුණා. ටිකකින් ආයෙත් බලමුද? 🌸';
    await sock.sendMessage(jid, { text: notice }, { quoted: message });
  }
}
