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

<img src="https://readme-typing-svg.herokuapp.com?font=Fira+Code&size=20&duration=3000&pause=900&color=F78DB4&center=true&vCenter=true&width=650&lines=Hello%2C+I%27m+Seha+%F0%9F%8C%B8;Sinhala+%26+English+WhatsApp+companion;Running+on+Kaggle" alt="Animated Seha introduction" />

</div>

# 🌸 Seha Personal AI — සිංහල මාර්ගෝපදේශය

**Kaggle එකෙන් run කරන පුද්ගලික WhatsApp AI chat companion එක.**

</div>

## මේ project එකෙන් මොනවාද වෙන්නේ?

Seha කියන්නේ Sinhala/English දෙකෙන්ම ස්වභාවිකව කතා කරන WhatsApp bot එකක්. Gemini primary AI එක. Gemini එක fail වුණොත් විතරක් Groq fallback එක භාවිතා කරනවා. Chat history එක save කරන්නේ නැහැ. User තමන් ගැන පැහැදිලිව කියන නම/වයස/ප්‍රදේශය වගේ කුඩා profile facts විතරයි save කරන්නේ. Baileys 6.7.24 legacy stable version එක භාවිතා කරනවා. v7 release-candidate එකේ breaking API changes තිබෙන නිසා මේ project එකට එය තෝරාගෙන නැහැ.

**වැදගත්:** Baileys කියන්නේ unofficial WhatsApp Web library එකක්. WhatsApp එකේ official Business API එකක් නෙවෙයි. Separate test number එකක් භාවිතා කරන්න. Spam/bulk messaging කරන්න එපා. Account logout/restriction risk එකක් තියෙන්න පුළුවන්.

## පියවර 1 — ZIP එක download කරලා GitHub එකට දාන්න

1. ඔයාගේ දැනට තියෙන `Sachintha919/Seha-Personal-AI` GitHub repository එක භාවිතා කරන්න.
2. Full project ZIP එක extract කරලා, files/folders repository එකට upload කරලා updates commit කරන්න. ZIP file එකම upload කරන්න එපා.

User profiles සහ settings GitHub එකේම save වෙන නිසා Fine-grained Personal Access Token එකක් අනිවාර්යයි. ඒ token එකට මේ repository එකේ `Contents: Read and write` permission දෙන්න. Token එක Kaggle notebook cell එකට විතරක් දාන්න; source code එකට හෝ GitHub එකට upload කරන්න එපා.

## පියවර 2 — Kaggle notebook එක open කරන්න

Project එකේ `kaggle/Seha_Kaggle_Setup.ipynb` file එක Kaggle notebook එකක් විදිහට open කරන්න. Notebook එකේ CONFIGURATION කියන cell එකේ values වෙනස් කරන්න:

- `OWNER_NUMBER`: bot එකේ owner ගේ WhatsApp number එක. Country code එකත් එක්ක digits පමණක්.
- `WHATSAPP_NUMBER`: WhatsApp එකට link කරන්න ඕන number එක. Owner number එකම නම් ඒකම දාන්න.
- `GEMINI_API_KEY`: Gemini API key එක.
- `GROQ_API_KEY`: fallback key එක. නැත්නම් හිස්ව තබන්න.
- `GITHUB_OWNER`: GitHub username එක.
- `GITHUB_REPO`: repository name එක.
- `GITHUB_TOKEN`: GitHub token එක. මේක අනිවාර්යයි; profile/settings GitHub එකේ save කිරීමට `Contents: Read and write` permission අවශ්‍යයි.

**මේ project ZIP එක තුළ කිසිම සැබෑ API key, phone number, GitHub token හෝ WhatsApp session එකක් නැහැ.** ඔයාගේ values Kaggle notebook cell එකේම දාන්න.

## පියවර 3 — Notebook cells එකින් එක run කරන්න

1. පළමු cell එක Node.js 22 සහ FFmpeg install කරනවා.
2. ඊළඟ cell එක GitHub repo එක download කරනවා.
3. ඊළඟ cell එක npm packages install කරනවා.
4. අවසාන cell එක Seha start කරනවා.

Kaggle output එකේ ඉලක්කම් 8ක pairing code එකක් එනවා. Phone එකේ:

**WhatsApp → Settings → Linked Devices → Link a Device → Link with phone number instead**

ඊට පස්සේ Kaggle එකේ පෙන්වන code එක ඇතුළත් කරන්න.

## Commands

| Command | වැඩේ |
|---|---|
| `.list` | Seha avatar එක සහ command list එක යවනවා |
| `.sticker` | Image එකකට reply කරලා `.sticker` යැව්වොත් sticker එකක් හදනවා |
| `.mp3` | Audio/video එකකට reply කරලා MP3 බවට convert කරනවා |
| `.mp4` | Video එකකට reply කරලා MP4 බවට convert කරනවා |
| `.forgetme` | ඔයාගේ saved profile එක මකනවා |

### Owner විතරක් භාවිතා කරන commands

```text
.owner private on
.owner private off
.owner groups on
.owner groups off
.owner onlyme on
.owner onlyme off
.owner welcome on
.owner welcome off
.owner language sinhala
.owner language english
.owner language auto
.owner status
```

`language` setting එක සියලුම chats වලට බලපානවා. `auto` කියන්නේ අනිත් කෙනා message එක දාපු භාෂාවෙන් reply කරන එක.

## Profile එක save වෙන්නේ කොහොමද?

- පළමු වතාවට message එකක් එව්වම WhatsApp display name එක profile name එක විදිහට ගන්නවා.
- කෙනෙක් තමන්ගේ නම, වයස, හෝ ඉන්න ප්‍රදේශය පැහැදිලිව කිව්වොත් ඒවා update කරනවා.
- වෙනත් කෙනෙක් ගැන කියන තොරතුරු profile එකට දාන්නේ නැහැ.
- Chat messages / history එක save කරන්නේ නැහැ.
- `.forgetme` යැව්වොත් ඔයාගේ profile එක මකනවා.

## GitHub database එක — GitHub පමණයි

මේ project එකේ user profiles සහ bot settings save වෙන්නේ GitHub repository එකේ `database/users.json` සහ `database/settings.json` files දෙකේ පමණයි. Kaggle disk එකට ඒවා write කරන්නේ නැහැ. Kaggle notebook එක GitHub repository එක clone කළාට පස්සේ JSON files දෙක local copy එකේ තිබෙන්න ඉඩ දෙනවා. නමුත් bot එක ඒවා local විදිහට භාවිතා කරන්නේ නැහැ. Data කියවන්නේ සහ update කරන්නේ GitHub API එකෙන් විතරයි.

`GITHUB_OWNER`, `GITHUB_REPO`, `GITHUB_TOKEN` තුනම අනිවාර්යයි. Token එකට මේ repository එකේ `Contents: Read and write` permission දෙන්න. GitHub API එක වැඩ නොකළොත් හෝ permission ප්‍රමාණවත් නැත්නම් local database එකකට fallback වෙන්නේ නැහැ; save එක fail වුණා කියලා පෙන්වනවා.

**සටහන:** දැනට repository එක Public. එහි save කරන profile/settings JSON files වෙනත් අයටත් බලන්න පුළුවන්. මේක ඔයා ඉල්ලූ one-time test setup එකට එහෙම configure කරලා තියෙනවා.

## Kaggle session එක අවසන් වුණොත්?

Kaggle session එක stop/expire වුණොත් notebook එක නැවත run කරන්න වෙනවා. User profiles/settings GitHub එකේ තිබෙන නිසා ඒවා Kaggle reset වුණත් ඉතිරි වෙනවා. WhatsApp pairing session credentials විතරක් Kaggle working storage එකේ තබනවා; ඒවා reset වුණොත් නැවත pairing කරන්න සිදුවිය හැකියි.

## Media ගැන සීමාව

`.sticker`, `.mp3`, `.mp4` commands WhatsApp chat එකට upload කළ හෝ reply කළ media file එක process කරනවා. YouTube, TikTok, Instagram, Facebook වලින් videos scrape/download කරන code එකක් මෙහි නැහැ. ඔයාට අයිතිය හෝ අවසර ඇති files පමණක් convert කරන්න. Input limit 25 MB; output limit default 15 MB.

## දැනගත යුතු සීමාවන්

මේක single personal test project එකක්. Production service එකක් නෙවෙයි. Baileys unofficial නිසා WhatsApp protocol වෙනස් වුණොත් bot එක කැඩෙන්න පුළුවන්. Business-critical/production භාවිතයට official WhatsApp Business Platform භාවිතා කරන්න.
