# Run JARVIS as Product Manager for Beast-Mode — CLI tests
# Run from repo root. Gateway must be running (e.g. npx clawdbot gateway run).
# Usage: powershell -ExecutionPolicy Bypass -File scripts\test-pm-beast-mode.ps1
#
# Session "beast-mode-pm" uses PM instructions (see jarvis/AGENTS.md and jarvis/BEAST_MODE_PM.md).
# Goal: Take over Beast-Mode and build an app that humans, AI agents, and developers love using together.

$sessionId = "beast-mode-pm"
$questions = @(
    "Take over Beast-Mode as product manager. In 2-3 sentences: what's the mission and what's the first concrete next step you'd take?",
    "Work with me to build an app that humans, AI agents and developers will love using together. Give a short PRD-style outline: problem, three user types (human / agent / dev), one north-star metric, and the first milestone.",
    "What's the single next action you can do right now (e.g. create a GitHub issue, draft a doc, or suggest a CLI command)? Do it if you have the tool, or tell me exactly what to run."
)

Write-Host "Session: $sessionId (JARVIS as PM for Beast-Mode)" -ForegroundColor Cyan
Write-Host "Gateway must be running: npx clawdbot gateway run" -ForegroundColor Yellow
Write-Host ""

for ($i = 0; $i -lt $questions.Count; $i++) {
    $n = $i + 1
    Write-Host "=== PM prompt $n ===" -ForegroundColor Cyan
    Write-Host $questions[$i]
    Write-Host ""
    Write-Host "Sending to JARVIS (timeout 120s)..."
    $result = npx clawdbot agent --session-id $sessionId --message $questions[$i] --local 2>&1
    Write-Host $result
    Write-Host ""
    Write-Host "---"
    Write-Host ""
    if ($i -lt $questions.Count - 1) { Start-Sleep -Seconds 3 }
}

Write-Host "Done. Check: (1) mission + first step, (2) PRD outline + milestone, (3) next action or tool use." -ForegroundColor Green
