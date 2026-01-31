# Add Jarvis Repo Indexer to Windows Task Scheduler
# Run this script once. To remove: Task Scheduler → JARVIS Repo Indexer → Delete

$taskName = "JARVIS Repo Indexer"
$batPath = Join-Path $PSScriptRoot "run-repo-index.bat"
$batPath = (Resolve-Path $batPath).Path

if (-not (Test-Path $batPath)) {
    Write-Host "Error: $batPath not found." -ForegroundColor Red
    exit 1
}

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batPath`"" -WorkingDirectory (Split-Path $batPath)
$trigger = New-ScheduledTaskTrigger -Daily -At 3am
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
    Write-Host "Done. JARVIS Repo Indexer will run daily at 3 AM." -ForegroundColor Green
    Write-Host "To remove: Task Scheduler → Task Scheduler Library → '$taskName' → Delete" -ForegroundColor Gray
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
