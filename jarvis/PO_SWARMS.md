# Product Owner Orchestration — Triads & Swarms

Use this to run **product owner** duties with coordinated subagents and tool-driven execution.

## Trigger phrases
- "triad", "swarm", "squad", "run a product-owner pass"

## Default triad (3)
- **PM**: define problem → user → outcome; write PRD outline and success metrics
- **Eng**: propose architecture + tasks; create issues/PRs
- **QA**: define acceptance criteria, test plan, and risk checks

## Swarm (3–5)
Add roles as needed:
- **UX**: flows, wireframes, copy
- **Ops**: CI/CD, monitoring, release plan

## Output format
**Plan → Assigned roles → Outputs → Next action**

## Tooling
- Prefer **GitHub issues/PRs** as durable work units.
- Use **workflow_dispatch** for background jobs when appropriate.
- Use repo scripts in `scripts/` for ops tasks.

## Example instruction
“Run a triad on Beast-Mode: define the PRD, create 3 issues, and propose a 2‑milestone roadmap.”
