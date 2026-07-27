export class SmartTruncate {
  private defaultHeadLines: number
  private defaultTailLines: number
  private defaultMaxLines: number
  private defaultPriorityPatterns: string[]

  constructor(options: {
    defaultHeadLines?: number
    defaultTailLines?: number
    defaultMaxLines?: number
    defaultPriorityPatterns?: string[]
  } = {}) {
    this.defaultHeadLines = options.defaultHeadLines ?? 20
    this.defaultTailLines = options.defaultTailLines ?? 20
    this.defaultMaxLines = options.defaultMaxLines ?? 120
    this.defaultPriorityPatterns = options.defaultPriorityPatterns ?? ["error:", "Error:", "fail", "exception"]
  }

  truncate(
    text: string,
    options: {
      headLines?: number
      tailLines?: number
      maxLines?: number
      priorityPatterns?: string[]
    } = {},
  ): string {
    if (!text) return text
    const head = options.headLines ?? this.defaultHeadLines
    const tail = options.tailLines ?? this.defaultTailLines
    const maxLines = options.maxLines ?? this.defaultMaxLines
    const priorityPatterns = options.priorityPatterns || this.defaultPriorityPatterns

    const lines = text.split("\n")
    if (lines.length <= maxLines) return text

    const priorityIndices: number[] = []
    for (let i = 0; i < lines.length; i++) {
      for (const pat of priorityPatterns) {
        try {
          const re = new RegExp(pat, "i")
          if (re.test(lines[i])) {
            priorityIndices.push(i)
            break
          }
        } catch {
          if (lines[i].toLowerCase().includes(pat.toLowerCase())) {
            priorityIndices.push(i)
            break
          }
        }
      }
    }

    const preserved = new Set<number>()
    for (let i = 0; i < head && i < lines.length; i++) preserved.add(i)
    for (let i = Math.max(0, lines.length - tail); i < lines.length; i++) preserved.add(i)
    for (const idx of priorityIndices) {
      if (idx >= head && idx < lines.length - tail) {
        preserved.add(idx)
        if (idx + 1 < lines.length) preserved.add(idx + 1)
      }
    }

    const sortedPreserved = [...preserved].sort((a, b) => a - b)
    const result: string[] = []
    let lastIdx = -1
    for (const idx of sortedPreserved) {
      if (idx > lastIdx + 1) {
        const gap = idx - lastIdx - 1
        result.push(`  ... [${gap} lines omitted]`)
      }
      result.push(lines[idx])
      lastIdx = idx
    }
    if (lastIdx < lines.length - 1) {
      const gap = lines.length - 1 - lastIdx
      if (result.length > 0) result.push(`  ... [${gap} lines omitted]`)
    }

    return result.join("\n")
  }
}
