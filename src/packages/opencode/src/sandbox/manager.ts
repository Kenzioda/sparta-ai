import fs from "fs"
import path from "path"
import os from "os"
import { execSync, spawn, type ChildProcess } from "child_process"
import { DeviceRingGuard } from "./ring"

const SANDBOX_DIR = path.join(os.homedir(), ".local", "share", "sparta", "sandbox")
const APPS_FILE = path.join(SANDBOX_DIR, "apps.json")
const WATCHDOG_INTERVAL = 3000
const RESTART_DELAY = 2000
const MAX_RESTART_BACKOFF = 30000

export interface SandboxApp {
  name: string
  type: "npm" | "binary" | "git"
  source: string
  installedAt: number
  dir: string
  persistent: boolean
  running: boolean
  pid: number | null
  startedAt?: number
  restartCount?: number
}

export interface AppStatus {
  name: string
  type: string
  persistent: boolean
  running: boolean
  installedAt: number
  startedAt?: number
  restartCount?: number
}

export class SandboxManager {
  private apps: Map<string, SandboxApp> = new Map()
  private processes: Map<string, ChildProcess> = new Map()
  private watchdogs: Map<string, ReturnType<typeof setInterval>> = new Map()
  private ringGuard: DeviceRingGuard | null

  constructor(ringGuard?: DeviceRingGuard) {
    this.ringGuard = ringGuard || null
    this.ensureDirs()
    this.loadApps()
    this.resumePersistent()
  }

  private ensureDirs(): void {
    for (const d of [SANDBOX_DIR, path.join(SANDBOX_DIR, "bin"), path.join(SANDBOX_DIR, "apps"), path.join(SANDBOX_DIR, "data"), path.join(SANDBOX_DIR, "temp")]) {
      if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true })
    }
  }

  private loadApps(): void {
    try {
      if (fs.existsSync(APPS_FILE)) {
        const data: SandboxApp[] = JSON.parse(fs.readFileSync(APPS_FILE, "utf-8"))
        for (const app of data) this.apps.set(app.name, app)
      }
    } catch {}
  }

  private saveApps(): void {
    try {
      fs.writeFileSync(APPS_FILE, JSON.stringify(Array.from(this.apps.values()), null, 2))
    } catch {}
  }

  private checkRing(operation: string, context?: string): void {
    if (this.ringGuard) {
      const check = this.ringGuard.check(operation, context || operation)
      if (!check.allowed) throw new Error(check.reason)
    }
  }

  private startWatchdog(name: string): void {
    this.stopWatchdog(name)
    const interval = setInterval(() => {
      const app = this.apps.get(name)
      const proc = this.processes.get(name)
      if (!app || !app.persistent) {
        this.stopWatchdog(name)
        return
      }
      if (!proc || proc.exitCode !== null) {
        const now = Date.now()
        const uptime = app.startedAt ? now - app.startedAt : RESTART_DELAY
        const backoff = Math.min(uptime * 0.5, MAX_RESTART_BACKOFF)
        const delay = Math.max(RESTART_DELAY, backoff)
        if (uptime < delay) return
        this.processes.delete(name)
        app.restartCount = (app.restartCount || 0) + 1
        this.startProcess(name)
      }
    }, WATCHDOG_INTERVAL)

    this.watchdogs.set(name, interval)
  }

  private stopWatchdog(name: string): void {
    const interval = this.watchdogs.get(name)
    if (interval) {
      clearInterval(interval)
      this.watchdogs.delete(name)
    }
  }

  private startProcess(name: string): void {
    const app = this.apps.get(name)
    if (!app) return

    const binPath = path.join(SANDBOX_DIR, "bin", name)
    if (!fs.existsSync(binPath)) return

    const proc = spawn(binPath, [], {
      stdio: "ignore",
      detached: true,
      cwd: SANDBOX_DIR,
    })

    this.processes.set(name, proc)
    app.pid = proc.pid || null
    app.running = true
    app.startedAt = Date.now()
    this.saveApps()

    proc.on("exit", () => {
      app.running = false
      app.pid = null
      this.saveApps()
    })
  }

  private resumePersistent(): void {
    for (const [name, app] of this.apps) {
      if (app.persistent) {
        this.startProcess(name)
        this.startWatchdog(name)
      }
    }
  }

  install(name: string, type: "npm" | "binary" | "git" = "npm", source?: string): SandboxApp {
    this.checkRing("sandbox_install", `install ${name} (${type})`)

    const appDir = path.join(SANDBOX_DIR, "apps", name)
    if (fs.existsSync(appDir)) throw new Error(`App '${name}' already installed`)

    const entry: SandboxApp = {
      name, type, source: source || name,
      installedAt: Date.now(),
      dir: appDir,
      persistent: false,
      running: false,
      pid: null,
    }

    if (type === "npm") {
      const pkg = source || name
      fs.mkdirSync(appDir, { recursive: true })
      const pkgJson = path.join(appDir, "package.json")
      fs.writeFileSync(pkgJson, JSON.stringify({ name: `sandbox-${name}`, version: "1.0.0", private: true }))
      execSync(`npm install ${pkg} --prefix "${appDir}"`, { stdio: "pipe", cwd: appDir, timeout: 120000 })
      const nodeBin = path.join(appDir, "node_modules", ".bin")
      if (fs.existsSync(nodeBin)) {
        for (const f of fs.readdirSync(nodeBin)) {
          const linkPath = path.join(SANDBOX_DIR, "bin", f)
          if (!fs.existsSync(linkPath)) {
            try { fs.symlinkSync(path.join(nodeBin, f), linkPath, "file") } catch {}
          }
        }
      }
    } else if (type === "binary") {
      const binDir = path.join(SANDBOX_DIR, "bin")
      if (source && (source.startsWith("http://") || source.startsWith("https://"))) {
        throw new Error("Binary download from URL not supported in this environment. Download manually.")
      }
      entry.dir = binDir
    } else if (type === "git") {
      execSync(`git clone ${source || name} "${appDir}"`, { stdio: "pipe", timeout: 120000 })
      if (fs.existsSync(path.join(appDir, "package.json"))) {
        execSync("npm install", { stdio: "pipe", cwd: appDir, timeout: 120000 })
      }
    }

    this.apps.set(name, entry)
    this.saveApps()
    return entry
  }

  uninstall(name: string, permanent?: boolean): void {
    this.checkRing("sandbox_install", `uninstall ${name}`)
    const app = this.apps.get(name)
    if (!app) throw new Error(`App '${name}' not found`)
    this.stopWatchdog(name)
    if (app.running) this.stop(name)
    this.processes.delete(name)

    // Recycle Bin: move to .recycle/ instead of permanent delete
    const recycleDir = path.join(SANDBOX_DIR, ".recycle")
    if (!permanent && fs.existsSync(app.dir)) {
      if (!fs.existsSync(recycleDir)) fs.mkdirSync(recycleDir, { recursive: true })
      const dest = path.join(recycleDir, name)
      try {
        fs.renameSync(app.dir, dest)
      } catch {
        // cross-device rename — fall back to copy + delete
        fs.cpSync(app.dir, dest, { recursive: true, force: true })
        fs.rmSync(app.dir, { recursive: true, force: true })
      }
    } else if (fs.existsSync(app.dir)) {
      fs.rmSync(app.dir, { recursive: true, force: true })
    }

    this.apps.delete(name)
    this.saveApps()
  }

  recycleList(): { name: string; dir: string; movedAt: Date }[] {
    const recycleDir = path.join(SANDBOX_DIR, ".recycle")
    if (!fs.existsSync(recycleDir)) return []
    const items: { name: string; dir: string; movedAt: Date }[] = []
    for (const entry of fs.readdirSync(recycleDir)) {
      const fullPath = path.join(recycleDir, entry)
      try {
        const stat = fs.statSync(fullPath)
        items.push({ name: entry, dir: fullPath, movedAt: stat.mtime })
      } catch {}
    }
    return items.sort((a, b) => b.movedAt.getTime() - a.movedAt.getTime())
  }

  recycleRestore(name: string): void {
    const recycleDir = path.join(SANDBOX_DIR, ".recycle")
    const src = path.join(recycleDir, name)
    if (!fs.existsSync(src)) throw new Error(`Item '${name}' not found in recycle bin`)
    const dst = path.join(SANDBOX_DIR, "apps", name)
    try {
      fs.renameSync(src, dst)
    } catch {
      fs.cpSync(src, dst, { recursive: true, force: true })
      fs.rmSync(src, { recursive: true, force: true })
    }
    // Re-register in apps map
    const entry: SandboxApp = {
      name, type: "npm", source: name,
      installedAt: Date.now(),
      dir: dst,
      persistent: false,
      running: false,
      pid: null,
    }
    this.apps.set(name, entry)
    this.saveApps()
  }

  recyclePurge(): number {
    const recycleDir = path.join(SANDBOX_DIR, ".recycle")
    if (!fs.existsSync(recycleDir)) return 0
    let count = 0
    for (const entry of fs.readdirSync(recycleDir)) {
      try {
        fs.rmSync(path.join(recycleDir, entry), { recursive: true, force: true })
        count++
      } catch {}
    }
    return count
  }

  start(name: string): { status: string; pid?: number } {
    this.checkRing("sandbox_start", `start ${name}`)
    const app = this.apps.get(name)
    if (!app) throw new Error(`App '${name}' not found`)
    if (app.running) return { status: "already_running", pid: app.pid! }

    this.startProcess(name)
    if (app.persistent) this.startWatchdog(name)

    return { status: "started", pid: app.pid! }
  }

  stop(name: string): { status: string } {
    this.checkRing("sandbox_stop", `stop ${name}`)
    this.stopWatchdog(name)
    const app = this.apps.get(name)
    if (!app || !app.running) return { status: "not_running" }
    const proc = this.processes.get(name)
    if (proc && proc.pid) {
      try { process.kill(proc.pid, "SIGTERM") } catch {}
      setTimeout(() => { try { process.kill(proc.pid!, "SIGKILL") } catch {} }, 3000)
    }
    this.processes.delete(name)
    app.running = false
    app.pid = null
    this.saveApps()
    return { status: "stopped" }
  }

  setPersistent(name: string, enabled: boolean): void {
    this.checkRing("sandbox_persist", `persist ${name}=${enabled}`)
    const app = this.apps.get(name)
    if (!app) throw new Error(`App '${name}' not found`)
    app.persistent = enabled
    app.restartCount = 0
    if (enabled && app.running) {
      this.startWatchdog(name)
    } else if (!enabled) {
      this.stopWatchdog(name)
    }
    this.saveApps()
  }

  restart(name: string): { status: string } {
    this.checkRing("sandbox_start", `restart ${name}`)
    this.stop(name)
    return this.start(name)
  }

  startBridge(port?: number): { status: string; pid?: number } {
    const name = "http-mcp-bridge"
    let app = this.apps.get(name)

    if (!app) {
      app = {
        name, type: "npm", source: "builtin",
        installedAt: Date.now(),
        dir: path.join(SANDBOX_DIR, "apps", name),
        persistent: true,
        running: false,
        pid: null,
      }
      this.apps.set(name, app)
      if (!fs.existsSync(app.dir)) fs.mkdirSync(app.dir, { recursive: true })
    }

    if (app.running) return { status: "already_running", pid: app.pid! }

    const bridgePath = path.join(
      process.env.SPARTA_ROOT || process.cwd(),
      "packages", "opencode", "src", "mcp", "builtin", "http-mcp-bridge.mjs"
    )

    if (!fs.existsSync(bridgePath)) {
      throw new Error(`Bridge not found at ${bridgePath}`)
    }

    const proc = spawn(process.execPath, [bridgePath], {
      stdio: "pipe",
      detached: true,
      env: {
        ...process.env,
        BRIDGE_PORT: String(port || 9128),
        CAMOFOX_PATH: process.env.CAMOFOX_PATH || "camofox",
      },
    })

    this.processes.set(name, proc)
    app.pid = proc.pid || null
    app.running = true
    app.startedAt = Date.now()
    this.saveApps()

    proc.on("exit", () => {
      app.running = false
      app.pid = null
      this.saveApps()
    })

    this.startWatchdog(name)
    return { status: "started", pid: proc.pid }
  }

  stopBridge(): { status: string } {
    return this.stop("http-mcp-bridge")
  }

  list(): AppStatus[] {
    if (this.ringGuard) this.ringGuard.check("sandbox_install", "list")
    return Array.from(this.apps.values()).map((a) => ({
      name: a.name,
      type: a.type,
      persistent: a.persistent,
      running: a.running,
      installedAt: a.installedAt,
      startedAt: a.startedAt,
      restartCount: a.restartCount,
    }))
  }

  status(name: string): SandboxApp | undefined {
    return this.apps.get(name)
  }
}

export function createSandboxManager(ringGuard?: DeviceRingGuard): SandboxManager {
  return new SandboxManager(ringGuard)
}
