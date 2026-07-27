import { Preservation } from "./preservation"
import { getRulesForIntensity } from "./prose-rules"
import { ValidationGate } from "./validation-gate"

export class ProseEngine {
  private intensity: string
  private minMessageLength: number
  private preservation: Preservation
  private gate: ValidationGate

  constructor(options: { intensity?: string; minMessageLength?: number } = {}) {
    this.intensity = options.intensity || "lite"
    this.minMessageLength = options.minMessageLength || 50
    this.preservation = new Preservation()
    this.gate = new ValidationGate()
  }

  compress(text: string, intensity?: string): string {
    if (!text) return text
    if (text.length < this.minMessageLength) return text

    const actualIntensity = intensity || this.intensity
    if (actualIntensity === "none") return text

    const preserved = this.preservation.extract(text)
    const rules = getRulesForIntensity(actualIntensity)

    let processed = preserved.text
    for (const rule of rules) {
      processed = processed.replace(rule.pattern, rule.replacement)
    }

    processed = processed
      .replace(/\s{3,}/g, "  ")
      .replace(/\n{4,}/g, "\n\n\n")
      .replace(/^\s+/gm, "")
      .replace(/\s+$/gm, "")
      .trim()

    const restored = this.preservation.restore(processed, preserved.blocks)

    const validation = this.gate.validate(text, restored)
    if (!validation.passed) {
      return text
    }

    return restored
  }
}
