# Add JARVIS Safety Net to Windows Task Scheduler
# Run this script once. To remove: Task Scheduler → JARVIS Safety Net → Delete

$taskName = "JARVIS Safety Net"
$batPath = Join-Path $PSScriptRoot "run-jarvis-safety-net.bat"
$batPath = (Resolve-Path $batPath).Path

if (-not (Test-Path $batPath)) {
    Write-Host "Error: $batPath not found." -ForegroundColor Red
    exit 1
}

$action = New-ScheduledTaskAction -Execute "cmd.exe" -Argument "/c `"$batPath`"" -WorkingDirectory (Split-Path $batPath)
$trigger = New-ScheduledTaskTrigger -Once -At (Get-Date).AddMinutes(1) -RepetitionInterval (New-TimeSpan -Minutes 5) -RepetitionDuration (New-TimeSpan -Days 3650)
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries -StartWhenAvailable

try {
    Register-ScheduledTask -TaskName $taskName -Action $action -Trigger $trigger -Settings $settings -Force | Out-Null
    Write-Host "Done. JARVIS Safety Net will run every 5 minutes." -ForegroundColor Green
    Write-Host "To remove: Task Scheduler → Task Scheduler Library → '$taskName' → Delete" -ForegroundColor Gray
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
