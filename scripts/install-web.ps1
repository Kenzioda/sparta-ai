#!/usr/bin/env pwsh
# S.P.A.R.T.A Web Installer
# Usage: irm https://sparta.ai/install.ps1 | iex

param(
  [string]$Version = "latest"
)

$ErrorActionPreference = "Stop"

if ($IsWindows -or $env:OS -match "Windows") {
  $os = "win-x64"
  $ext = ".exe"
} elseif ($IsMacOS -or (uname -s) -match "Darwin") {
  $arch = if ((uname -m) -match "arm64|aarch64") { "arm64" } else { "x64" }
  $os = "mac-$arch"
  $ext = ""
} elseif ($IsLinux -or (uname -s) -match "Linux") {
  $arch = if ((uname -m) -match "arm64|aarch64") { "arm64" } else { "x64" }
  $os = "linux-$arch"
  $ext = ""
}

$repo = "Kenzioda/sparta-ai"
$tag = if ($Version -eq "latest") { "latest" } else { "v$Version" }

Write-Host "Downloading S.P.A.R.T.A for $os..." -ForegroundColor Cyan

# Get release info
$releases = if ($tag -eq "latest") {
  $url = "https://api.github.com/repos/$repo/releases/$tag"
} else {
  $url = "https://api.github.com/repos/$repo/releases/tags/$tag"
}

$release = Invoke-RestMethod -Uri $url -Headers @{ "Accept" = "application/vnd.github.v3+json" }
$downloadUrl = $release.assets | Where-Object { $_.name -like "*$os*" } | Select-Object -First 1 -ExpandProperty browser_download_url

if (-not $downloadUrl) {
  Write-Error "No installer found for $os"
  exit 1
}

$tmpDir = "$env:TEMP\sparta-install"
New-Item -ItemType Directory -Path $tmpDir -Force | Out-Null
$archivePath = "$tmpDir\sparta.zip"

Write-Host "Downloading..." -ForegroundColor Cyan
Invoke-WebRequest -Uri $downloadUrl -OutFile $archivePath -UseBasicParsing

Write-Host "Extracting..." -ForegroundColor Cyan
Expand-Archive -Path $archivePath -DestinationPath $tmpDir -Force

Write-Host "Installing..." -ForegroundColor Cyan
& "$tmpDir\scripts\installer-win.ps1" -Version $release.tag_name -BinaryPath "$tmpDir\sparta.exe"

Remove-Item -Path $tmpDir -Recurse -Force -ErrorAction SilentlyContinue
Write-Host "Done!" -ForegroundColor Green
