export interface ValidationResult {
  passed: boolean
  reason: string
  ratio?: number
  compTokens?: number
  origTokens?: number
  warning?: boolean
}

export class ValidationGate {
  private tokenRatioWarning: number
  private structuralIntegrityRequired: boolean

  constructor(options: { tokenRatioWarning?: number; structuralIntegrityRequired?: boolean } = {}) {
    this.tokenRatioWarning = options.tokenRatioWarning ?? 0.8
    this.structuralIntegrityRequired = options.structuralIntegrityRequired !== false
  }

  validate(original: string, compressed: string): ValidationResult {
    if (!original || !compressed) return { passed: false, reason: "empty input" }
    if (original === compressed) return { passed: true, reason: "identical" }
    if (compressed.length < 3) return { passed: false, reason: "output too short" }

    const origTokens = Math.ceil(original.length / 4)
    const compTokens = Math.ceil(compressed.length / 4)
    const ratio = 1 - compTokens / origTokens

    if (ratio > this.tokenRatioWarning) {
      return { passed: true, reason: "high_compression", ratio, compTokens, origTokens, warning: true }
    }

    const origCodeBlocks = (original.match(/```/g) || []).length
    const compCodeBlocks = (compressed.match(/```/g) || []).length
    if (origCodeBlocks !== compCodeBlocks || (origCodeBlocks > 0 && origCodeBlocks % 2 !== 0)) {
      return { passed: false, reason: "code_block_mismatch", origCodeBlocks, compCodeBlocks }
    }

    const origUrls = (original.match(/https?:\/\/\S+/g) || []).length
    const compUrls = (compressed.match(/https?:\/\/\S+/g) || []).length
    if (this.structuralIntegrityRequired && origUrls !== compUrls) {
      return { passed: false, reason: "url_count_mismatch", origUrls, compUrls }
    }

    const jsonBrackets = (original.match(/[{}]/g) || []).length
    const compBrackets = (compressed.match(/[{}]/g) || []).length
    if (this.structuralIntegrityRequired && Math.abs(jsonBrackets - compBrackets) > 2) {
      return { passed: false, reason: "json_structure_changed" }
    }

    return { passed: true, reason: "ok", ratio, compTokens, origTokens }
  }
}
