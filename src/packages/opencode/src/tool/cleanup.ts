import * as Tool from "./tool"
import DESCRIPTION from "./cleanup.txt"
import { ToolJsonSchema } from "./json-schema"
import { Effect, Schema } from "effect"
import fs from "fs"
import path from "path"
import os from "os"

const STATE_DIR = path.join(os.homedir(), ".local", "state", "sparta")
const CACHE_DIR = path.join(os.homedir(), ".cache", "sparta")
const SHARE_DIR = path.join(os.homedir(), ".local", "share", "sparta")

const CONFIG_PATH = path.join(os.homedir(), ".config", "sparta", "retention.json")

interface RetentionConfig {
  sessionDays: number  // 7 | 30 | 180 | -1 (never)
  browserDays: number  // 30 | 90 | 180 | -1 (never)
  sandboxDays: number  // 7 | 30 | 180 | -1 (never)
}

function loadRetention(): RetentionConfig {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"))
    }
  } catch {}
  return { sessionDays: 180, browserDays: 30, sandboxDays: 30 }
}

function saveRetention(cfg: RetentionConfig): void {
  const dir = path.dirname(CONFIG_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(cfg, null, 2))
}

function daysToMs(days: number): number {
  if (days < 0) return -1
  return days * 24 * 60 * 60 * 1000
}

function cleanDir(dir: string, retentionMs: number, label: string): { deleted: number; kept: number } {
  if (retentionMs < 0 || !fs.existsSync(dir)) return { deleted: 0, kept: 0 }
  const cutoff = Date.now() - retentionMs
  let deleted = 0
  let kept = 0

  try {
    for (const entry of fs.readdirSync(dir)) {
      const fullPath = path.join(dir, entry)
      try {
        const stat = fs.statSync(fullPath)
        if (stat.isFile() && stat.mtimeMs < cutoff) {
          fs.rmSync(fullPath, { force: true })
          deleted++
        } else {
          kept++
        }
      } catch {}
    }
  } catch {}

  return { deleted, kept }
}

function getDirSize(dir: string): number {
  if (!fs.existsSync(dir)) return 0
  let total = 0
  try {
    const walk = (d: string) => {
      for (const f of fs.readdirSync(d)) {
        const p = path.join(d, f)
        try {
          const stat = fs.statSync(p)
          if (stat.isDirectory()) { walk(p) } else { total += stat.size }
        } catch {}
      }
    }
    walk(dir)
  } catch {}
  return total
}

export const Parameters = Schema.Struct({
  action: Schema.Literal(
    "session", "browser", "sandbox", "status",
  ).annotate({
    description: "What to configure or check. session/browser/sandbox sets retention. status shows current settings.",
  }),
  days: Schema.optional(Schema.Literal("7", "30", "90", "180", "never")).annotate({
    description: "Retention period in days, or 'never' to keep indefinitely (default varies by type)",
  }),
})

export const CleanupTool = Tool.define(
  "cleanup",
  Effect.gen(function* () {
    return {
      description: DESCRIPTION,
      parameters: Parameters,
      jsonSchema: ToolJsonSchema.fromSchema(Parameters, { id: "cleanup" }),
      execute: (params: typeof Parameters.Type, _ctx: Tool.Context) =>
        Effect.gen(function* () {
          const cfg = loadRetention()

          if (params.action === "status") {
            const stateSize = getDirSize(STATE_DIR)
            const cacheSize = getDirSize(CACHE_DIR)
            const shareSize = getDirSize(SHARE_DIR)
            const totalMB = Math.round((stateSize + cacheSize + shareSize) / (1024 * 1024))

            const fmt = (d: number) => d < 0 ? "never" : `${d} days`

            return {
              title: "Cleanup",
              metadata: {},
              output: [
                "Retention Settings:",
                `  Session history:  ${fmt(cfg.sessionDays)}`,
                `  Browser profiles: ${fmt(cfg.browserDays)}`,
                `  Sandbox junk:     ${fmt(cfg.sandboxDays)}`,
                "",
                "Auto-cleanup (always on):",
                "  Tool truncation:  7 days",
                "  Model history:    7 days",
                "  Egress logs:      capped 1000 entries",
                "",
                "Disk usage:",
                `  State (histories): ${Math.round(stateSize / (1024 * 1024))} MB`,
                `  Cache (profiles):  ${Math.round(cacheSize / (1024 * 1024))} MB`,
                `  Share (vault+apps):${Math.round(shareSize / (1024 * 1024))} MB`,
                `  Total:             ${totalMB} MB`,
                "",
                "Set retention with: cleanup <session|browser|sandbox> <7|30|90|180|never>",
              ].join("\n"),
            }
          }

          if (params.days === undefined) {
            return { title: "Error", metadata: {}, output: `Specify days: cleanup ${params.action} <7|30|90|180|never>` }
          }

          const days = params.days === "never" ? -1 : parseInt(params.days)

          if (params.action === "session") {
            cfg.sessionDays = days
            saveRetention(cfg)
          } else if (params.action === "browser") {
            cfg.browserDays = days
            saveRetention(cfg)
          } else if (params.action === "sandbox") {
            cfg.sandboxDays = days
            saveRetention(cfg)
          }

          const fmt = days < 0 ? "never" : `${days} days`

          return {
            title: "Cleanup",
            metadata: {},
            output: [
              `Retention for ${params.action} set to ${fmt}.`,
              "",
              "This will take effect on the next auto-cleanup cycle (runs periodically).",
              "To apply immediately, restart S.P.A.R.T.A or wait for the next cycle.",
            ].join("\n"),
          }
        }).pipe(Effect.orDie),
    }
  }),
)

// Auto-cleanup runner — called at startup and periodically
export function runAutoCleanup(): { removed: number; errors: string[] } {
  const cfg = loadRetention()
  const errors: string[] = []
  let removed = 0

  // Model history: always 7 days
  const modelFile = path.join(STATE_DIR, "model.json")
  if (fs.existsSync(modelFile)) {
    try {
      const stat = fs.statSync(modelFile)
      if (Date.now() - stat.mtimeMs > 7 * 24 * 60 * 60 * 1000) {
        const data = JSON.parse(fs.readFileSync(modelFile, "utf-8"))
        if (data.recent && Array.isArray(data.recent)) {
          const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000
          data.recent = data.recent.filter((e: { timestamp?: number }) =>
            !e.timestamp || e.timestamp > cutoff
          )
          fs.writeFileSync(modelFile, JSON.stringify(data, null, 2))
          removed++
        }
      }
    } catch {}
  }

  // Session history
  const sessionsDir = path.join(STATE_DIR, "sessions")
  if (fs.existsSync(sessionsDir)) {
    const result = cleanDir(sessionsDir, daysToMs(cfg.sessionDays), "session")
    removed += result.deleted
  }

  // Browser profiles
  const browserDir = path.join(CACHE_DIR, "stealth-browser-profile")
  if (fs.existsSync(browserDir)) {
    const retention = daysToMs(cfg.browserDays)
    if (retention < 0) {
      // never — skip
    } else {
      const cutoff = Date.now() - retention
      try {
        const stat = fs.statSync(browserDir)
        if (stat.mtimeMs < cutoff) {
          fs.rmSync(browserDir, { recursive: true, force: true })
          removed++
        }
      } catch (e) { errors.push(String(e)) }
    }
  }

  // Sandbox recycle bin
  const recycleDir = path.join(SHARE_DIR, "sandbox", ".recycle")
  if (fs.existsSync(recycleDir)) {
    const retention = daysToMs(cfg.sandboxDays)
    if (retention >= 0) {
      for (const entry of fs.readdirSync(recycleDir)) {
        const fullPath = path.join(recycleDir, entry)
        try {
          const stat = fs.statSync(fullPath)
          if (stat.mtimeMs < Date.now() - retention) {
            fs.rmSync(fullPath, { recursive: true, force: true })
            removed++
          }
        } catch {}
      }
    }
  }

  return { removed, errors }
}
