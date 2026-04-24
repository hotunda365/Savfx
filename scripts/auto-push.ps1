param(
  [string]$Message = ""
)

$ErrorActionPreference = 'Stop'

$repoRoot = Split-Path -Parent $PSScriptRoot
Push-Location $repoRoot

try {
  $status = git status --porcelain
  if (-not $status) {
    Write-Host "No local changes to commit."
    exit 0
  }

  git add -A

  if ([string]::IsNullOrWhiteSpace($Message)) {
    $Message = "chore: auto push $(Get-Date -Format 'yyyy-MM-dd HH:mm')"
  }

  git commit -m $Message
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  $branch = (git branch --show-current).Trim()
  if ([string]::IsNullOrWhiteSpace($branch)) {
    throw "Unable to detect current git branch."
  }

  git push origin $branch
  if ($LASTEXITCODE -ne 0) {
    exit $LASTEXITCODE
  }

  # Keep Zeabur deployment branch aligned when development happens on master.
  if ($branch -eq "master") {
    $hasMain = (git branch --list main)
    if (-not [string]::IsNullOrWhiteSpace($hasMain)) {
      Write-Host "Syncing master into main..."
      git checkout main
      if ($LASTEXITCODE -ne 0) {
        throw "Failed to checkout main branch."
      }

      git merge --no-ff master -m "Sync master updates to main for Zeabur"
      if ($LASTEXITCODE -ne 0) {
        throw "Merge master -> main failed. Resolve conflicts and retry."
      }

      git push origin main
      if ($LASTEXITCODE -ne 0) {
        throw "Failed to push main branch."
      }

      git checkout master
      if ($LASTEXITCODE -ne 0) {
        throw "Failed to switch back to master."
      }
      Write-Host "Synced origin/main with master updates."
    }
  }

  Write-Host "Pushed successfully to origin/$branch"
}
finally {
  Pop-Location
}
