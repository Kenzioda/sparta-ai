param(
  [Parameter(Mandatory)]
  [string]$Version,

  [Parameter(Mandatory)]
  [string]$BinaryPath,

  [string]$InstallDir = "${env:LOCALAPPDATA}\Sparta"
)

$ErrorActionPreference = "Stop"
$Version = if ($Version) { $Version } else { "1.0.0" }

Write-Host "Installing S.P.A.R.T.A v$Version..." -ForegroundColor Cyan

# Create install directory
New-Item -ItemType Directory -Path $InstallDir -Force | Out-Null
New-Item -ItemType Directory -Path "$InstallDir\.opencode" -Force | Out-Null
New-Item -ItemType Directory -Path "$InstallDir\.opencode\agent" -Force | Out-Null
New-Item -ItemType Directory -Path "$InstallDir\themes\tui" -Force | Out-Null
New-Item -ItemType Directory -Path "$InstallDir\themes\ui" -Force | Out-Null
New-Item -ItemType Directory -Path "$InstallDir\skills" -Force | Out-Null
New-Item -ItemType Directory -Path "$InstallDir\specs" -Force | Out-Null

# Copy binary
$destBin = "$InstallDir\sparta.exe"
Copy-Item -Path $BinaryPath -Destination $destBin -Force

# Copy Sparta config files (from the package directory)
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$pkgDir = Resolve-Path "$scriptDir\.."
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

# Add to PATH (User-level)
$currentPath = [Environment]::GetEnvironmentVariable("Path", "User")
if ($currentPath -notlike "*$InstallDir*") {
  [Environment]::SetEnvironmentVariable("Path", "$currentPath;$InstallDir", "User")
  Write-Host "  Added $InstallDir to PATH" -ForegroundColor Green
}

# ─── Desktop Shortcut ─────────────────────────────────────────
try {
  $desktop = [Environment]::GetFolderPath("Desktop")
  $shortcutPath = "$desktop\S.P.A.R.T.A.lnk"

  $wshell = New-Object -ComObject WScript.Shell
  $shortcut = $wshell.CreateShortcut($shortcutPath)
  $shortcut.TargetPath = $destBin
  $shortcut.WorkingDirectory = $InstallDir
  $shortcut.Description = "S.P.A.R.T.A v$Version — Super Personal Assistant"
  $shortcut.IconLocation = "$destBin,0"

  # Try to set terminal for better experience
  $shortcut.Arguments = ""

  $shortcut.Save()
  Write-Host "  Desktop shortcut created: $shortcutPath" -ForegroundColor Green
} catch {
  Write-Warning "  Could not create desktop shortcut: $_"
}

# Create uninstaller
$uninstallScript = @"
@echo off
echo Uninstalling S.P.A.R.T.A...
set INSTALL_DIR=$InstallDir
:: Remove PATH entry (simple version - removes all occurrences)
for /f "skip=2 tokens=3*" %%a in ('reg query "HKCU\Environment" /v Path 2^>nul') do set USER_PATH=%%a%%b
set NEW_PATH=
for %%p in ("%USER_PATH:;=";"%") do (
  if /i "%%~p" neq "%INSTALL_DIR%" (
    if defined NEW_PATH (
      set "NEW_PATH=!NEW_PATH!;%%~p"
    ) else (
      set "NEW_PATH=%%~p"
    )
  )
)
reg add "HKCU\Environment" /v Path /t REG_EXPAND_SZ /d "!NEW_PATH!" /f
:: Remove files
rmdir /s /q "%INSTALL_DIR%" 2>nul
:: Remove shortcut
del "%USERPROFILE%\Desktop\S.P.A.R.T.A.lnk" 2>nul
echo S.P.A.R.T.A has been uninstalled.
pause
"@
$uninstallScript | Out-File -FilePath "$InstallDir\uninstall.bat" -Encoding ASCII

Write-Host "`nS.P.A.R.T.A v$Version installed successfully!" -ForegroundColor Cyan
Write-Host "  Binary: $destBin" -ForegroundColor Green
Write-Host "  Shortcut: Desktop\S.P.A.R.T.A.lnk" -ForegroundColor Green
Write-Host "`nRun 'sparta' from terminal or double-click the desktop icon." -ForegroundColor Yellow
