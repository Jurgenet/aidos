# Extracts Caddy's root CA from the container and installs it into
# the Windows trust store so the browser trusts https://localhost.
#
# Usage:
#   powershell -ExecutionPolicy Bypass -File infra/caddy/extract-ca.ps1
# or right-click -> Run with PowerShell (will prompt for UAC if needed).
#
# Idempotent: running twice is safe - re-installs / skips with a notice.

$ErrorActionPreference = 'Stop'

$container = 'aid-caddy'
$caSrc     = '/data/caddy/pki/authorities/local/root.crt'
$caTmp     = Join-Path $env:TEMP 'aid-caddy-root.crt'

# 1. Extract CA from the container
Write-Host "Extracting Caddy CA from container '$container'..." -ForegroundColor Cyan
docker cp "${container}:${caSrc}" $caTmp
if (-not (Test-Path $caTmp)) {
  throw "Failed to extract CA. Is the '$container' container running? (docker compose ps)"
}

# LocalMachine\Root is the canonical place: picked up by Chrome, Edge, IE,
# .NET, PowerShell's HttpWebRequest, etc. Requires admin (UAC).
function Install-ToStore([string]$storePath, [string]$label) {
  $store = Get-Item $storePath -ErrorAction SilentlyContinue
  if (-not $store) { throw "Cert store not found: $storePath" }

  $newCert = New-Object System.Security.Cryptography.X509Certificates.X509Certificate2($caTmp)
  $existing = Get-ChildItem -Path $storePath | Where-Object {
    $_.Subject -match 'Caddy' -and $_.Thumbprint -eq $newCert.Thumbprint
  }
  if ($existing) {
    Write-Host "CA already in $label (thumbprint $($existing.Thumbprint.Substring(0,16))...). Skipping." -ForegroundColor DarkGray
    return
  }

  $store.Open([System.Security.Cryptography.X509Certificates.OpenFlags]::ReadWrite)
  try {
    $store.Add($newCert)
    Write-Host "CA installed to $label" -ForegroundColor Green
    Write-Host "  Subject: $($newCert.Subject)" -ForegroundColor DarkGray
    Write-Host "  Thumbprint: $($newCert.Thumbprint)" -ForegroundColor DarkGray
  } finally {
    $store.Close()
  }
  Remove-Item -LiteralPath $caTmp -Force
}

# Try LocalMachine first - needs admin.
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
  [Security.Principal.WindowsBuiltInRole]::Administrator)

if ($isAdmin) {
  try {
    Install-ToStore 'Cert:\LocalMachine\Root' 'Local Machine\Root (Trusted Root Certification Authorities)'
    exit 0
  } catch {
    Write-Host "Local Machine install failed: $($_.Exception.Message)" -ForegroundColor Yellow
  }
} else {
  Write-Host "Not running as administrator - trying Current User store instead." -ForegroundColor Yellow
  Write-Host "  Tip: for system-wide trust (Chrome/Edge/IE), re-run from an elevated PowerShell." -ForegroundColor Yellow
}

# Fallback: CurrentUser\Root. Works for Chrome/Edge (they read from here too)
# and for .NET. Firefox has its own store - see note below.
try {
  Install-ToStore 'Cert:\CurrentUser\Root' 'Current User\Root (Trusted Root Certification Authorities)'
} catch {
  Write-Host ""
  Write-Host "ERROR: Could not install automatically." -ForegroundColor Red
  Write-Host "Manual install:" -ForegroundColor Cyan
  Write-Host "  1. Double-click $caTmp"
  Write-Host "  2. Install Certificate -> Local Machine -> Trusted Root Certification Authorities"
  exit 1
}

Write-Host ""
Write-Host "Done. Restart your browser and open https://localhost." -ForegroundColor Green
Write-Host "Note: Firefox uses its own cert store - about:preferences -> Certificates -> View Certificates -> Import." -ForegroundColor DarkGray
