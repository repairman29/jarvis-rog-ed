# Running CLAWDBOT / JARVIS on ROG Ally (Windows)

This guide covers running your JARVIS assistant on an **ASUS ROG Ally** handheld (Windows 11). The main docs assume macOS; this doc fills in the Windows path.

---

## What Works on ROG Ally

| Feature | Supported |
|--------|------------|
| **Discord** | ✅ Yes |
| **Telegram** | ✅ Yes |
| **Cloud LLM** (Together, Groq, OpenAI, Anthropic) | ✅ Yes |
| **Gateway + CLI** | ✅ Yes |
| **Skills** (Spotify, Kroger, etc.) | ✅ Yes (same as macOS) |
| **iMessage** | ❌ No (macOS only) |
| **LaunchAgent / background service** | ❌ Use Windows Task Scheduler or run in terminal |
| **Local Ollama** | ⚠️ Possible but tight (16 GB shared RAM; AMD/Windows support varies) |

**Recommendation:** Use a **cloud LLM** (e.g. Groq free tier or Together AI) on the Ally. No GPU required for that; the Ally just runs the gateway and sends API requests.

---

## Prerequisites

- **ROG Ally** (or any Windows 11 PC)
- **Node.js 18+** — [nodejs.org](https://nodejs.org) (LTS)
- **An LLM API key** — Pick one:
  - [Groq](https://console.groq.com) — free tier, very fast
  - [Together AI](https://together.ai) — cheap, good quality
  - [OpenAI](https://platform.openai.com) or [Anthropic](https://console.anthropic.com)

---

## Quick Setup

### 1. Install Node.js

Download and install Node.js 18+ from [nodejs.org](https://nodejs.org). Restart the terminal (or the Ally) after install.

Verify:

```powershell
node --version   # v18.x or higher
npm --version
```

### 2. Install CLAWDBOT CLI

```powershell
npm install -g clawdbot
clawdbot --version
```

### 3. Initialize workspace

```powershell
mkdir $env:USERPROFILE\jarvis
cd $env:USERPROFILE\jarvis
clawdbot init
```

This creates config under `%USERPROFILE%\.clawdbot\` and workspace under `%USERPROFILE%\jarvis\`.

### 4. Add API key and gateway token

Edit (or create) `%USERPROFILE%\.clawdbot\.env`:

```env
# Required: gateway auth (generate with: openssl rand -hex 32)
CLAWDBOT_GATEWAY_TOKEN=your_gateway_token_here

# LLM — pick one
GROQ_API_KEY=your_groq_key
# TOGETHER_API_KEY=your_together_key
# OPENAI_API_KEY=your_openai_key
```

If you don’t have `openssl` on Windows, use PowerShell to generate a token:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }) -as [byte[]]) -replace '\+','-' -replace '/','_' -replace '=',''
```

Or use any 32+ character random string.

### 5. Configure model (optional)

Edit `%USERPROFILE%\.clawdbot\clawdbot.json` and set your model, e.g.:

```json
{
  "agents": {
    "defaults": {
      "model": "groq/llama-3.3-70b-versatile"
    }
  }
}
```

### 6. Run the gateway

```powershell
clawdbot gateway run
```

Leave this running. In another terminal (or on another device on the same network):

```powershell
clawdbot chat "Hello JARVIS, introduce yourself"
```

If you get a response, you’re good.

### 7. Add Discord (optional)

1. Create a bot at [Discord Developer Portal](https://discord.com/developers/applications).
2. Enable **Message Content Intent**.
3. Add the bot token to `%USERPROFILE%\.clawdbot\.env`:

   ```env
   DISCORD_BOT_TOKEN=your_discord_bot_token
   ```

4. Invite the bot to your server and pair (see [DISCORD_SETUP.md](./DISCORD_SETUP.md)).

---

## Running in the background (Windows)

The main docs use macOS LaunchAgent. On Windows you can:

- **Option A:** Run `clawdbot gateway run` in a terminal and leave it open (or use a tool like `pm2`).
- **Option B:** Create a scheduled task that runs at logon and starts the gateway (e.g. run a `.bat` or `node` script that starts the gateway).

Example batch file `start-jarvis.bat`:

```batch
@echo off
cd /d %USERPROFILE%\jarvis
npx clawdbot gateway run
pause
```

Run this from Startup folder or Task Scheduler if you want JARVIS to start with Windows.

---

## Local Ollama on ROG Ally (optional)

The ROG Ally has **16 GB unified memory** (shared between CPU and GPU) and an **AMD RDNA 3** integrated GPU. Running Ollama locally is possible but constrained:

- Use **small models** (e.g. 7B or smaller) to avoid OOM.
- Ollama’s AMD GPU support on Windows varies; check [Ollama docs](https://ollama.com) for current support.
- Prefer **cloud LLM** on the Ally for reliability; use Ollama for experiments or when offline.

If you do use Ollama on Windows:

1. Install [Ollama for Windows](https://ollama.com).
2. Pull a small model: `ollama pull llama3.2:3b` (or similar).
3. In `clawdbot.json`, set model to `ollama/llama3.2:3b` (or whatever you pulled).
4. Ensure no other heavy apps are using most of the 16 GB RAM.

---

## Paths on Windows

| What | Path |
|------|------|
| Config | `%USERPROFILE%\.clawdbot\clawdbot.json` |
| Secrets | `%USERPROFILE%\.clawdbot\.env` |
| Workspace | `%USERPROFILE%\jarvis\` |
| Logs | `%USERPROFILE%\.clawdbot\logs\` |

---

## Troubleshooting

- **“clawdbot not found”** — Ensure Node.js and npm are in your PATH; try `npm install -g clawdbot` again and restart the terminal.
- **Gateway won’t start** — Check that `CLAWDBOT_GATEWAY_TOKEN` is set in `.env` and that the port (e.g. 3033) isn’t in use.
- **No reply from bot** — Verify your LLM API key in `.env` and that the model name in `clawdbot.json` matches your provider (e.g. `groq/llama-3.3-70b-versatile`).
- **Discord bot online but not replying** — Enable Message Content Intent in the Discord Developer Portal and confirm pairing (see [DISCORD_SETUP.md](./DISCORD_SETUP.md)).

For more detail on config, skills, and personality, see [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md).
