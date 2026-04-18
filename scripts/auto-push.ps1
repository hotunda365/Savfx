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

  Write-Host "Pushed successfully to origin/$branch"
}
finally {
  Pop-Location
}
