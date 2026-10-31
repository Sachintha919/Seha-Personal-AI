const digits = (value = '') => String(value).replace(/\D/g, '');

export const config = {
  ownerNumber: digits(process.env.BOT_OWNER_NUMBER || ''),
  whatsappNumber: digits(process.env.WHATSAPP_NUMBER || process.env.BOT_OWNER_NUMBER || ''),
  ownerName: process.env.OWNER_NAME || 'Owner',
  geminiApiKey: process.env.GEMINI_API_KEY || '',
  groqApiKey: process.env.GROQ_API_KEY || '',
  geminiModel: process.env.GEMINI_MODEL || 'gemini-3.8-flash',
  groqModel: process.env.GROQ_MODEL || 'openai/gpt-oss-20b',
  githubOwner: process.env.GITHUB_OWNER || '',
  githubRepo: process.env.GITHUB_REPO || '',
  githubToken: process.env.GITHUB_TOKEN || '',
  authDir: process.env.AUTH_DIR || 'auth_info',
  maxMediaMb: Math.max(1, Number(process.env.MAX_MEDIA_MB || 15)),
  logLevel: process.env.LOG_LEVEL || 'warn'
};

export function validateConfig() {
  if (!config.ownerNumber) throw new Error('BOT_OWNER_NUMBER is required. Enter it in the Kaggle configuration cell.');
  if (!config.whatsappNumber) throw new Error('WHATSAPP_NUMBER is required for pairing.');
  if (!config.geminiApiKey && !config.groqApiKey) {
    throw new Error('Add at least one API key: GEMINI_API_KEY or GROQ_API_KEY (Kaggle cell).');
  }
  const digits = config.whatsappNumber;
  if (digits.length < 8 || digits.length > 15) {
    throw new Error('WHATSAPP_NUMBER must include the country code and digits only, e.g. 9477XXXXXXX.');
  }
  if (config.githubToken && (!config.githubOwner || !config.githubRepo)) {
    throw new Error('For GitHub database sync, set GITHUB_OWNER and GITHUB_REPO as well as GITHUB_TOKEN.');
  }
}
