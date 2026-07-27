export class Deduplicator {
  private defaultThreshold: number

  constructor(options: { defaultThreshold?: number } = {}) {
    this.defaultThreshold = options.defaultThreshold ?? 3
  }

  deduplicate(text: string, threshold?: number): string {
    if (!text) return text
    const actualThreshold = threshold ?? this.defaultThreshold
    const lines = text.split("\n")
    const result: string[] = []
    let streak = 0
    let lastLine: string | null = null
    for (const line of lines) {
      if (line === lastLine) {
        streak++
        if (streak <= 2) result.push(line)
      } else {
        if (streak > actualThreshold && lastLine !== null) {
          result.push(`  ... [${streak - 2} duplicate lines omitted]`)
        }
        streak = 1
        lastLine = line
        result.push(line)
      }
    }
    if (streak > actualThreshold && lastLine !== null) {
      const idx = result.lastIndexOf(lastLine)
      if (idx >= 0 && result.filter((l) => l === lastLine).length <= 2) {
        result.push(`  ... [${streak - 2} duplicate lines omitted]`)
      }
    }
    return result.join("\n")
  }
}
