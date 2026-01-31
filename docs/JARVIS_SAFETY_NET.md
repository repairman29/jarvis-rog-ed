## Jarvis Safety Net

### Problem
Jarvis has health checks, monitoring, and admin tools, but they are not unified or automated. Failures can go unnoticed, recovery is manual, and there is no single source of truth for system health.

### User
Repairman29 and operators who need Jarvis to stay up, safe, and reliable across skills, channels, and infrastructure.

### Outcome
A lightweight, automated safety net that detects failures early, aggregates health across components, and performs safe recovery actions with clear alerts.

---

## Product Requirements (PRD)

### Goals
- Reduce mean time to detect (MTTD) and mean time to recover (MTTR).
- Prevent cascading failures with guardrails and circuit breakers.
- Provide a single, reliable health view.

### Non-Goals
- Replace existing skills/scripts; integrate and orchestrate them.
- Full observability stack (Prometheus/Grafana) in MVP.

### Success Metrics
- North Star: % of incidents auto-detected within 2 minutes.
- Supporting KPIs:
  - MTTR under 10 minutes for recoverable failures.
  - Weekly uptime > 99.5% for core gateway/skills.
  - < 1 false positive alert per day.

---

## MVP Scope

### 1) Safety Net Orchestrator
- A single entrypoint that runs checks and aggregates results.
- Pulls from existing tools:
  - `scripts/jarvis-admin.js` (status, monitor)
  - `scripts/optimize-jarvis.js` (system health)
  - `scripts/manage-website.js` (site/community)
  - `skills/performance-monitor` (health metrics, alerts)
  - `skills/github` (API status)
  - `skills/voice-control` (voice status)
  - `scripts/check-discord-bot.js` (Discord auth)

### 2) Watchdog + Recovery
- Lightweight watchdog:
  - Detect stuck/hung processes.
  - Restart gateway or critical services if safe.
  - Enforce retry limits and backoff.
- Safe recovery actions:
  - Clear temp files.
  - Restart specific skill workers.
  - Trigger `clawdbot doctor` and `clawdbot status --deep`.

### 3) Unified Alerts
- Single alert channel (Discord + email optional).
- Severity levels (info, warn, critical).
- Actionable guidance in alerts.

### 4) Health Snapshot + History
- Snapshot JSON emitted to `/tmp` or `.jarvis/health/`.
- Daily summary for trend tracking.

---

## Safety Net Design

### Health Signals
- System health: CPU, memory, disk, Node version.
- Gateway status: running, responsive, error rate.
- Skills health: availability + last success time.
- External deps: GitHub, Discord, email/OAuth.
- Web presence: site + community health.

### Core Safeguards
- Circuit breaker when repeated failures occur.
- Per-skill cooldown to prevent restart loops.
- Read-only mode when critical services fail.
- Fast fail for missing secrets or invalid tokens.

### Data Outputs
- `health.json`: snapshot with component statuses.
- `alerts.log`: structured alert log.
- `actions.log`: recovery actions taken.
 - `repo_index_freshness`: warns if repo index is stale (default 24h).

---

## Setup (MVP)

### Run Once
- `node scripts/jarvis-safety-net.js`
- `node scripts/jarvis-admin.js safety`

### Schedule (Windows)
- `powershell -ExecutionPolicy Bypass -File scripts\add-safety-net-schedule.ps1`
- Task name: **JARVIS Safety Net** (runs every 5 minutes)

### Alerts (Discord Webhook)
Add to `%USERPROFILE%\.clawdbot\.env`:

```env
JARVIS_ALERT_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

This sends alerts when the overall status is `warn` or `critical`.

### Repo Index Freshness
Optional override in `%USERPROFILE%\.clawdbot\.env`:

```env
JARVIS_REPO_INDEX_STALE_HOURS=24
```

---

## Roadmap

### Milestone 1: MVP Safety Net (1-2 weeks)
- Add orchestrator script.
- Aggregate checks into single JSON report.
- Basic alerts via console + Discord.
- Manual trigger + scheduled task.

### Milestone 2: Recovery + Guardrails (2-3 weeks)
- Watchdog process.
- Safe recovery actions.
- Circuit breaker thresholds.

### Milestone 3: Trends + Reporting (2 weeks)
- Daily/weekly health report.
- Trend analysis and degradation detection.

---

## Launch Checklist

- Verify checks run locally without secrets leaks.
- Simulate failures for each component.
- Validate alert routing for all severity levels.
- Document incident response steps.
- Add rollback and disable flag for safety net.

---

## Risks & Dependencies

- Risk: False positives cause alert fatigue.
- Risk: Auto-recovery could mask deeper issues.
- Dependency: Stable access to gateway and skill status APIs.

---

## Next Action

Draft the orchestrator spec and build the first version that aggregates existing checks into a single health snapshot and alert output.
