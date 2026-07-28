#!/usr/bin/env node
import { spawn } from "node:child_process"
import { resolve, dirname } from "node:path"
import { fileURLToPath } from "node:url"
import { existsSync, writeFileSync } from "node:fs"

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = resolve(__dirname, "..")
const launcher = resolve(root, "bin", "sparta-web")

// ─── Desktop Shortcut ───────────────────────────────────────
function createShortcut() {
  if (process.platform === "win32") {
    const ps = `
      $desktop = [Environment]::GetFolderPath("Desktop")
      $wshell = New-Object -ComObject WScript.Shell
      $sc = $wshell.CreateShortcut("$desktop\\S.P.A.R.T.A.lnk")
      $sc.TargetPath = "${launcher.replace(/\\/g, "\\\\")}"
      $sc.WorkingDirectory = "${root.replace(/\\/g, "\\\\")}"
      $sc.Description = "S.P.A.R.T.A — Super Personal Assistant"
      $sc.Save()
      Write-Host "Shortcut created"
    `
    try {
      spawn("powershell", ["-NoProfile", "-Command", ps], {
        stdio: "ignore", windowsHide: true
      }).unref()
    } catch {}
  } else {
    // macOS / Linux .desktop file
    const desktopFile = resolve(
      process.env.HOME || "/tmp",
      process.platform === "darwin"
        ? "Applications/S.P.A.R.T.A.app"
        : ".local/share/applications/sparta.desktop"
    )
    try {
      writeFileSync(desktopFile, `[Desktop Entry]
Name=S.P.A.R.T.A
Exec=${launcher}
Icon=terminal
Type=Application
Categories=Utility;
Terminal=false
`)
    } catch {}
  }
}

createShortcut()

// ─── Launch web UI ───────────────────────────────────────────
try {
  const proc = spawn(process.execPath, [launcher], {
    stdio: "ignore",
    windowsHide: true,
    detached: true,
  })
  proc.unref()
} catch {}
