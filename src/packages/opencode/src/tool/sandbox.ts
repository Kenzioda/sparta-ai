import * as Tool from "./tool"
import DESCRIPTION from "./sandbox.txt"
import { ToolJsonSchema } from "./json-schema"
import { Effect, Schema } from "effect"
import { SandboxManager, createSandboxManager } from "../sandbox/manager"
import { DeviceRingGuard } from "../sandbox/ring"
import { Vault } from "../sandbox/vault"
import { EgressGuard } from "../sandbox/egress"

let manager: SandboxManager | null = null
let vault: Vault | null = null
let egress: EgressGuard | null = null
let ring: DeviceRingGuard | null = null

function getManager(): SandboxManager {
  if (!manager) {
    ring = new DeviceRingGuard()
    manager = createSandboxManager(ring)
  }
  return manager
}

function getVault(): Vault {
  if (!vault) vault = new Vault()
  return vault
}

function getEgress(): EgressGuard {
  if (!egress) egress = new EgressGuard()
  return egress
}

export const Parameters = Schema.Struct({
  action: Schema.Literal(
    "install", "uninstall", "start", "stop", "restart", "list", "status", "persist",
    "recycle_list", "recycle_restore", "recycle_purge",
    "bridge_start", "bridge_stop",
    "vault_set", "vault_get", "vault_list", "vault_delete",
    "egress_check", "egress_log",
    "ring_status", "ring_set",
  ).annotate({
    description: "Sandbox action. recycle actions manage the Recycle Bin. bridge_start launches HTTP↔MCP bridge.",
  }),
  name: Schema.optional(Schema.String).annotate({
    description: "App name (required for install/uninstall/start/stop/status/persist/vault_set/vault_get/vault_delete)",
  }),
  type: Schema.optional(Schema.Literal("npm", "binary", "git")).annotate({
    description: "Install type (default: npm). Only used with install action.",
  }),
  source: Schema.optional(Schema.String).annotate({
    description: "Source package name/URL for install, or value for vault_set",
  }),
  enabled: Schema.optional(Schema.Boolean).annotate({
    description: "Enable/disable persistence (used with persist action)",
  }),
  destination: Schema.optional(Schema.String).annotate({
    description: "Destination for egress check",
  }),
  port: Schema.optional(Schema.Number).annotate({
    description: "Port for egress check or bridge port for bridge_start (default: 9128)",
  }),
  tier: Schema.optional(Schema.Number).annotate({
    description: "Ring tier level for ring_set (-1 to 3)",
  }),
})

export const SandboxTool = Tool.define(
  "sandbox",
  Effect.gen(function* () {
    const execute = Effect.fn("Sandbox.execute")(function* (
      params: typeof Parameters.Type,
      ctx: Tool.Context,
    ) {
      yield* ctx.ask({ permission: "sandbox", patterns: ["*"] })

      const run = Effect.fn("Sandbox.action")(function* () {
        try {
          switch (params.action) {
            case "install": {
              if (!params.name) return { title: "Error", metadata: {}, output: "name is required for install" }
              const m = getManager()
              const app = m.install(params.name, params.type || "npm", params.source)
              return {
                title: "Sandbox",
                metadata: {},
                output: `Installed ${params.name} (${params.type || "npm"}) in ${app.dir}`,
              }
            }

            case "uninstall": {
              if (!params.name) return { title: "Error", metadata: {}, output: "name is required for uninstall" }
              getManager().uninstall(params.name)
              return { title: "Sandbox", metadata: {}, output: `Uninstalled ${params.name} (moved to recycle bin).\nUndo: sandbox recycle_restore name=${params.name}\nPermanent: sandbox uninstall will auto-purge after retention period.` }
            }

            case "start": {
              if (!params.name) return { title: "Error", metadata: {}, output: "name is required for start" }
              const result = getManager().start(params.name)
              return { title: "Sandbox", metadata: {}, output: `${params.name}: ${result.status}${result.pid ? ` (pid ${result.pid})` : ""}` }
            }

            case "stop": {
              if (!params.name) return { title: "Error", metadata: {}, output: "name is required for stop" }
              const result = getManager().stop(params.name)
              return { title: "Sandbox", metadata: {}, output: `${params.name}: ${result.status}` }
            }

            case "restart": {
              if (!params.name) return { title: "Error", metadata: {}, output: "name is required for restart" }
              const result = getManager().restart(params.name)
              return { title: "Sandbox", metadata: {}, output: `${params.name}: ${result.status}` }
            }

            case "bridge_start": {
              const port = params.port || 9128
              try {
                const result = getManager().startBridge(port)
                return {
                  title: "Bridge",
                  metadata: {},
                  output: `HTTP↔MCP bridge started on port ${port} (pid ${result.pid}).\nActivepieces workflows can now call stealth_browser via POST http://127.0.0.1:${port}\nBody: { "action": "navigate", "params": { "url": "..." } }`,
                }
              } catch (err) {
                return { title: "Bridge Error", metadata: {}, output: `Error: ${(err as Error).message}\nEnsure camofox is installed and in PATH.` }
              }
            }

            case "bridge_stop": {
              const result = getManager().stopBridge()
              return { title: "Bridge", metadata: {}, output: `Bridge: ${result.status}` }
            }

            case "list": {
              const apps = getManager().list()
              if (apps.length === 0) return { title: "Sandbox", metadata: {}, output: "No apps installed." }
              const lines = apps.map((a) =>
                `  ${a.name.padEnd(20)} ${a.type.padEnd(8)} ${a.running ? "RUNNING".padEnd(10) : "stopped".padEnd(10)} ${a.persistent ? "persistent".padEnd(12) : "on-demand".padEnd(12)} ${a.restartCount ? `${a.restartCount} restarts` : ""}`
              )
              return { title: "Sandbox", metadata: {}, output: `Installed apps:\n${lines.join("\n")}` }
            }

            case "status": {
              if (!params.name) return { title: "Error", metadata: {}, output: "name is required for status" }
              const app = getManager().status(params.name)
              if (!app) return { title: "Sandbox", metadata: {}, output: `App '${params.name}' not found` }
              return {
                title: "Sandbox", metadata: {},
                output: [
                  `Name: ${app.name}`,
                  `Type: ${app.type}`,
                  `Source: ${app.source}`,
                  `Installed: ${new Date(app.installedAt).toISOString()}`,
                  `Running: ${app.running}`,
                  `Persistent: ${app.persistent}`,
                  app.restartCount ? `Restarts: ${app.restartCount}` : "",
                  app.pid ? `PID: ${app.pid}` : "",
                  app.startedAt ? `Started: ${new Date(app.startedAt).toISOString()}` : "",
                ].filter(Boolean).join("\n"),
              }
            }

            case "persist": {
              if (!params.name) return { title: "Error", metadata: {}, output: "name is required for persist" }
              getManager().setPersistent(params.name, params.enabled ?? true)
              return { title: "Sandbox", metadata: {}, output: `${params.name}: persistence set to ${params.enabled ?? true}` }
            }

            case "recycle_list": {
              const items = getManager().recycleList()
              if (items.length === 0) return { title: "Recycle Bin", metadata: {}, output: "Recycle bin is empty." }
              const lines = items.map((i) => `  ${i.name.padEnd(20)} moved ${i.movedAt.toISOString().slice(0, 10)}`)
              return { title: "Recycle Bin", metadata: {}, output: `Recycled items:\n${lines.join("\n")}\n\nRestore with: sandbox recycle_restore name=<name>\nPurge all with: sandbox recycle_purge` }
            }

            case "recycle_restore": {
              if (!params.name) return { title: "Error", metadata: {}, output: "name is required for recycle_restore" }
              getManager().recycleRestore(params.name)
              return { title: "Recycle Bin", metadata: {}, output: `Restored ${params.name} from recycle bin.` }
            }

            case "recycle_purge": {
              const count = getManager().recyclePurge()
              return { title: "Recycle Bin", metadata: {}, output: `Purged ${count} items from recycle bin.` }
            }

            case "vault_set": {
              if (!params.name || !params.source) return { title: "Error", metadata: {}, output: "name and source are required for vault_set" }
              getVault().set(params.name, params.source)
              return { title: "Vault", metadata: {}, output: `Stored credential: ${params.name}` }
            }

            case "vault_get": {
              if (!params.name) return { title: "Error", metadata: {}, output: "name is required for vault_get" }
              const val = getVault().get(params.name)
              return { title: "Vault", metadata: {}, output: val ? `${params.name}: ${val}` : `Credential '${params.name}' not found` }
            }

            case "vault_list": {
              const keys = getVault().list()
              if (keys.length === 0) return { title: "Vault", metadata: {}, output: "No credentials stored." }
              return { title: "Vault", metadata: {}, output: `Stored credentials:\n  ${keys.join("\n  ")}` }
            }

            case "vault_delete": {
              if (!params.name) return { title: "Error", metadata: {}, output: "name is required for vault_delete" }
              getVault().delete(params.name)
              return { title: "Vault", metadata: {}, output: `Deleted credential: ${params.name}` }
            }

            case "egress_check": {
              if (!params.destination) return { title: "Error", metadata: {}, output: "destination is required for egress_check" }
              const result = getEgress().check(params.destination, params.port || 443)
              return {
                title: "Egress", metadata: {},
                output: `Destination: ${result.destination}:${result.port}\nAllowed: ${result.allowed}\nReason: ${result.reason}`,
              }
            }

            case "egress_log": {
              const log = getEgress().getLog(params.name ? parseInt(params.name) : undefined)
              if (log.length === 0) return { title: "Egress", metadata: {}, output: "No egress events logged." }
              const lines = log.slice(0, 20).map((e) =>
                `  ${e.allowed ? "ALLOW" : "DENY "} ${e.destination}:${e.port} (${e.protocol}) — ${e.reason}`
              )
              return { title: "Egress", metadata: {}, output: `Recent egress events:\n${lines.join("\n")}${log.length > 20 ? `\n  ... ${log.length - 20} more` : ""}` }
            }

            case "ring_status": {
              const r = ring || new DeviceRingGuard()
              const current = r.getCurrentTier()
              const log = r.getAuditLog(params.name ? parseInt(params.name) : 5)
              const logLines = log.map((e) => `  ${e.verdict.padEnd(6)} ${e.operation.padEnd(20)} T${e.requiredTier}`)
              return {
                title: "Device Ring", metadata: {},
                output: [
                  `Current Tier: ${current.label} (level ${current.level})`,
                  `Recent checks:`,
                  ...logLines,
                ].join("\n"),
              }
            }

            case "ring_set": {
              const r = ring || new DeviceRingGuard()
              r.setTier(params.tier ?? 3)
              const t = r.getCurrentTier()
              return { title: "Device Ring", metadata: {}, output: `Ring tier set to ${t.label} (level ${t.level})` }
            }

            default:
              return { title: "Error", metadata: {}, output: `Unknown action: ${params.action}` }
          }
        } catch (err) {
          return { title: "Sandbox Error", metadata: {}, output: `Error: ${(err as Error).message}` }
        }
      })

      return yield* run
    })

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      jsonSchema: ToolJsonSchema.fromSchema(Parameters, { id: "sandbox" }),
      execute: (params: typeof Parameters.Type, ctx: Tool.Context) =>
        execute(params, ctx).pipe(Effect.orDie),
    }
  }),
)
