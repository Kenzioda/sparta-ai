param(
  [string]$InstallDir = "${env:LOCALAPPDATA}\Sparta"
)

$ErrorActionPreference = "Stop"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pkgDir = Resolve-Path $scriptDir

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  S.P.A.R.T.A - Windows Setup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ─── 1. Check/Install Node.js ───────────────────────────────────
$node = Get-Command "node" -ErrorAction SilentlyContinue
if (-not $node) {
  Write-Host "[1/4] Installing Node.js..." -ForegroundColor Yellow
  $nodeUrl = "https://nodejs.org/dist/v22.14.0/node-v22.14.0-x64.msi"
  $msiPath = "$env:TEMP\node-install.msi"
  try {
    Invoke-WebRequest -Uri $nodeUrl -OutFile $msiPath -UseBasicParsing
    Start-Process msiexec.exe -ArgumentList "/i `"$msiPath`" /quiet /norestart" -Wait
    Remove-Item $msiPath -Force
    $env:Path = [Environment]::GetEnvironmentVariable("Path", "Machine") + ";" + [Environment]::GetEnvironmentVariable("Path", "User")
  } catch {
    Write-Host "Failed to install Node.js automatically." -ForegroundColor Red
    Write-Host "Download and install manually from: https://nodejs.org" -ForegroundColor Yellow
    Write-Host "Then re-run this script." -ForegroundColor Yellow
    exit 1
  }
} else {
  Write-Host "[1/4] Node.js found: $($node.Source)" -ForegroundColor Green
}

# ─── 2. Check/Install Bun ───────────────────────────────────────
$bun = Get-Command "bun" -ErrorAction SilentlyContinue
if (-not $bun) {
  Write-Host "[2/4] Installing Bun..." -ForegroundColor Yellow
  try {
    powershell -NoProfile -Command "& { iwr https://bun.sh/install.ps1 -UseBasicParsing | iex }" -Wait
    $env:BUN_INSTALL = "$env:USERPROFILE\.bun"
    $env:Path += ";$env:BUN_INSTALL\bin"
    [Environment]::SetEnvironmentVariable("Path", "$env:Path", "User")
  } catch {
    Write-Host "Failed to install Bun. Will use npm instead." -ForegroundColor Yellow
  }
} else {
  Write-Host "[2/4] Bun found: $($bun.Source)" -ForegroundColor Green
}

# ─── 3. Install opencode engine ──────────────────────────────────
Write-Host "[3/4] Installing opencode engine..." -ForegroundColor Yellow
try {
  npm install -g opencode 2>&1 | Out-Null
} catch {
  Write-Host "npm install failed, trying bun..." -ForegroundColor Yellow
  try {
    bun install -g opencode 2>&1 | Out-Null
  } catch {
    Write-Host "Failed to install opencode engine." -ForegroundColor Red
    Write-Host "Run manually: npm install -g opencode" -ForegroundColor Yellow
    exit 1
  }
}
Write-Host "[3/4] opencode engine installed" -ForegroundColor Green

# ─── 4. Copy Sparta config ───────────────────────────────────────
Write-Host "[4/4] Installing Sparta config..." -ForegroundColor Yellow
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
if (Test-Path "$pkgDir\.opencode") {
  Copy-Item -Path "$pkgDir\.opencode\*" -Destination "$InstallDir\.opencode\" -Recurse -Force
}
if (Test-Path "$pkgDir\themes") {
  Copy-Item -Path "$pkgDir\themes\*" -Destination "$InstallDir\themes\" -Recurse -Force
}
if (Test-Path "$pkgDir\skills") {
  Copy-Item -Path "$pkgDir\skills\*" -Destination "$InstallDir\skills\" -Recurse -Force
}
if (Test-Path "$pkgDir\specs") {
  Copy-Item -Path "$pkgDir\specs\*" -Destination "$InstallDir\specs\" -Recurse -Force
}

# Create sparta.bat launcher
$batContent = @'
@echo off
set "OPENCODE_CONFIG_DIR=%~dp0.opencode"
opencode %*
'@
$batContent | Out-File -FilePath "$InstallDir\sparta.bat" -Encoding ASCII

# Create uninstaller
$uninstallScript = @"
@echo off
echo Uninstalling S.P.A.R.T.A...
echo Removing config...
rmdir /s /q "$InstallDir" 2>nul
echo Removing desktop shortcut...
del "%USERPROFILE%\Desktop\S.P.A.R.T.A.lnk" 2>nul
echo S.P.A.R.T.A has been uninstalled.
echo NOTE: opencode engine was not removed. Run: npm uninstall -g opencode
pause
"@
$uninstallScript | Out-File -FilePath "$InstallDir\uninstall.bat" -Encoding ASCII

# Add to PATH
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$InstallDir*") {
  [Environment]::SetEnvironmentVariable("Path", "$currentPath;$InstallDir", "User")
  $env:Path += ";$InstallDir"
}

# ─── Desktop Shortcut ─────────────────────────────────────────
try {
  $desktop = [Environment]::GetFolderPath("Desktop")
  $shortcutPath = "$desktop\S.P.A.R.T.A.lnk"
  $wshell = New-Object -ComObject WScript.Shell
  $shortcut = $wshell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = "$InstallDir\sparta.bat"
  $shortcut.WorkingDirectory = $InstallDir
  $shortcut.Description = "S.P.A.R.T.A — Super Personal Assistant"
  $shortcut.Save()
  Write-Host "  Desktop shortcut: $shortcutPath" -ForegroundColor Green
} catch {
  Write-Warning "  Could not create desktop shortcut: $_"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  S.P.A.R.T.A installed successfully!" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Double-click the desktop icon or run: sparta" -ForegroundColor Yellow
Write-Host "  Uninstall: run '$InstallDir\uninstall.bat'" -ForegroundColor Yellow