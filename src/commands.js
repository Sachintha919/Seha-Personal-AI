import { config } from './config.js';
import { createProfile } from './profile.js';
import {
  getQuotedMessage,
  makeSticker,
  makeMp3,
  makeMp4
} from './media.js';

// The same direct ImgBB image URL used in the README.
const SEHA_AVATAR_URL = 'https://i.ibb.co/SDq9xcq1/seha-avatar.png';

const HELP = `🌸 *Seha Personal AI — Commands*

1. *.list* — show this command list
2. *.sticker* — reply to an image to make a sticker
3. *.mp3* — reply to audio/video to convert to MP3
4. *.mp4* — reply to a video to convert to MP4
5. *.forgetme* — delete your saved profile

*Owner only*
.owner private on/off
.owner groups on/off
.owner onlyme on/off
.owner welcome on/off
.owner language sinhala/english/auto
.owner status

No chat history is stored. Only a small profile is saved.`;

function enabledWord(value) {
  if (value === 'on') return true;
  if (value === 'off') return false;
  return null;
}

export function isOwnerJid(jid = '') {
  const number = String(jid)
    .split('@')[0]
    .split(':')[0]
    .replace(/\D/g, '');

  return Boolean(config.ownerNumber && number === config.ownerNumber);
}

export function isCommand(text = '') {
  return /^\.[a-z]/i.test(String(text).trim());
}

export async function handleCommand({
  sock,
  message,
  text,
  jid,
  senderJid,
  db
}) {
  const [command, ...args] = String(text).trim().split(/\s+/);
  const cmd = command.toLowerCase();
  const owner = isOwnerJid(senderJid);
  const reply = (value) =>
    sock.sendMessage(jid, { text: value }, { quoted: message });

  // Send Seha's avatar and command list together.
  if (cmd === '.list' || cmd === '.help') {
    try {
      await sock.sendMessage(
        jid,
        {
          image: { url: SEHA_AVATAR_URL },
          caption: HELP
        },
        { quoted: message }
      );
    } catch (error) {
      console.error('[Commands] Could not send Seha avatar:', error.message);
      await reply(HELP);
    }

    return true;
  }

  // Delete this sender's saved profile.
  if (cmd === '.forgetme') {
    const existed = Boolean(db.users?.[senderJid]);
    await db.deleteUser(senderJid);

    if (existed) {
      await reply(
        'ඔයාගේ saved profile එක delete කිරීම process කළා. 🌸'
      );
    } else {
      await reply('ඔයා වෙනුවෙන් save කරපු profile එකක් දැනට නැහැ. 🌸');
    }

    return true;
  }

  // Create a sticker from a replied image.
  if (cmd === '.sticker') {
    const quoted = getQuotedMessage(message, jid);

    try {
      const sticker = await makeSticker(sock, quoted);
      await sock.sendMessage(jid, { sticker }, { quoted: message });
    } catch (error) {
      await reply(`🌸 ${error.message}`);
    }

    return true;
  }

  // Convert replied audio/video into MP3.
  if (cmd === '.mp3') {
    const quoted = getQuotedMessage(message, jid);

    try {
      const audio = await makeMp3(
        sock,
        quoted,
        db.settings.maxMediaMb || config.maxMediaMb
      );

      await sock.sendMessage(
        jid,
        {
          audio,
          mimetype: 'audio/mpeg',
          fileName: 'Seha-Audio.mp3',
          ptt: false
        },
        { quoted: message }
      );
    } catch (error) {
      await reply(`🎵 ${error.message}`);
    }

    return true;
  }

  // Convert a replied video into MP4.
  if (cmd === '.mp4') {
    const quoted = getQuotedMessage(message, jid);

    try {
      const video = await makeMp4(
        sock,
        quoted,
        db.settings.maxMediaMb || config.maxMediaMb
      );

      await sock.sendMessage(
        jid,
        {
          video,
          mimetype: 'video/mp4',
          fileName: 'Seha-Video.mp4',
          caption: '🎬 MP4 ready!'
        },
        { quoted: message }
      );
    } catch (error) {
      await reply(`🎬 ${error.message}`);
    }

    return true;
  }

  // Owner-only settings.
  if (cmd === '.owner') {
    if (!owner) {
      await reply('මේ command එක owner ට විතරයි.');
      return true;
    }

    const [key, rawValue] = args;
    const value = String(rawValue || '').toLowerCase();
    const bool = enabledWord(value);

    const switches = {
      private: 'privateEnabled',
      groups: 'groupsEnabled',
      onlyme: 'onlyMe',
      welcome: 'welcomeEnabled'
    };

    if (key?.toLowerCase() === 'status') {
      const settings = db.settings;

      await reply(
        `🌸 *Seha settings*\n` +
        `Private chats: ${settings.privateEnabled ? 'ON' : 'OFF'}\n` +
        `Group chats: ${settings.groupsEnabled ? 'ON' : 'OFF'}\n` +
        `Owner only: ${settings.onlyMe ? 'ON' : 'OFF'}\n` +
        `Welcome: ${settings.welcomeEnabled ? 'ON' : 'OFF'}\n` +
        `Language: ${settings.language}`
      );

      return true;
    }

    if (
      key?.toLowerCase() === 'language' &&
      ['sinhala', 'english', 'auto'].includes(value)
    ) {
      await db.setSettings({ language: value });
      await reply(
        `🌐 Language changed to *${value}*. මේක සියලුම chats වලට බලපානවා.`
      );
      return true;
    }

    const settingKey = switches[String(key || '').toLowerCase()];
    if (settingKey && bool !== null) {
      await db.setSettings({ [settingKey]: bool });
      await reply(`✅ ${key} is now *${value.toUpperCase()}*.`);
      return true;
    }

    await reply(
      'Usage:\n' +
      '.owner private on/off\n' +
      '.owner groups on/off\n' +
      '.owner onlyme on/off\n' +
      '.owner welcome on/off\n' +
      '.owner language sinhala/english/auto\n' +
      '.owner status'
    );

    return true;
  }

  // Any other dot-command is unknown.
  await reply('ඒ command එක මට හඳුනාගන්න බැහැ. Commands list එක බලන්න *.list* යවන්න. 🌸');
  return true;
}

export function getInitialProfile(senderJid, displayName) {
  return createProfile({ id: senderJid, displayName });
}
