import { classifyOutput, getFilter } from "./command-detector"
import { Deduplicator } from "./deduplicator"
import { SmartTruncate } from "./smart-truncate"
import { ProseEngine } from "./prose-engine"
import filters from "./filters/index"

export interface CompressionStats {
  toolCompressions: number
  proseCompressions: number
  bytesBefore: number
  bytesAfter: number
}

export class CompressionPipeline {
  private deduplicator: Deduplicator
  private truncator: SmartTruncate
  private proseEngine: ProseEngine
  private collectStats: boolean
  private stats: CompressionStats

  constructor(options: { collectStats?: boolean } = {}) {
    this.deduplicator = new Deduplicator()
    this.truncator = new SmartTruncate()
    this.proseEngine = new ProseEngine()
    this.collectStats = options.collectStats || false
    this.stats = { toolCompressions: 0, proseCompressions: 0, bytesBefore: 0, bytesAfter: 0 }
  }

  processToolOutput(text: string): string {
    if (!text) return text
    if (this.collectStats) this.stats.bytesBefore += text.length

    const cmdInfo = getFilter(text, filters)
    const cmdFilter = cmdInfo?.filter
    let result = text

    if (cmdFilter) {
      if (cmdFilter.dropLines && cmdFilter.dropLines.length > 0) {
        const lines = result.split("\n")
        const filtered = []
        for (const line of lines) {
          let dropped = false
          for (const pat of cmdFilter.dropLines) {
            try {
              if (new RegExp(pat, "i").test(line)) {
                dropped = true
                break
              }
            } catch {
              if (line.trim().toLowerCase().startsWith(pat.toLowerCase())) {
                dropped = true
                break
              }
            }
          }
          if (!dropped) filtered.push(line)
        }
        result = filtered.join("\n")
      }

      if (cmdFilter.deduplicate) {
        result = this.deduplicator.deduplicate(result, cmdFilter.dedupThreshold || 3)
      }

      if (cmdFilter.maxLines) {
        result = this.truncator.truncate(result, {
          headLines: cmdFilter.headLines || 20,
          tailLines: cmdFilter.tailLines || 20,
          maxLines: cmdFilter.maxLines || 120,
          priorityPatterns: cmdFilter.priorityPatterns,
        })
      }
    } else {
      if (result.length > 2000) {
        result = this.truncator.truncate(result, { maxLines: 80, headLines: 15, tailLines: 15 })
      }
    }

    result = this.proseEngine.compress(result, "lite")

    if (this.collectStats) {
      this.stats.toolCompressions++
      this.stats.bytesAfter += result.length
    }

    return result
  }

  compressProse(text: string, intensity?: string): string {
    if (!text) return text
    if (this.collectStats) this.stats.bytesBefore += text.length
    const result = this.proseEngine.compress(text, intensity || "full")
    if (this.collectStats) {
      this.stats.proseCompressions++
      this.stats.bytesAfter += result.length
    }
    return result
  }

  processContextHistory(history: { content?: string; output?: string }[]): { content?: string; output?: string }[] {
    if (!Array.isArray(history) || history.length === 0) return history
    return history.map((entry) => {
      if (!entry) return entry
      const processed = { ...entry }
      if (typeof entry.content === "string") {
        processed.content = this.compressProse(entry.content, "lite")
      }
      if (typeof entry.output === "string") {
        processed.output = this.processToolOutput(entry.output)
      }
      return processed
    })
  }

  getStats(): CompressionStats {
    return { ...this.stats }
  }

  resetStats(): void {
    this.stats = { toolCompressions: 0, proseCompressions: 0, bytesBefore: 0, bytesAfter: 0 }
  }
}

export function createPipeline(options: { collectStats?: boolean } = {}): CompressionPipeline {
  return new CompressionPipeline(options)
}
