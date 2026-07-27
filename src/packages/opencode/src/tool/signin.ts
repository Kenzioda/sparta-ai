import * as Tool from "./tool"
import DESCRIPTION from "./signin.txt"
import { ToolJsonSchema } from "./json-schema"
import { Effect, Schema } from "effect"
import { Vault } from "../sandbox/vault"
import path from "path"
import fs from "fs"
import os from "os"

interface ProviderInfo {
  id: string
  name: string
  models: string
  signupUrl: string
  steps: string[]
  requires2fa: boolean
}

const PROVIDERS: Record<string, ProviderInfo> = {
  google: {
    id: "google",
    name: "Google Gemini",
    models: "gemini-2.0-flash, gemini-1.5-pro",
    signupUrl: "https://aistudio.google.com/apikey",
    steps: [
      "stealth_browser action=navigate url=https://aistudio.google.com/apikey",
      "stealth_browser action=screenshot  (to see the page)",
      "Sign in with your Google account (if not already signed in)",
      "stealth_browser action=screenshot  (to see the API key page)",
      "Click 'Create API Key' or copy an existing key",
      "Run: /signin google key=AIza...  (paste the key)",
    ],
    requires2fa: true,
  },
  groq: {
    id: "groq",
    name: "Groq",
    models: "llama-3.3-70b, mixtral-8x7b, gemma2-9b, deepseek-r1-distill",
    signupUrl: "https://console.groq.com/keys",
    steps: [
      "stealth_browser action=navigate url=https://console.groq.com/keys",
      "stealth_browser action=screenshot  (to see the page)",
      "Sign in with Google/GitHub/Email (2FA may be required)",
      "stealth_browser action=screenshot  (to see the keys page)",
      "Copy an existing API key or create a new one",
      "Run: /signin groq key=gsk_...  (paste the key)",
    ],
    requires2fa: true,
  },
  openrouter: {
    id: "openrouter",
    name: "OpenRouter",
    models: "multiple open-source models, some free tier",
    signupUrl: "https://openrouter.ai/keys",
    steps: [
      "stealth_browser action=navigate url=https://openrouter.ai/keys",
      "stealth_browser action=screenshot  (to see the page)",
      "Sign in (Google/GitHub/Email)",
      "stealth_browser action=screenshot  (to see the keys page)",
      "Copy your API key",
      "Run: /signin openrouter key=sk-or-...  (paste the key)",
    ],
    requires2fa: false,
  },
  github: {
    id: "github",
    name: "GitHub Models",
    models: "limited free tier for open-source models",
    signupUrl: "https://github.com/marketsplace/models",
    steps: [
      "stealth_browser action=navigate url=https://github.com/settings/tokens",
      "stealth_browser action=screenshot",
      "Generate a classic token with 'read:packages' scope",
      "Run: /signin github key=ghp_...  (paste the token)",
    ],
    requires2fa: true,
  },
}

const KEY_MAP: Record<string, string> = {
  google: "google_gemini_key",
  groq: "groq_api_key",
  openrouter: "openrouter_api_key",
  github: "github_token",
}

const CONFIG_PATHS = [
  path.join(os.homedir(), ".config", "sparta", "opencode.jsonc"),
  path.join(os.homedir(), ".config", "opencode.jsonc"),
  path.join(os.homedir(), ".opencode", "opencode.jsonc"),
  path.join(process.cwd(), ".opencode", "opencode.jsonc"),
  path.join(process.cwd(), "opencode.jsonc"),
]

function findOrCreateConfig(): string {
  for (const p of CONFIG_PATHS) {
    try { if (fs.existsSync(p)) return p } catch {}
  }
  const configDir = path.join(os.homedir(), ".config", "sparta")
  if (!fs.existsSync(configDir)) fs.mkdirSync(configDir, { recursive: true })
  const defaultPath = path.join(configDir, "opencode.jsonc")
  if (!fs.existsSync(defaultPath)) {
    fs.writeFileSync(defaultPath, JSON.stringify({ $schema: "https://opencode.ai/config.json", provider: {} }, null, 2))
  }
  return defaultPath
}

function writeProviderKey(providerId: string, key: string): void {
  const configPath = findOrCreateConfig()
  let config: Record<string, unknown> = {}
  try {
    config = JSON.parse(fs.readFileSync(configPath, "utf-8"))
  } catch {
    config = { $schema: "https://opencode.ai/config.json", provider: {} }
  }
  if (!config.provider) config.provider = {}
  const provider = config.provider as Record<string, unknown>
  if (!provider[providerId]) provider[providerId] = {}
  const providerCfg = provider[providerId] as Record<string, unknown>
  providerCfg.apiKey = key
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
}

function removeProvider(providerId: string): void {
  const vault = new Vault()
  const keyName = KEY_MAP[providerId]
  if (keyName) vault.delete(keyName)

  const configPath = findOrCreateConfig()
  try {
    const raw = fs.readFileSync(configPath, "utf-8")
    const config = JSON.parse(raw)
    if (config.provider?.[providerId]) {
      delete config.provider[providerId]
      fs.writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
    }
  } catch {}
}

function getStoredProviders(): string[] {
  const vault = new Vault()
  return Object.keys(KEY_MAP).filter((id) => vault.get(KEY_MAP[id]))
}

function getProviderInfo(providerId: string): string {
  const info = PROVIDERS[providerId]
  if (!info) return `Unknown provider: ${providerId}. Available: ${Object.keys(PROVIDERS).join(", ")}`

  const vault = new Vault()
  const hasKey = vault.get(KEY_MAP[providerId])

  return [
    `${hasKey ? "✓" : "○"} ${info.name}`,
    `  Models: ${info.models}`,
    `  Signup: ${info.signupUrl}`,
    `  2FA: ${info.requires2fa ? "Yes (stealth-browser will ask for GUI mode)" : "No"}`,
    hasKey ? "  Status: Connected" : "  Status: Not connected",
    "",
    hasKey ? "To reconnect:" : "To connect:",
    ...info.steps.map((s) => `  ${s}`),
  ].join("\n")
}

export const Parameters = Schema.Struct({
  action: Schema.optional(Schema.Literal("google", "groq", "openrouter", "github", "status", "disconnect")).annotate({
    description: "Provider to set up, 'status' to show connections, 'disconnect' to remove credentials",
  }),
  key: Schema.optional(Schema.String).annotate({
    description: "API key to store (example: /signin google key=AIzaSy...)",
  }),
})

export const SignInTool = Tool.define(
  "signin",
  Effect.gen(function* () {
    const vault = new Vault()

    const execute = Effect.fn("SignIn.execute")(function* (
      params: typeof Parameters.Type,
      ctx: Tool.Context,
    ) {
      const action = params.action || "status"

      if (action === "status") {
        const connected = getStoredProviders()
        const lines: string[] = [
          "Available free-tier providers:",
          "━━━━━━━━━━━━━━━━━━━━━━━━━━━",
        ]
        for (const [id, info] of Object.entries(PROVIDERS)) {
          const hasKey = vault.get(KEY_MAP[id])
          lines.push(`  ${hasKey ? "✓" : "○"} ${info.name.padEnd(20)} ${info.models}`)
        }
        lines.push("")
        if (connected.length === 0) {
          lines.push("No accounts connected yet.")
          lines.push("Run /signin <provider> to see setup instructions for that provider.")
          lines.push("Example: /signin google")
        } else {
          lines.push(`Connected: ${connected.join(", ")}`)
        }
        lines.push("")
        lines.push("The AI can autonomously walk you through each signup using stealth_browser.")
        lines.push("When 2FA is required, stealth_browser will switch to GUI mode so you can interact.")
        return { title: "Sign-In Status", metadata: {}, output: lines.join("\n") }
      }

      if (action === "disconnect") {
        for (const id of Object.keys(KEY_MAP)) removeProvider(id)
        return {
          title: "Sign-In",
          metadata: {},
          output: "All credentials removed from vault and config.",
        }
      }

      const provider = PROVIDERS[action]
      if (!provider) {
        return {
          title: "Error",
          metadata: {},
          output: `Unknown provider: ${action}. Available: ${Object.keys(PROVIDERS).join(", ")}`,
        }
      }

      if (params.key) {
        const key = params.key.trim()
        vault.set(KEY_MAP[action], key)
        writeProviderKey(action, key)
        return {
          title: "Sign-In",
          metadata: {},
          output: [
            `✓ ${provider.name} API key stored securely.`,
            `Models now available: ${provider.models}`,
            "",
            "The Sparta Agent will automatically use these models",
            "based on task complexity. They appear in the provider dialog under 'Free Tier'.",
          ].join("\n"),
        }
      }

      const existingKey = vault.get(KEY_MAP[action])
      if (existingKey) {
        writeProviderKey(action, existingKey)
        return {
          title: "Sign-In",
          metadata: {},
          output: [
            `✓ ${provider.name} credentials found in vault and re-activated.`,
            `Models: ${provider.models}`,
          ].join("\n"),
        }
      }

      const setupGuide = getProviderInfo(action)
      return { title: `Sign-In: ${provider.name}`, metadata: {}, output: setupGuide }
    })

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      jsonSchema: ToolJsonSchema.fromSchema(Parameters, { id: "signin" }),
      execute: (params: typeof Parameters.Type, ctx: Tool.Context) =>
        execute(params, ctx).pipe(Effect.orDie),
    }
  }),
)
