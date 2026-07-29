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
    try {
      const ps = `$s=[Environment]::GetFolderPath("Desktop");$w=New-Object -ComObject WScript.Shell;$c=$w.CreateShortcut("$s\\S.P.A.R.T.A.lnk");$c.TargetPath="${launcher.replace(/\\/g, "\\\\")}";$c.WorkingDirectory="${root.replace(/\\/g, "\\\\")}";$c.Description="S.P.A.R.T.A";$c.Save()`
      spawn("powershell", ["-NoProfile", "-Command", ps], { stdio: "ignore", windowsHide: true }).unref()
    } catch {}
  } else {
    const f = resolve(process.env.HOME || "/tmp", process.platform === "darwin" ? "Applications/S.P.A.R.T.A.app" : ".local/share/applications/sparta.desktop")
    try { writeFileSync(f, `[Desktop Entry]\nName=S.P.A.R.T.A\nExec=${launcher}\nIcon=terminal\nType=Application\nCategories=Utility;\nTerminal=false\n`) } catch {}
  }
}
createShortcut()

// ─── Launch web UI ───────────────────────────────────────────
try {
  const proc = spawn(process.execPath, [launcher], { stdio: "ignore", windowsHide: true, detached: true })
  proc.unref()
} catch {}
