# Free-tier fallbacks (OpenRouter + Together)

When **Groq** hits context overflow or rate limit (429), JARVIS can use **OpenRouter** (free models, ~50 req/day) and **Together** (free Llama 3.3 70B) as fallbacks.

## 1. Get API keys (free)

- **OpenRouter:** https://openrouter.ai/keys → sign up, copy key  
- **Together:** https://api.together.xyz/settings/api-keys → sign up, create key  

## 2. Add keys to .env

Edit **`%USERPROFILE%\.clawdbot\.env`** and set (no quotes):

```env
OPENROUTER_API_KEY=sk-or-v1-xxxx
TOGETHER_API_KEY=xxxx
```

## 3. Add providers to clawdbot.json

In **`%USERPROFILE%\.clawdbot\clawdbot.json`**:

**A) Under `models.providers`**, add these two blocks **before** the closing `}` of `providers` (after `ollama`):

```json
"openrouter": {
  "baseUrl": "https://openrouter.ai/api/v1",
  "apiKey": "${OPENROUTER_API_KEY}",
  "api": "openai-completions",
  "models": [
    {
"id": "arcee-ai/trinity-mini:free",
  "name": "Arcee Trinity Mini (free)",
      "reasoning": false,
      "input": ["text"],
      "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
      "contextWindow": 131072,
      "maxTokens": 8192
    }
  ]
},
"together": {
  "baseUrl": "https://api.together.xyz/v1",
  "apiKey": "${TOGETHER_API_KEY}",
  "api": "openai-completions",
  "models": [
    {
      "id": "meta-llama/Llama-3.3-70B-Instruct-Turbo",
      "name": "Llama 3.3 70B Turbo (Together)",
      "reasoning": false,
      "input": ["text"],
      "cost": { "input": 0, "output": 0, "cacheRead": 0, "cacheWrite": 0 },
      "contextWindow": 131072,
      "maxTokens": 8192
    }
  ]
}
```

**B) Under `agents.defaults.model.fallbacks`**, add (after `groq/llama-3.3-70b-versatile`):

```json
"openrouter/arcee-ai/trinity-mini:free",
"together/meta-llama/Llama-3.3-70B-Instruct-Turbo"
```

## 4. Restart the gateway

Stop the gateway (close its window or `npx clawdbot gateway stop`), then start again: `npx clawdbot gateway run` from the JARVIS repo.

After that, when Groq fails (context overflow or 429), JARVIS will try OpenRouter then Together automatically.
