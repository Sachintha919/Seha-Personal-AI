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

  if (!db.remoteEnabled) {
    console.warn('[DB] GitHub sync is OFF. Profiles/settings will be stored only in this Kaggle session.');
  } else {
    console.log(`[DB] GitHub JSON sync enabled: ${config.githubOwner}/${config.githubRepo}`);
  }

  console.log('🌸 Starting Seha Personal AI...');
  console.log(`Gemini: ${config.geminiApiKey ? config.geminiModel : 'not configured'}`);
  console.log(`Groq fallback: ${config.groqApiKey ? config.groqModel : 'not configured'}`);
  await startWhatsApp(db);
}

main().catch((error) => {
  console.error('\n❌ Startup failed:', error.message);
  process.exitCode = 1;
});
