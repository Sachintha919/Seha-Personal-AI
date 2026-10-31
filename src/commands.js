import fs from 'node:fs/promises';
import path from 'node:path';
import { config } from './config.js';
import { createProfile } from './profile.js';
import { getQuotedMessage, makeSticker, makeMp3, makeMp4 } from './media.js';

const HELP = `🌸 *Seha Personal AI — Commands*\n\n1. *.list* — show this command list\n2. *.sticker* — reply to an image to make a sticker\n3. *.mp3* — reply to audio/video to convert to MP3\n4. *.mp4* — reply to a video to convert to MP4\n5. *.forgetme* — delete your saved profile\n\n*Owner only*\n.owner private on/off\n.owner groups on/off\n.owner onlyme on/off\n.owner welcome on/off\n.owner language sinhala/english/auto\n.owner status\n\nNo chat history is stored. Only a small profile is saved.`;

function enabledWord(value) { return value === 'on' ? true : value === 'off' ? false : null; }

export function isOwnerJid(jid = '') {
  const number = String(jid).split('@')[0].split(':')[0].replace(/\D/g, '');
  return Boolean(config.ownerNumber && number === config.ownerNumber);
}

export function isCommand(text = '') {
  return /^\.[a-z]/i.test(String(text).trim());
}

export async function handleCommand({ sock, message, text, jid, senderJid, db, profile }) {
  const [command, ...args] = String(text).trim().split(/\s+/);
  const cmd = command.toLowerCase();
  const arg = args.join(' ').toLowerCase();
  const owner = isOwnerJid(senderJid);
  const reply = (value) => sock.sendMessage(jid, { text: value }, { quoted: message });

  if (cmd === '.list' || cmd === '.help') {
    const avatarPath = path.resolve('assets/seha-avatar.png');
    try {
      const image = await fs.readFile(avatarPath);
      await sock.sendMessage(jid, { image, caption: HELP }, { quoted: message });
    } catch {
      await reply(HELP);
    }
    return true;
  }

  if (cmd === '.forgetme') {
    await db.deleteUser(senderJid);
    await reply('ඔයාගේ saved profile එක මකා දැම්මා. ආයෙත් කතා කරනකොට අලුත් profile එකක් පටන් ගන්නම්. 🌸');
    return true;
  }

  if (cmd === '.sticker') {
    const quoted = getQuotedMessage(message, jid);
    try {
      const sticker = await makeSticker(sock, quoted);
      await sock.sendMessage(jid, { sticker }, { quoted: message });
    } catch (error) { await reply(`🌸 ${error.message}`); }
    return true;
  }

  if (cmd === '.mp3') {
    const quoted = getQuotedMessage(message, jid);
    try {
      const audio = await makeMp3(sock, quoted, db.settings.maxMediaMb || config.maxMediaMb);
      await sock.sendMessage(jid, { audio, mimetype: 'audio/mpeg', fileName: 'Seha-Audio.mp3', ptt: false }, { quoted: message });
    } catch (error) { await reply(`🎵 ${error.message}`); }
    return true;
  }

  if (cmd === '.mp4') {
    const quoted = getQuotedMessage(message, jid);
    try {
      const video = await makeMp4(sock, quoted, db.settings.maxMediaMb || config.maxMediaMb);
      await sock.sendMessage(jid, { video, mimetype: 'video/mp4', fileName: 'Seha-Video.mp4', caption: '🎬 MP4 ready!' }, { quoted: message });
    } catch (error) { await reply(`🎬 ${error.message}`); }
    return true;
  }

  if (cmd === '.owner') {
    if (!owner) {
      await reply('මේ command එක owner ට විතරයි.');
      return true;
    }
    const [key, value] = args.map((part) => part.toLowerCase());
    const bool = enabledWord(value);
    const switches = {
      private: 'privateEnabled',
      groups: 'groupsEnabled',
      onlyme: 'onlyMe',
      welcome: 'welcomeEnabled'
    };

    if (key === 'status') {
      const s = db.settings;
      await reply(`🌸 *Seha settings*\nPrivate chats: ${s.privateEnabled ? 'ON' : 'OFF'}\nGroup chats: ${s.groupsEnabled ? 'ON' : 'OFF'}\nOwner only: ${s.onlyMe ? 'ON' : 'OFF'}\nWelcome: ${s.welcomeEnabled ? 'ON' : 'OFF'}\nLanguage: ${s.language}`);
      return true;
    }
    if (key === 'language' && ['sinhala', 'english', 'auto'].includes(value)) {
      await db.setSettings({ language: value });
      await reply(`🌐 Language changed to *${value}*. මේක සියලුම chats වලට බලපානවා.`);
      return true;
    }
    if (switches[key] && bool !== null) {
      await db.setSettings({ [switches[key]]: bool });
      await reply(`✅ ${key} is now *${value.toUpperCase()}*.`);
      return true;
    }
    await reply('Usage:\n.owner private on/off\n.owner groups on/off\n.owner onlyme on/off\n.owner welcome on/off\n.owner language sinhala/english/auto\n.owner status');
    return true;
  }

  return false;
}

export function getInitialProfile(senderJid, displayName) {
  return createProfile({ id: senderJid, displayName });
}
