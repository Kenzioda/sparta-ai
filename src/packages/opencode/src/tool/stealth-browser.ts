import * as Tool from "./tool"
import DESCRIPTION from "./stealth-browser.txt"
import { ToolJsonSchema } from "./json-schema"
import { Effect, Schema } from "effect"
import { spawn, execSync } from "child_process"
import { MCP } from "@/mcp"
import { Config } from "@/config/config"

let client: import("@modelcontextprotocol/sdk/client/index.js").Client | null = null
let serverProcess: import("child_process").ChildProcess | null = null
let connected = false

function findCamofox(): string | null {
  const candidates = [
    process.env.CAMOFOX_PATH,
    process.env.STEALTH_BROWSER_PATH,
    "camofox",
    "npx camofox",
    "bunx camofox",
  ].filter(Boolean) as string[]

  for (const cmd of candidates) {
    try {
      const [bin, ...rest] = cmd.split(" ")
      if (bin === "camofox" || bin === "npx" || bin === "bunx") {
        execSync(`${process.platform === "win32" ? "where" : "which"} ${bin} 2>nul`, {
          encoding: "utf-8", timeout: 3000,
        })
        return cmd
      }
    } catch {}
  }
  return null
}

async function connectCamofox(): Promise<void> {
  if (connected) return

  const { Client } = await import("@modelcontextprotocol/sdk/client/index.js")
  const { StdioClientTransport } = await import("@modelcontextprotocol/sdk/client/stdio.js")

  const camofoxCmd = findCamofox()
  if (!camofoxCmd) {
    throw new Error(
      "camofox MCP not found. Install it with: npm install -g @agentclientprotocol/sdk  # or your package manager\n" +
      "Then ensure 'camofox' is available in your PATH, or set CAMOFOX_PATH env variable.",
    )
  }

  const [cmd, ...args] = camofoxCmd.split(" ")
  const transport = new StdioClientTransport({
    command: cmd,
    args,
  })

  client = new Client({
    name: "stealth-browser",
    version: "1.0.0",
  })

  await client.connect(transport)
  connected = true
}

async function closeCamofox(): Promise<void> {
  if (client) {
    try { await client.close() } catch {}
    client = null
  }
  if (serverProcess) {
    serverProcess.kill()
    serverProcess = null
  }
  connected = false
}

async function camofoxCall(name: string, args: Record<string, unknown> = {}): Promise<unknown> {
  if (!client || !connected) throw new Error("Stealth Browser not connected. Call navigate first.")
  const result = await client.callTool({ name, arguments: args })
  return result.content
}

export const Parameters = Schema.Struct({
  action: Schema.Literal("navigate", "snapshot", "screenshot", "click", "type", "evaluate", "html", "close", "gui").annotate({
    description: "Browser action. 'gui' toggles between headless and visible mode (use when 2FA or manual interaction is needed).",
  }),
  url: Schema.optional(Schema.String).annotate({
    description: "URL to navigate to (required for navigate action)",
  }),
  selector: Schema.optional(Schema.String).annotate({
    description: "CSS selector or element ref for click/type/snapshot actions",
  }),
  text: Schema.optional(Schema.String).annotate({
    description: "Text to type (required for type action)",
  }),
  code: Schema.optional(Schema.String).annotate({
    description: "JavaScript code to evaluate (required for evaluate action)",
  }),
})

export const StealthBrowserTool = Tool.define(
  "stealth_browser",
  Effect.gen(function* () {
    const mcp = yield* MCP.Service
    const cfg = yield* Config.Service

    const execute = Effect.fn("StealthBrowser.execute")(function* (
      params: typeof Parameters.Type,
      ctx: Tool.Context,
    ) {
      yield* ctx.ask({ permission: "stealth_browser", patterns: ["*"] })

      const run = Effect.fn("StealthBrowser.action")(function* () {
        try {
          if (params.action === "close") {
            yield* Effect.promise(() => closeCamofox())
            return { title: "Stealth Browser", metadata: {}, output: "Browser closed." }
          }

          yield* Effect.promise(() => connectCamofox())

          switch (params.action) {
            case "navigate": {
              if (!params.url) return { title: "Error", metadata: {}, output: "url is required for navigate" }
              const result = yield* Effect.promise(() =>
                camofoxCall("navigate", { url: params.url }),
              )
              return {
                title: "Stealth Browser",
                metadata: {},
                output: typeof result === "string" ? result : JSON.stringify(result),
              }
            }

            case "snapshot": {
              const result = yield* Effect.promise(() =>
                camofoxCall("snapshot", params.selector ? { selector: params.selector } : {}),
              )
              return {
                title: "Stealth Browser",
                metadata: {},
                output: typeof result === "string" ? result : JSON.stringify(result),
              }
            }

            case "screenshot": {
              const result = yield* Effect.promise(() => camofoxCall("screenshot"))
              return {
                title: "Stealth Browser",
                metadata: {},
                output: typeof result === "string" ? result : JSON.stringify(result),
              }
            }

            case "click": {
              if (!params.selector) return { title: "Error", metadata: {}, output: "selector is required for click" }
              const result = yield* Effect.promise(() =>
                camofoxCall("click", { selector: params.selector }),
              )
              return {
                title: "Stealth Browser",
                metadata: {},
                output: typeof result === "string" ? result : JSON.stringify(result),
              }
            }

            case "type": {
              if (!params.selector || !params.text) {
                return { title: "Error", metadata: {}, output: "selector and text are required for type" }
              }
              const result = yield* Effect.promise(() =>
                camofoxCall("type", { selector: params.selector, text: params.text }),
              )
              return {
                title: "Stealth Browser",
                metadata: {},
                output: typeof result === "string" ? result : JSON.stringify(result),
              }
            }

            case "evaluate": {
              if (!params.code) return { title: "Error", metadata: {}, output: "code is required for evaluate" }
              const result = yield* Effect.promise(() =>
                camofoxCall("evaluate", { expression: params.code }),
              )
              return {
                title: "Stealth Browser",
                metadata: {},
                output: typeof result === "string" ? result : JSON.stringify(result),
              }
            }

            case "html": {
              const result = yield* Effect.promise(() => camofoxCall("html"))
              return {
                title: "Stealth Browser",
                metadata: {},
                output: typeof result === "string" ? result : JSON.stringify(result),
              }
            }

            case "gui": {
              const current = yield* Effect.promise(() => camofoxCall("toggle_display", { headless: false }))
              return {
                title: "Stealth Browser",
                metadata: {},
                output: "Stealth Browser switched to GUI mode. A browser window should appear.\nComplete the required interaction, then run stealth_browser action=gui again to return to headless mode.\n\nWhen 2FA or manual sign-in is needed, the AI will prompt you before switching to GUI mode.",
              }
            }

            default:
              return { title: "Error", metadata: {}, output: `Unknown action: ${params.action}` }
          }
        } catch (err) {
          return {
            title: "Stealth Browser Error",
            metadata: {},
            output: `Error: ${(err as Error).message}\n\nStealth Browser uses camofox MCP. Ensure camofox is installed and available in PATH.`,
          }
        }
      })

      return yield* run
    })

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      jsonSchema: ToolJsonSchema.fromSchema(Parameters, { id: "stealth_browser" }),
      execute: (params: typeof Parameters.Type, ctx: Tool.Context) =>
        execute(params, ctx).pipe(Effect.orDie),
    }
  }),
)

export const StealthBrowserToolClose = Tool.define(
  "stealth_browser_close",
  Effect.gen(function* () {
    return {
      description: "Close the stealth browser to free resources.",
      parameters: Schema.Struct({}),
      execute: () =>
        Effect.gen(function* () {
          yield* Effect.promise(() => closeCamofox())
          return { title: "Stealth Browser", metadata: {}, output: "Browser closed." }
        }).pipe(Effect.orDie),
    }
  }),
)
