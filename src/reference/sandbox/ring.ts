const TIERS = [
  { level: -1, label: "Hypervisor", description: "Kernel-level ops: full disk access, firmware" },
  { level: 0, label: "Kernel", description: "Core system: process spawn, network, file system" },
  { level: 1, label: "Device", description: "Peripheral: USB, Bluetooth, camera, mic" },
  { level: 2, label: "IO", description: "Input/output: display, keyboard, clipboard" },
  { level: 3, label: "User", description: "Normal: sandbox tools, browsing, file read/write within project" },
]

const OPERATION_TIERS: Record<string, number> = {
  shell: 0,
  edit: 1,
  write: 1,
  read: 2,
  glob: 2,
  grep: 2,
  stealth_browser: 2,
  sandbox_install: 0,
  sandbox_start: 0,
  sandbox_stop: 0,
  sandbox_persist: 0,
  vault_encrypt: 1,
  vault_decrypt: 0,
  egress_allow: 0,
  question: 3,
}

export interface RingCheckResult {
  allowed: boolean
  reason?: string
  currentTier: number
  requiredTier: number
}

export class DeviceRingGuard {
  private currentTier: number = 3
  private auditLog: { operation: string; requiredTier: number; verdict: string; context: string; timestamp: number }[] = []
  private maxLogSize: number = 500

  getCurrentTier(): { level: number; label: string } {
    const tier = TIERS.find((t) => t.level === this.currentTier) || TIERS[TIERS.length - 1]
    return { level: tier.level, label: tier.label }
  }

  setTier(level: number): void {
    const valid = TIERS.find((t) => t.level === level)
    if (!valid) throw new Error(`Invalid ring tier: ${level}`)
    this.currentTier = level
  }

  getRequiredTier(operation: string): number {
    for (const [key, tier] of Object.entries(OPERATION_TIERS)) {
      if (operation.startsWith(key)) return tier
    }
    return 3
  }

  check(operation: string, context: string = ""): RingCheckResult {
    const requiredTier = this.getRequiredTier(operation)

    const allowed = this.currentTier >= requiredTier
    const verdict = allowed ? "allow" : "deny"

    this.auditLog.push({
      operation,
      requiredTier,
      verdict,
      context,
      timestamp: Date.now(),
    })
    if (this.auditLog.length > this.maxLogSize) this.auditLog.shift()

    if (allowed) return { allowed: true, currentTier: this.currentTier, requiredTier }

    const current = TIERS.find((t) => t.level === this.currentTier)
    const required = TIERS.find((t) => t.level === requiredTier)
    return {
      allowed: false,
      reason: `Ring tier ${current?.label || this.currentTier} (level ${this.currentTier}) is below required ${required?.label || requiredTier} (level ${requiredTier}) for operation "${operation}"`,
      currentTier: this.currentTier,
      requiredTier,
    }
  }

  getAuditLog(count?: number): typeof this.auditLog {
    const entries = [...this.auditLog].reverse()
    return count ? entries.slice(0, count) : entries
  }

  escalate(context: string = ""): { allowed: boolean; reason?: string } {
    const result = this.check("escalate", context)
    if (!result.allowed && this.currentTier > 0) {
      this.currentTier = Math.max(0, this.currentTier - 1)
      return { allowed: true, reason: `Escalated to tier ${this.currentTier}` }
    }
    return result.allowed
      ? { allowed: true }
      : { allowed: false, reason: "Already at maximum privilege level" }
  }
}
