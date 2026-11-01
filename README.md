<div align="center">

<img src="https://capsule-render.vercel.app/api?type=waving&color=25D366&height=200&section=header&text=WhatsApp%20AI%20Bot&fontSize=50&fontColor=ffffff&animation=fadeIn&fontAlignY=38&desc=Created%20by%20Sachintha%20Lakshan&descAlignY=55&descAlign=50" width="100%"/>

<a href="https://imgbb.com/">
  <img src="https://i.ibb.co/SDq9xcq1/seha-avatar.png"
       alt="Seha avatar"
       width="132"
       border="0">
</a>

# 🌸 Seha Personal AI

**A warm, private WhatsApp chat companion — powered by Gemini, with Groq fallback.**

<img src="https://img.shields.io/badge/Platform-Kaggle-20BEFF?style=for-the-badge&logo=kaggle&logoColor=white" alt="Kaggle" />
<img src="https://img.shields.io/badge/Runtime-Node.js_22-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
<img src="https://img.shields.io/badge/AI-Gemini_%2B_Groq-8E75B2?style=for-the-badge" alt="AI" />
<img src="https://img.shields.io/badge/Language-Sinhala_%2F_English-FF69B4?style=for-the-badge" alt="Languages" />

[සිංහල උපදෙස්](README_SI.md) · [Features](#features) · [Kaggle setup](#run-on-kaggle) · [Commands](#commands)

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=20&duration=3000&pause=900&color=F78DB4&center=true&vCenter=true&width=650&lines=Hello%2C+I%27m+Seha+%F0%9F%8C%B8;A+Sinhala+%26+English+WhatsApp+companion;Gemini+primary+%2B+Groq+fallback;Running+on+Kaggle" alt="Animated Seha introduction" />

</div>

---

## What is Seha?

Seha is a personal WhatsApp chat companion with a gentle, friendly character. It supports Sinhala and English, uses Gemini as the primary AI provider, and calls Groq only when Gemini fails. It is designed to run inside a Kaggle notebook. The project builds the Baileys 6.7.24 code line from a pinned community LID/PN decryption-retry commit (`c82d22d22ee01db739b781e1df064f019bff94e5`). The Kaggle installer also pins `libsignal` to the compatible commit from Baileys' own Yarn lockfile (`4d08331a833727c338c1a90041d17b870210dfae`), because npm does not consume that Yarn lockfile while preparing a Git dependency. This is a temporary GitHub-sourced build because the fix has not been merged into the official Baileys release line; review the [fix PR](https://github.com/WhiskeySockets/Baileys/pull/2763) before changing these pins.

> **Important:** This project uses Baileys, an unofficial WhatsApp Web integration. It is not the official WhatsApp Business Platform. Use a separate test number, avoid bulk messaging, and understand that unofficial automation may carry account restrictions or logout risk.

## Features

- **Natural chat:** no stored chat history; each AI request includes only the current message, Seha's persona, language setting, and a few relevant profile facts.
- **Automatic profile notes:** stores a contact's display name by default, and updates name/age/location only when the person explicitly shares first-person details.
- **GitHub-only JSON storage:** profiles and settings are read from and written directly to `database/users.json` and `database/settings.json` in GitHub. They are never persisted to Kaggle files. Writes happen only when a profile or setting changes.
- **Owner controls:** private chats, groups, owner-only mode, welcome message, global reply language, and status.
- **Media tools:** create a static WebP sticker from a replied image; convert replied audio/video to MP3; convert replied video to MP4.
- **Pairing code:** connect by the eight-digit phone-number pairing code instead of scanning a QR.

## Project structure

```text
Seha-Personal-AI/
├── config/persona.js       # Seha's character instructions
├── database/               # GitHub JSON data files; remote-only at runtime
├── docs/                   # Privacy and usage notes
├── kaggle/                 # Ready-to-edit Kaggle notebook
├── src/
│   ├── ai.js               # Gemini primary + Groq fallback
│   ├── commands.js         # User and owner commands
│   ├── config.js            # Reads Kaggle environment variables
│   ├── database.js          # GitHub-only JSON storage; no local fallback
│   ├── main.js              # Application entry point
│   ├── media.js             # Sticker / MP3 / MP4 processing
│   ├── profile.js           # Minimal profile extraction
│   └── whatsapp.js          # Baileys connection and message handler
├── tests/                   # Basic profile tests
├── package.json
├── README.md
└── README_SI.md
```

## Run on Kaggle

### 1. Use your GitHub repository

The Kaggle notebook downloads the application source from the public `Sachintha919/Seha-Personal-AI` repository. The `GITHUB_OWNER` and `GITHUB_REPO` values in the Kaggle configuration cell are separate: they select where Seha stores profile/settings JSON through the GitHub API. The current notebook keeps the existing database at `praveenPro2012/Seha-Personal-AI`; keep those values if you want to continue using the same database. The old Kaggle project folder and its local JSON copies are left untouched.

GitHub storage is mandatory. Create a fine-grained Personal Access Token with access to this repository and **Contents: Read and write** permission. Enter it only in the Kaggle notebook cell; it is not included in this project. This project stores profiles and settings on GitHub even when the repository is public, so those JSON records are publicly viewable.

### 2. Open the included notebook

Open `kaggle/Seha_Kaggle_Setup.ipynb` in Kaggle, then edit the configuration cell. Add your WhatsApp number and API keys. Keep `GITHUB_OWNER=praveenPro2012` and `GITHUB_REPO=Seha-Personal-AI` to preserve the current profile/settings database, unless you intentionally want a different database:

- Owner WhatsApp number (Sri Lankan formats accepted: `0771234567`, `+94 77 123 4567`, `+94 077 123 4567`, or `94771234567`)
- WhatsApp number to link (can be the same number)
- Gemini API key
- Groq API key (optional fallback)
- GitHub owner, repository, and token (for persistent JSON storage)

The project source, README, ZIP, and default JSON files contain **no real keys, phone numbers, tokens, or WhatsApp session credentials**.

### 3. Run the cells in order

The notebook installs Node.js 22 and FFmpeg, clones/updates application source from `Sachintha919/Seha-Personal-AI` into a new Kaggle folder, builds the pinned Baileys LID/PN fix with a narrow own-account LID fallback and compatible `libsignal` revision, installs Seha's packages, and runs syntax checks and tests before starting Seha. Profile/settings continue to be read/written in the separate database repository from the configuration cell. A GitHub token is required in the Kaggle cell for the Contents API to read and write the database; it also allows cloning a private repository. When the eight-digit code appears:

1. Open WhatsApp on the phone number you entered.
2. Go to **Settings → Linked Devices → Link a Device**.
3. Choose **Link with phone number instead**.
4. Enter the code printed in Kaggle.

Do not share the notebook after entering keys. Do not commit the Kaggle notebook with actual keys in it.

### 4. Keep it connected

Kaggle sessions are temporary. When a session ends, start the notebook again. This project deliberately does **not** upload WhatsApp auth credentials to GitHub. If Kaggle storage is reset, you may need to pair again.

## Commands

| Command | What it does |
|---|---|
| `.list` | Sends Seha avatar and the command list |
| `.sticker` | Reply to an image with `.sticker` to make a WebP sticker |
| `.mp3` | Reply to audio/video with `.mp3` to extract MP3 audio |
| `.mp4` | Reply to a video with `.mp4` to convert it to MP4 |
| `.forgetme` | Deletes your saved profile from the JSON database |

### Owner-only commands

| Command | Effect |
|---|---|
| `.owner private on` / `off` | Enable/disable private chats |
| `.owner groups on` / `off` | Enable/disable group chats (OFF by default) |
| `.owner onlyme on` / `off` | Allow only the owner to use Seha |
| `.owner welcome on` / `off` | Enable/disable first-contact welcome |
| `.owner language sinhala` | Set every reply to Sinhala |
| `.owner language english` | Set every reply to English |
| `.owner language auto` | Reply in the language of the latest message |
| `.owner status` | Show current settings |

Owner commands are authenticated using the sender's WhatsApp number, not their display name. `.owner onlyme on` does not block the owner's own commands.

## Privacy and data

- No full chat history is saved or sent to the AI provider.
- A compact profile may contain WhatsApp ID, display name, chosen name, age, and location/from-where if explicitly shared by that contact.
- `.forgetme` deletes the sender's profile.
- **Profiles and settings are GitHub-only.** The application reads and writes `database/users.json` and `database/settings.json` through the GitHub API. It never writes those records to Kaggle files.
- The cloned `database/users.json` and `database/settings.json` files remain in the Kaggle project folder. They are not used for runtime storage: the bot reads and writes profile/settings data through GitHub API only. Data is held in process memory while running.
- When GitHub is unavailable or the token lacks permission, saving fails; the bot does not use local storage.
- The database repository selected by `GITHUB_OWNER` and `GITHUB_REPO` is public in the current setup, so its profile/settings JSON files can be viewed by anyone. This is the requested one-time test setup.
- The WhatsApp pairing session stays under the Kaggle working directory and is excluded by `.gitignore`.

Read [docs/PRIVACY.md](docs/PRIVACY.md) before using it with other people's chats.

## Media command limits

These commands process media that is already sent to the bot or quoted in the current chat. They do not scrape or download from YouTube, TikTok, Instagram, or Facebook. Only convert files you own or have permission to use. Input files are capped at 25 MB; output files are capped by `MAX_MEDIA_MB` (15 MB by default).

## Owner self-chat control

The owner can send dot-commands such as `.list` or `.owner status` in the linked WhatsApp account's own **Message yourself** chat. Only explicit commands are processed in that self-chat; ordinary outgoing messages remain ignored to prevent reply loops. Commands from other chats continue to use the normal incoming-message flow.

## Troubleshooting

- **Node version error:** rerun the notebook's first setup cell; Baileys requires a modern Node.js runtime.
- **Startup `init queries` timeout:** this personal bot disables optional initial props/blocklist/privacy queries and fetches the current WhatsApp Web revision at startup. A remaining 408 on the WebSocket itself still needs a fresh log and network diagnosis.
- **LID / Bad MAC errors:** this build retries with the alternate PN/LID identity from the stanza. For the linked account's own LID, the Kaggle installer also retries with the account's own PN only when the failed LID matches the account's stored LID. Other contacts are not guessed. If errors continue, save the full fresh log for diagnosis.
- **No pairing code / invalid number:** use the exact number registered to the WhatsApp account being linked. Sri Lankan formats `0771234567`, `+94 77 123 4567`, `+94 077 123 4567`, and `94771234567` are normalized automatically. If the account is already registered in the Kaggle auth folder, a new code is not requested. An unregistered WhatsApp number cannot receive a pairing code.
- **Gemini failed:** check your API key and current model availability. Groq is used only if a Groq key is configured and Gemini fails.
- **GitHub storage fails:** confirm owner/repo names and that the token has Contents read/write permission for this repository.
- **Media conversion fails:** check that the notebook installed FFmpeg and that you replied to the correct media type.

## Current project boundary

This is a complete test-project implementation for a single personal instance, not a production-grade multi-user service. Baileys is unofficial and can break when WhatsApp changes its web protocol. For commercial or business-critical use, use the official WhatsApp Business Platform and its approved APIs.

## License

MIT — see [LICENSE](LICENSE).
