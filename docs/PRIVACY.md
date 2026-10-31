# Data storage and privacy notes

1. **No chat transcript database.** Seha does not store messages or conversation history. The AI provider receives the latest message and a small system prompt/profile context to produce a reply.
2. **GitHub-only profiles and settings.** User profiles and bot settings are read from and written directly to `database/users.json` and `database/settings.json` through the GitHub Contents API. They are held in memory while Seha runs, but are never written to Kaggle files.
3. **No local fallback.** The Kaggle notebook deletes the cloned JSON database files immediately after cloning the repository and before starting Seha. If GitHub is unavailable or the token lacks permission, startup or saving fails; the bot does not save profile/settings data locally.
4. **Profile contents.** A profile may contain WhatsApp sender ID, WhatsApp display name, preferred name, age, location, welcome flag, and timestamps. Only explicit first-person profile statements are parsed for name/age/location. `.forgetme` deletes a sender's profile from GitHub.
5. **Repository visibility.** The current GitHub repository is public. JSON profile/settings files saved to it are therefore publicly viewable. This is the owner's explicitly requested one-time test configuration.
6. **GitHub token.** A fine-grained token with Contents read/write permission is entered only in the Kaggle configuration cell. It is not stored in project source files or committed to GitHub.
7. **WhatsApp session.** Baileys auth files permit account access. They are stored only in the Kaggle working directory, are ignored by Git, and are not synchronized to GitHub.
8. **Notebook.** Keep the Kaggle notebook and outputs containing API keys, owner number, or GitHub token private. Do not commit credentials to this repository.
9. **Unofficial integration.** Baileys is not affiliated with WhatsApp. Account restrictions, re-linking, protocol changes, and message delivery failures are possible.
10. **Media.** Only process media you own or have permission to use. The bot does not fetch media from social platforms.
