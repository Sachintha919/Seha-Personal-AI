import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import sharp from 'sharp';
import pino from 'pino';
import { downloadMediaMessage } from '@whiskeysockets/baileys';

const execFileAsync = promisify(execFile);
const silentLogger = pino({ level: 'silent' });
const MAX_INPUT_BYTES = 25 * 1024 * 1024;

function unwrapMessage(message = {}) {
  let current = message;
  while (current.ephemeralMessage || current.viewOnceMessage || current.viewOnceMessageV2) {
    current = current.ephemeralMessage?.message || current.viewOnceMessage?.message || current.viewOnceMessageV2?.message || current;
  }
  return current;
}

export function getQuotedMessage(message, remoteJid) {
  const content = unwrapMessage(message.message || {});
  const context = content.extendedTextMessage?.contextInfo
    || content.imageMessage?.contextInfo
    || content.videoMessage?.contextInfo
    || content.documentMessage?.contextInfo;
  if (!context?.quotedMessage || !context?.stanzaId) return null;
  return {
    key: {
      remoteJid,
      id: context.stanzaId,
      participant: context.participant,
      fromMe: false
    },
    message: context.quotedMessage
  };
}

export function getMessageMediaType(message) {
  const content = unwrapMessage(message?.message || message || {});
  if (content.imageMessage) return 'image';
  if (content.videoMessage) return 'video';
  if (content.audioMessage) return 'audio';
  if (content.documentMessage) return 'document';
  return null;
}

async function downloadBuffer(sock, message) {
  const buffer = await downloadMediaMessage(message, 'buffer', {}, {
    logger: silentLogger,
    reuploadRequest: sock.updateMediaMessage
  });
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) throw new Error('Could not download the replied media.');
  if (buffer.length > MAX_INPUT_BYTES) throw new Error('Input media is too large. Maximum input size is 25 MB.');
  return buffer;
}

async function tempFolder() {
  return fs.mkdtemp(path.join(os.tmpdir(), 'seha-'));
}

async function convert(inputBuffer, extension, args, maxMb) {
  const dir = await tempFolder();
  const input = path.join(dir, `input.${extension}`);
  const output = path.join(dir, 'output');
  try {
    await fs.writeFile(input, inputBuffer);
    await execFileAsync('ffmpeg', ['-hide_banner', '-loglevel', 'error', '-y', '-i', input, ...args, output], { timeout: 120000, maxBuffer: 8 * 1024 * 1024 });
    const stat = await fs.stat(output);
    if (stat.size > maxMb * 1024 * 1024) throw new Error(`Converted file is larger than ${maxMb} MB. Try a shorter/smaller source.`);
    return await fs.readFile(output);
  } finally {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

export async function makeSticker(sock, quotedMessage) {
  if (getMessageMediaType(quotedMessage) !== 'image') throw new Error('Reply to an image, then send .sticker.');
  const buffer = await downloadBuffer(sock, quotedMessage);
  let quality = 82;
  let output;
  for (let i = 0; i < 4; i += 1) {
    output = await sharp(buffer)
      .rotate()
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .webp({ quality, effort: 5, smartSubsample: true })
      .toBuffer();
    if (output.length <= 100 * 1024) break;
    quality -= 12;
  }
  if (output.length > 100 * 1024) throw new Error('This image is too detailed for a small sticker. Try a simpler image.');
  return output;
}

export async function makeMp3(sock, quotedMessage, maxMb) {
  if (!quotedMessage) throw new Error('Reply to an audio or video file, then send .mp3.');
  const type = getMessageMediaType(quotedMessage);
  if (!['audio', 'video', 'document'].includes(type)) throw new Error('For .mp3, reply to an audio or video file.');
  const buffer = await downloadBuffer(sock, quotedMessage);
  const ext = type === 'audio' ? 'audio' : type === 'video' ? 'mp4' : 'bin';
  return convert(buffer, ext, ['-vn', '-codec:a', 'libmp3lame', '-b:a', '128k', '-map_metadata', '-1', '-f', 'mp3'], maxMb);
}

export async function makeMp4(sock, quotedMessage, maxMb) {
  if (!quotedMessage) throw new Error('Reply to a video file, then send .mp4.');
  if (getMessageMediaType(quotedMessage) !== 'video') throw new Error('For .mp4, reply to a video file.');
  const buffer = await downloadBuffer(sock, quotedMessage);
  return convert(buffer, 'mp4', [
    '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '28',
    '-c:a', 'aac', '-b:a', '96k', '-movflags', '+faststart', '-f', 'mp4'
  ], maxMb);
}
