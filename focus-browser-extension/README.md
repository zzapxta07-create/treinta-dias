# Focus Browser Extension

A Chrome extension that replaces the new tab page with a friction-first terminal. Every navigation requires typing a command and writing a 50-word intention essay. Distractor sites are blocked until the ritual is complete.

## Features

- **Terminal interface** — navigate by typing commands, not clicking bookmarks
- **Intention gate** — 50-word minimum essay before any site opens (paste disabled)
- **10-second loading screen** — enforced pause with random reflection phrases
- **Distractor blocking** — YouTube, Reddit, Twitter/X, Instagram, TikTok, Facebook, Netflix redirect to a blocked page until you go through the full flow
- **Per-site daily time limits** — cap any site to N minutes/day (`limit youtube.com 30`); once you hit it, the site is blocked for the rest of the day, no bypass through the terminal flow
- **Custom commands** — save your own `name → URL` shortcuts with `save-command`
- **Focus timer** — `focus 25` starts a countdown displayed in the header
- **History & stats** — track every navigation, distractor count, cancellations
- **Bilingual** — `lang es` / `lang en` switches the interface language

## Commands

| Command | Description |
|---|---|
| `help` | Short command list |
| `manual` | Full usage guide |
| `open <name>` | Open a saved command |
| `visit <url>` | Open any URL |
| `save-command <name> <url>` | Save a new shortcut |
| `remove-command <name>` | Remove a custom shortcut |
| `commands` | List all commands |
| `history` | Show recent navigation history |
| `stats` | Show usage statistics |
| `limit <site> <minutes>` | Set a daily usage limit for a site (1–1440 min) |
| `remove-limit <site>` | Remove a site's daily limit |
| `limits` | List configured limits and today's usage |
| `focus <minutes>` | Start a focus timer (1–120 min) |
| `stop-focus` | Cancel the focus timer |
| `lang es\|en` | Change interface language |
| `clear` | Clear the terminal output |

## Built-in commands

`google`, `youtube`, `github`, `chatgpt`, `docs`, `notion`, `calendar`, `gmail`

## Install (development)

```bash
cd focus-browser-extension
npm install
npm run build
```

1. Open Chrome → `chrome://extensions`
2. Enable **Developer mode**
3. Click **Load unpacked** → select the `dist/` folder

## Privacy

- No data leaves your device. All storage is `chrome.storage.local`.
- No analytics, no remote code, no eval, no password capture, no page content access.
- Distractor blocking uses `declarativeNetRequest` (no request interception).
- Uninstall via Chrome's extension manager — all data is deleted with the extension.

## Tech stack

React 18 · Vite 5 · Manifest V3 · `chrome.storage.local` · `declarativeNetRequest`
