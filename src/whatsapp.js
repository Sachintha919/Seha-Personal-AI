import makeWASocket, {
  useMultiFileAuthState,
  DisconnectReason
} from '@whiskeysockets/baileys';
import pino from 'pino';
import { config } from './config.js';
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

function getSender(message) {
  const jid = message.key.remoteJid || '';
  if (jid.endsWith('@g.us')) return message.key.participant || message.participant || '';
  return jid;
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

  const connect = async () => {
    if (stopped) return;
    const { state, saveCreds } = await useMultiFileAuthState(config.authDir);
    const sock = makeWASocket({
      auth: state,
      logger: pino({ level: config.logLevel }),
      printQRInTerminal: false,
      syncFullHistory: false,
      markOnlineOnConnect: false,
      generateHighQualityLinkPreview: false,
      browser: ['Seha Personal AI', 'Chrome', '1.0.0']
    });

    let pairingRequested = false;
    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;
      if (qr && !state.creds.registered && !pairingRequested) {
        pairingRequested = true;
        try {
          const code = await sock.requestPairingCode(config.whatsappNumber);
          console.log('\n==========================================');
          console.log('  SEHA WHATSAPP PAIRING CODE');
          console.log(`  ${code}`);
          console.log('  WhatsApp → Linked Devices → Link with phone number');
          console.log('==========================================\n');
        } catch (error) {
          console.error('[WhatsApp] Could not request pairing code:', error.message);
          pairingRequested = false;
        }
      }
      if (connection === 'open') console.log('✅ Seha connected to WhatsApp.');
      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode;
        console.warn(`[WhatsApp] Connection closed (${statusCode || 'unknown'}).`);
        if (statusCode === DisconnectReason.loggedOut) {
          stopped = true;
          console.error('This WhatsApp session was logged out. Delete the auth folder and pair again.');
          return;
        }
        clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => connect().catch((error) => console.error('[WhatsApp] Reconnect failed:', error)), 5000);
      }
    });

    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;
      for (const message of messages || []) {
        try {
          await processIncoming({ sock, message, db, deduper });
        } catch (error) {
          console.error('[Message handler]', error);
        }
      }
    });
  };

  await connect();
}

async function processIncoming({ sock, message, db, deduper }) {
  if (!message?.key || message.key.fromMe) return;
  const jid = message.key.remoteJid || '';
  if (!jid || jid === 'status@broadcast' || jid.endsWith('@broadcast')) return;
  const senderJid = getSender(message);
  if (!senderJid) return;
  const messageId = message.key.id;
  if (messageId && deduper.has(messageId)) return;
  if (messageId) deduper.add(messageId);

  const isGroup = jid.endsWith('@g.us');
  const owner = isOwnerJid(senderJid);
  const settings = db.settings;
  if (settings.onlyMe && !owner) return;

  const text = extractText(message);
  if (!text) return;
  const ownerCommand = owner && /^\.owner\b/i.test(text);
  if (isGroup && !settings.groupsEnabled && !ownerCommand) return;
  if (!isGroup && !settings.privateEnabled && !ownerCommand) return;

  const displayName = getDisplayName(message, senderJid);
  let profile = db.users[senderJid];
  if (!profile) {
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
