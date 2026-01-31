# Available Tools / Skills

Tools and skills JARVIS can use. Call the appropriate tool when the user asks; then summarize the result.

---

## Kroger / King Soopers (grocery)

**Skill:** `kroger` (installed). Use for any Kroger/King Soopers product search, prices, shopping lists, or store lookup.

| Tool | When to use |
|------|--------------|
| `kroger_search` | User asks for price or search: "price of milk at Kroger", "search Kroger for eggs" |
| `kroger_stores` | User asks for stores: "Kroger near 80202", "King Soopers stores 80123" |
| `kroger_shop` | User wants a list with prices: "shopping list for tacos", "Kroger shop milk eggs bread". Supports quantities and fulfillment (curbside/delivery). Reply with orderSummary, total, cartUrl, and product links for a flawless handoff. |
| `kroger_cart` | User wants to open cart: "open my Kroger cart", "Kroger cart" |
| `kroger_add_to_cart` | Add items by UPC to user's Kroger cart. Requires `KROGER_REFRESH_TOKEN` (run oauth-helper.js once). |
| `kroger_shop_and_add` | Build list by search terms **and** add those items to user's Kroger cart. Requires `KROGER_REFRESH_TOKEN`. Prefer this when user says "add X to my Kroger cart" or "order X from Kroger". |

**Env:** `KROGER_CLIENT_ID`, `KROGER_CLIENT_SECRET`, `KROGER_LOCATION_ID` (required for prices). For add-to-cart: `KROGER_REFRESH_TOKEN` (one-time OAuth; see `skills/kroger/CART_API.md`).

---

## Launcher / Productivity

**Skill:** `launcher` (installed). Use for app launching, system controls, calculations, screenshots.

| Tool | When to use |
|------|-------------|
| `launch_app` | "launch Chrome", "open VS Code", "new Safari window" |
| `quit_app` | "quit Slack", "close Spotify", "force quit Chrome" |
| `system_control` | "turn up volume", "lock screen", "toggle dark mode" |
| `quick_calc` | "15% of 240", "5 miles to km", "sqrt(144)" |
| `process_manager` | "what's using CPU", "kill Chrome process" |
| `screenshot` | "take screenshot", "screenshot Chrome window" |
| `open_url` | "open github.com", "open reddit in incognito Chrome" |

---

## Window Manager

**Skill:** `window-manager` (installed). Advanced window management and workspace control.

| Tool | When to use |
|------|-------------|
| `snap_window` | "snap Chrome left half", "maximize VS Code", "center window" |
| `move_window` | "move to second monitor", "put on main display" |
| `window_arrangement` | "arrange in two columns", "create 2x2 grid" |
| `workspace_save` | "save my coding workspace", "remember this layout" |
| `workspace_restore` | "restore design workspace", "load coding setup" |

---

## File Search

**Skill:** `file-search` (installed). Intelligent file discovery and content search.

| Tool | When to use |
|------|-------------|
| `search_files` | "find my React project", "search for PDF about taxes" |
| `recent_files` | "what did I work on yesterday?", "show recent images" |
| `file_operations` | "open that file", "copy file path", "preview document" |
| `search_content` | "find files containing API key", "search code for useEffect" |
| `find_duplicates` | "find duplicate photos", "show duplicate downloads" |

---

## Repo Knowledge (Cross-Repo RAG)

**Skill:** `repo-knowledge` (installed). Semantic search and summaries across repairman29 repos.

| Tool | When to use |
|------|--------------|
| `repo_search` | "search all repos for OAuth refresh", "find embedding code in echeo" |
| `repo_summary` | "summarize BEAST-MODE", "what is smuggler?" |
| `repo_file` | "show me file chunks from repo X path Y" |
| `repo_map` | "repo map for JARVIS" |

**Env:** `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (preferred) or `SUPABASE_ANON_KEY`.

---

## Clipboard History

**Skill:** `clipboard-history` (installed). Intelligent clipboard management.

| Tool | When to use |
|------|-------------|
| `search_clipboard` | "find that API key", "search clipboard for URLs" |
| `get_clipboard_history` | "show clipboard history", "recent clipboard items" |
| `paste_clipboard_item` | "paste the second thing I copied", "paste URL to Chrome" |
| `clipboard_operations` | "pin this item", "delete sensitive clipboard data" |

---

## Snippets / Text Expansion

**Skill:** `snippets` (installed). Intelligent text expansion with dynamic templates.

| Tool | When to use |
|------|-------------|
| `create_snippet` | "create email signature snippet", "make meeting template" |
| `expand_snippet` | "expand my signature", "use meeting template" |
| `search_snippets` | "find email snippets", "show code templates" |
| `snippet_analytics` | "what snippets do I use most?", "optimize my snippets" |

---

## Calculator / Mathematical Computing

**Skill:** `calculator` (installed). Advanced mathematics with units, currency, programming.

| Tool | When to use |
|------|-------------|
| `calculate` | "calculate 15% of 240", "sqrt(144)", "sin(45 degrees)" |
| `convert_units` | "convert 5 miles to km", "100 fahrenheit to celsius" |
| `convert_currency` | "convert 100 USD to EUR", "exchange rate GBP to JPY" |
| `programming_calc` | "convert FF hex to binary", "bitwise AND 1010 and 1100" |
| `financial_calc` | "compound interest 1000 at 5% for 10 years" |
| `statistics_calc` | "mean and standard deviation of [1,2,3,4,5]" |

---

## Workflow Automation / AI Orchestration

**Skill:** `workflow-automation` (installed). AI-powered workflow creation and command chaining.

| Tool | When to use |
|------|-------------|
| `create_workflow` | "create morning routine workflow", "automate project setup" |
| `execute_workflow` | "run my morning routine", "execute project setup workflow" |
| `chain_commands` | "find React files, open in VS Code, snap left" |
| `workflow_templates` | "show productivity templates", "install focus mode template" |
| `ai_suggestions` | "suggest workflows for my routine", "optimize my workflow" |
| `learn_patterns` | "analyze my usage", "suggest automation opportunities" |

---

## Voice Control

**Skill:** `voice-control` (installed). Hands-free operation with wake word detection.

| Tool | When to use |
|------|-------------|
| `start_voice_recognition` | "start listening", "enable voice control" |
| `voice_command` | "Hey JARVIS, launch Chrome", "JARVIS, what time is it?" |
| `voice_shortcuts` | "create voice shortcut", "focus time runs focus mode" |
| `voice_training` | "train my wake word", "improve voice recognition" |

---

## Performance Monitor

**Skill:** `performance-monitor` (installed). System health monitoring and optimization.

| Tool | When to use |
|------|-------------|
| `system_health` | "check system health", "JARVIS performance report" |
| `optimize_performance` | "optimize JARVIS", "clean up and speed up system" |
| `performance_benchmark` | "benchmark JARVIS performance", "test system speed" |
| `monitor_realtime` | "start performance monitoring", "alert on high CPU usage" |

---

## Skill Marketplace

**Skill:** `skill-marketplace` (installed). Community skill ecosystem and management.

| Tool | When to use |
|------|-------------|
| `discover_skills` | "find productivity skills", "search for Spotify integration" |
| `install_skill` | "install the GitHub skill", "add weather skill" |
| `manage_skills` | "list my skills", "update all skills", "disable music skill" |
| `skill_analytics` | "what skills are trending?", "skill recommendations" |

---

## GitHub (PAT — Repos, Issues, PRs, Workers)

**Skill:** `github` (installed). Connect with GITHUB_TOKEN to list repos, manage issues/PRs, and trigger workflow_dispatch (workers/subagents).

**Env:** `GITHUB_TOKEN` in `~/.clawdbot/.env` or `%USERPROFILE%\.clawdbot\.env` (do not commit).

| Tool | When to use |
|------|--------------|
| `github_status` | "Is GitHub connected?", "check GitHub token" |
| `github_repos` | "list my repos", "repos for org X" |
| `github_issues` | "create issue in owner/repo", "comment on issue #5", "list open issues" |
| `github_pulls` | "list open PRs", "create PR from branch X", "get PR #3" |
| `github_workflow_dispatch` | "trigger deploy workflow", "run the worker on main", drive workers/subagents |
| `github_branches` | "branches in owner/repo" |
| `github_workflows` | "what workflows exist in this repo?" (to find workflow_id for dispatch) |

---

## Repairman29 Repo Automation (CLI / Scripts)

Use these **repo scripts** for operations, deployment, and background work. Prefer these over ad‑hoc commands when the task matches.

| Command / Script | When to use |
|------|-------------|
| `node scripts/jarvis-admin.js` | Full deployment, repo configuration, releases, community setup, health checks. |
| `node scripts/manage-website.js` | GitHub Pages status, build health, site metrics, content refresh. |
| `node scripts/optimize-jarvis.js` | Performance cleanup, cache cleanup, workflow optimization. |
| `node scripts/setup-wizard.js` | Guided setup for new machines or clean installs. |
| `bash scripts/deploy-jarvis.sh` | End‑to‑end deploy to GitHub + Pages (Linux/macOS). |
| `powershell -ExecutionPolicy Bypass -File scripts\\test-3-questions.ps1` | Quick CLI sanity check (agent responsiveness). |
| `powershell -ExecutionPolicy Bypass -File scripts\\test-pm-beast-mode.ps1` | JARVIS as PM for Beast-Mode (3 prompts: mission, PRD outline, next action). See scripts/PM_BEAST_MODE_CLI.md. |
| `npx clawdbot agent --session-id "beast-mode-pm" --message \"...\" --local` | Run JARVIS as product manager for Beast-Mode; use same session for context. |
| `npx clawdbot gateway run` | Run gateway locally for interactive ops. |
| `npx clawdbot agent --session-id <id> --message \"...\" --local` | Run a single agent turn in CLI. |
| `npx clawdbot message send --channel discord --target user:<id> --message \"...\"` | Send a message to Discord via CLI (delivery check). |
