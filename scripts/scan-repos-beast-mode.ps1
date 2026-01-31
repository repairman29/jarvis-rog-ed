# Scan all GitHub repos with BEAST-MODE quality score
# Requires: gh auth, BEAST-MODE deps installed (npm install), node
# Outputs: reports\beast-mode-repo-scan-YYYYMMDD-HHmm.tsv

$ErrorActionPreference = "Continue"

$baseDir = "C:\Users\jeffa\JARVIS\repos\repairman29"
$beastCli = "C:\Users\jeffa\JARVIS\BEAST-MODE\bin\beast-mode.js"
$timestamp = Get-Date -Format "yyyyMMdd-HHmm"
$reportDir = "C:\Users\jeffa\JARVIS\JARVIS\reports"
$reportPath = Join-Path $reportDir "beast-mode-repo-scan-$timestamp.tsv"

if (!(Test-Path $baseDir)) { New-Item -ItemType Directory -Path $baseDir | Out-Null }
if (!(Test-Path $reportDir)) { New-Item -ItemType Directory -Path $reportDir | Out-Null }

Write-Host "Fetching repos from GitHub..." -ForegroundColor Cyan
$reposJson = gh api --paginate --slurp "user/repos?per_page=100&sort=updated&visibility=all"
$repos = $reposJson | ConvertFrom-Json
if ($repos -is [System.Array] -and $repos.Count -gt 0 -and $repos[0] -is [System.Array]) {
  $repos = $repos | ForEach-Object { $_ } # flatten nested arrays
}

"repo\tprivate\tupdated_at\tquality_score\tnotes" | Out-File -FilePath $reportPath -Encoding utf8

foreach ($repo in $repos) {
  $name = $repo.name
  $full = $repo.full_name
  $updated = $repo.updated_at
  $isPrivate = $repo.private
  $target = Join-Path $baseDir $name

  Write-Host "=== $full ===" -ForegroundColor Yellow

  if (!(Test-Path $target)) {
    Write-Host "Cloning..." -ForegroundColor DarkCyan
    gh repo clone $full $target -- --depth 1 | Out-Null
  } else {
    Write-Host "Already cloned." -ForegroundColor DarkCyan
  }

  Push-Location $target
  $output = & node $beastCli quality score 2>&1
  $score = ""
  foreach ($line in $output) {
    if ($line -match "Quality Score:\s*(\d+)") { $score = $Matches[1]; break }
    if ($line -match "Nuclear scan complete:\s*(\d+)\/100") { $score = $Matches[1]; break }
    if ($line -match "Quality check complete:\s*(\d+)\/100") { $score = $Matches[1]; break }
  }
  if ($score -eq "") { $score = "N/A" }

  if ($LASTEXITCODE -ne 0) {
    $note = ($output -join " ").Replace("`t"," ").Replace("`n"," ")
    "$full`t$isPrivate`t$updated`tERROR`t$note" | Out-File -FilePath $reportPath -Append -Encoding utf8
    Write-Host "Error (exit $LASTEXITCODE)" -ForegroundColor Red
  } else {
    "$full`t$isPrivate`t$updated`t$score`tOK" | Out-File -FilePath $reportPath -Append -Encoding utf8
    Write-Host "Score: $score" -ForegroundColor Green
  }

  Pop-Location
}

Write-Host "Done. Report: $reportPath" -ForegroundColor Green
