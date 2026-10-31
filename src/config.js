const onlyDigits = (value = '') => String(value).replace(/\D/g, '');

/**
 * Normalize Sri Lankan local numbers and international E.164-style input
 * for Baileys. Baileys requires country code + digits, without a plus sign.
 * Examples: 0771234567, +94 77 123 4567, 94771234567 -> 94771234567.
 */
export function normalizePhoneNumber(value = '', defaultCountryCode = '94') {
  let digits = onlyDigits(value);
  const countryCode = onlyDigits(defaultCountryCode) || '94';

  if (digits.startsWith('00')) digits = digits.slice(2);

  // Accept +94 0XX XXX XXXX by removing the national trunk zero after +94.
  if (countryCode === '94' && digits.startsWith('940') && digits.length === 12) {
    digits = `94${digits.slice(3)}`;
  }

  // Sri Lanka: national format 0XXXXXXXXX (10 digits) -> 94XXXXXXXXX.
  if (countryCode === '94' && digits.length === 10 && digits.startsWith('0')) {
    digits = `${countryCode}${digits.slice(1)}`;
  }

  // Sri Lanka mobile subscriber number without the national trunk zero.
  if (countryCode === '94' && digits.length === 9 && digits.startsWith('7')) {
    digits = `${countryCode}${digits}`;
  }

  return digits;
}

export function maskPhoneNumber(value = '') {
  const digits = onlyDigits(value);
  if (digits.length < 5) return '[number hidden]';
  return `+${digits.slice(0, Math.min(2, digits.length - 4))}${'*'.repeat(Math.max(3, digits.length - 6))}${digits.slice(-4)}`;
}

const defaultCountryCode = onlyDigits(process.env.DEFAULT_COUNTRY_CODE || '94') || '94';

export const config = {
  defaultCountryCode,
  ownerNumber: normalizePhoneNumber(process.env.BOT_OWNER_NUMBER || '', defaultCountryCode),
  whatsappNumber: normalizePhoneNumber(
    process.env.WHATSAPP_NUMBER || process.env.BOT_OWNER_NUMBER || '',
    defaultCountryCode
  ),
  ownerName: process.env.OWNER_NAME || 'Owner',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  githubOwner: process.env.GITHUB_OWNER || 'Sachintha919',
  githubRepo: process.env.GITHUB_REPO || 'Seha-Personal-AI',
  githubToken: process.env.GITHUB_TOKEN || '',
  authDir: process.env.AUTH_DIR || '/kaggle/working/seha-auth',
  maxMediaMb: Math.max(1, Number(process.env.MAX_MEDIA_MB || 15)),
  logLevel: process.env.LOG_LEVEL || 'warn'
};

function validatePhoneNumber(number, label) {
  if (!number) throw new Error(`${label} is missing. Enter a WhatsApp number in the Kaggle configuration cell.`);
  if (number.length < 8 || number.length > 15) {
    throw new Error(
      `${label} is not a valid international number. Use country code + digits only. ` +
      `For Sri Lanka, you may enter 0771234567 or 94771234567; both normalize to 94771234567.`
    );
  }
  if (number.startsWith('0')) {
    throw new Error(`${label} still starts with 0. Include the country code, e.g. 94771234567.`);
  }
}

export function validateConfig() {
  validatePhoneNumber(config.ownerNumber, 'BOT_OWNER_NUMBER');
  validatePhoneNumber(config.whatsappNumber, 'WHATSAPP_NUMBER');

  if (!config.geminiApiKey && !config.groqApiKey) {
    throw new Error('Add at least one AI API key in the Kaggle configuration cell: GEMINI_API_KEY or GROQ_API_KEY.');
  }

  if (!config.githubOwner || !config.githubRepo || !config.githubToken) {
    throw new Error('GitHub-only profile storage is enabled. Set GITHUB_OWNER, GITHUB_REPO, and GITHUB_TOKEN in the Kaggle configuration cell.');
  }
}
