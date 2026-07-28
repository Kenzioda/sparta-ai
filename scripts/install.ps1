#!/usr/bin/env pwsh
$ErrorActionPreference = "Stop"

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  S.P.A.R.T.A - Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$node = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "[1/2] Installing Node.js..." -ForegroundColor Yellow
  $msiPath = "$env:TEMP\node-install.msi"
  try {
    Invoke-WebRequest -Uri "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi" -OutFile $msiPath -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /quiet /norestart" -Wait
    Remove-Item $msiPath -Force
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
  } catch {
    Write-Host "Failed to install Node.js. Download from: https://nodejs.org" -ForegroundColor Red
    exit 1
  }
} else {
  Write-Host "[1/2] Node.js found" -ForegroundColor Green
}

Write-Host "[2/2] Installing S.P.A.R.T.A..."
npm install -g github:Kenzioda/sparta-ai 2>&1 | Out-Null
if ($LASTEXITCODE -ne 0) {
  Write-Host "Installation failed." -ForegroundColor Red
  exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  S.P.A.R.T.A installed!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Run: sparta" -ForegroundColor Yellow
