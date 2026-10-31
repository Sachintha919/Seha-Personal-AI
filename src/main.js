import { config, validateConfig } from './config.js';
import { JsonDatabase } from './database.js';
import { startWhatsApp } from './whatsapp.js';

async function main() {
  validateConfig();
  const db = await new JsonDatabase({
    owner: config.githubOwner,
    repo: config.githubRepo,
    token: config.githubToken
  }).init();

  console.log(`[DB] GitHub-only profile/settings storage: ${config.githubOwner}/${config.githubRepo}`);
  console.log('[DB] Profile and settings data are never written to Kaggle files.');

  console.log('🌸 Starting Seha Personal AI...');
  console.log(`Gemini: ${config.geminiApiKey ? config.geminiModel : 'not configured'}`);
  console.log(`Groq fallback: ${config.groqApiKey ? config.groqModel : 'not configured'}`);
  await startWhatsApp(db);
}

main().catch((error) => {
  console.error('\n❌ Startup failed:', error.message);
  process.exitCode = 1;
});
