import fs from "fs"
import path from "path"
import os from "os"

const EGRESS_DIR = path.join(os.homedir(), ".local", "share", "sparta", "egress")
const LOG_FILE = path.join(EGRESS_DIR, "connections.json")
const ALLOWED_DOMAINS = [
  "api.openai.com", "api.anthropic.com", "api.groq.com",
  "openrouter.ai", "api.deepseek.com", "api.github.com",
  "raw.githubusercontent.com", "registry.npmjs.org",
  "www.npmjs.com", "api.npmjs.org", "github.com",
  "opencode.ai", "console.opencode.ai", "models.dev",
  "127.0.0.1", "localhost",
]

export interface EgressEvent {
  timestamp: number
  destination: string
  port: number
  protocol: "http" | "https" | "tcp" | "udp"
  allowed: boolean
  reason: string
  process?: string
}

export class EgressGuard {
  private log: EgressEvent[] = []
  private maxLogSize: number = 1000
  private allowedDomains: Set<string>

  constructor(customDomains?: string[]) {
    this.allowedDomains = new Set([...ALLOWED_DOMAINS, ...(customDomains || [])])
    if (!fs.existsSync(EGRESS_DIR)) fs.mkdirSync(EGRESS_DIR, { recursive: true })
    this.loadLog()
  }

  private loadLog(): void {
    try {
      if (fs.existsSync(LOG_FILE)) {
        this.log = JSON.parse(fs.readFileSync(LOG_FILE, "utf-8"))
      }
    } catch {
      this.log = []
    }
  }

  private saveLog(): void {
    try {
      const recent = this.log.slice(-this.maxLogSize)
      fs.writeFileSync(LOG_FILE, JSON.stringify(recent, null, 2))
    } catch {}
  }

  check(destination: string, port: number = 443, protocol: "http" | "https" | "tcp" | "udp" = "https"): EgressEvent {
    const hostname = destination.toLowerCase().replace(/^https?:\/\//, "").split("/")[0].split(":")[0]

    let allowed = false
    let reason = ""

    for (const domain of this.allowedDomains) {
      if (hostname === domain || hostname.endsWith("." + domain)) {
        allowed = true
        reason = `Domain ${hostname} is in allowed list`
        break
      }
    }

    if (!allowed) {
      reason = `Domain ${hostname} is not in allowed list`
    }

    if (hostname === "127.0.0.1" || hostname === "localhost") {
      allowed = true
      reason = "Localhost connection"
    }

    const event: EgressEvent = {
      timestamp: Date.now(),
      destination: hostname,
      port,
      protocol,
      allowed,
      reason,
    }

    this.log.push(event)
    if (this.log.length > this.maxLogSize * 2) {
      this.log = this.log.slice(-this.maxLogSize)
    }
    this.saveLog()

    return event
  }

  allowDomain(domain: string): void {
    this.allowedDomains.add(domain.toLowerCase())
  }

  removeDomain(domain: string): void {
    this.allowedDomains.delete(domain.toLowerCase())
  }

  getAllowedDomains(): string[] {
    return [...this.allowedDomains]
  }

  getLog(count?: number): EgressEvent[] {
    const entries = [...this.log].reverse()
    return count ? entries.slice(0, count) : entries
  }
}
