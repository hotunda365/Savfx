param(
  [string]$LocalBaseUrl = "http://localhost:3000",
  [string]$RemoteBaseUrl = "https://savfx.zeabur.app",
  [string]$Collection = "sync_checks"
)

$ErrorActionPreference = 'Stop'

function Test-DocVisible {
  param(
    [string]$BaseUrl,
    [string]$CollectionName,
    [string]$DocId,
    [int]$Retries = 10,
    [int]$DelayMs = 500
  )

  for ($i = 0; $i -lt $Retries; $i++) {
    try {
      $res = Invoke-RestMethod -Uri "$BaseUrl/api/collections/$CollectionName/$DocId" -Method GET
      if ($res.id -eq $DocId) {
        return $true
      }
    }
    catch {
      # Retry to account for temporary lag.
    }

    Start-Sleep -Milliseconds $DelayMs
  }

  return $false
}

$stamp = [DateTimeOffset]::UtcNow.ToUnixTimeMilliseconds()
$localId = "local-$stamp"
$remoteId = "remote-$stamp"

$localPayload = @{
  id = $localId
  source = "localhost"
  ts = (Get-Date).ToString("o")
} | ConvertTo-Json -Depth 5

$remotePayload = @{
  id = $remoteId
  source = "zeabur"
  ts = (Get-Date).ToString("o")
} | ConvertTo-Json -Depth 5

Write-Host "[1/4] Writing local -> $LocalBaseUrl"
Invoke-RestMethod -Uri "$LocalBaseUrl/api/collections/$Collection" -Method POST -ContentType "application/json" -Body $localPayload | Out-Null

Write-Host "[2/4] Checking remote can read local write -> $RemoteBaseUrl"
$localSeenOnRemote = Test-DocVisible -BaseUrl $RemoteBaseUrl -CollectionName $Collection -DocId $localId

Write-Host "[3/4] Writing remote -> $RemoteBaseUrl"
Invoke-RestMethod -Uri "$RemoteBaseUrl/api/collections/$Collection" -Method POST -ContentType "application/json" -Body $remotePayload | Out-Null

Write-Host "[4/4] Checking local can read remote write -> $LocalBaseUrl"
$remoteSeenOnLocal = Test-DocVisible -BaseUrl $LocalBaseUrl -CollectionName $Collection -DocId $remoteId

Write-Host ""
Write-Host "=== Sync Result ==="
Write-Host "Local write visible on remote: $localSeenOnRemote"
Write-Host "Remote write visible on local: $remoteSeenOnLocal"

if ($localSeenOnRemote -and $remoteSeenOnLocal) {
  Write-Host "PASS: localhost and Zeabur are using the same PostgreSQL data source."
  exit 0
}

Write-Host "FAIL: localhost and Zeabur are not fully synced (check DATABASE_URL/POSTGRES_CONNECTION_STRING and service restart)."
exit 1
