# Privacy and security notes

1. **No chat transcript database.** Seha does not store messages or conversation history. The AI provider receives the latest message and a small system prompt/profile context to produce a reply.
2. **Minimal profile.** The JSON database may store WhatsApp sender ID, WhatsApp display name, preferred name, age, location, welcome flag, and timestamps. Only explicit first-person profile statements are parsed for name/age/location.
3. **Deletion.** A user can send `.forgetme` to delete the profile keyed to their WhatsApp sender JID. Owner settings are separate and are not deleted by this command.
4. **GitHub.** Use a private repository and a fine-grained token limited to that repository with Contents read/write permission. Never add the token to source files, Git commits, screenshots, or a public notebook.
5. **WhatsApp session.** Baileys auth files permit account access. They are stored only in the Kaggle working directory, are ignored by Git, and are not synchronized to GitHub. Do not share or download the auth folder.
6. **Notebook safety.** Kaggle notebook cells with entered API keys/tokens are sensitive. Keep the notebook private and do not publish notebook outputs containing credentials.
7. **Unofficial integration.** Baileys is not affiliated with WhatsApp. Account restrictions, re-linking, protocol changes, and message delivery failures are possible. Use a separate test number and avoid unsolicited/bulk messaging.
8. **Media.** Only process media you own or have permission to use. The bot does not fetch media from social platforms.
