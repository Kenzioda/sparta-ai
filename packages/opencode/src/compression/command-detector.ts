import filters, { type CommandFilter, type Filters } from "./filters/index"

const MIN_CONFIDENCE = 0.3

interface DetectionResult {
  name: string
  score: number
  filter: CommandFilter
}

function detectCategory(text: string, cmdFilters: Filters): DetectionResult | null {
  if (!text) return null
  const lower = text.toLowerCase()
  const candidates: DetectionResult[] = []
  for (const [name, filter] of Object.entries(cmdFilters)) {
    const patterns = filter.detect || []
    if (patterns.length === 0) continue
    let matches = 0
    for (const pat of patterns) {
      try {
        const re = new RegExp(pat, "i")
        if (re.test(lower)) matches++
      } catch {
        if (lower.includes(pat.toLowerCase())) matches++
      }
    }
    const score = matches / patterns.length
    if (score >= MIN_CONFIDENCE) {
      candidates.push({ name, score, filter })
    }
  }
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.score - a.score)
  return candidates[0]
}

export function classifyOutput(text: string): string {
  const result = detectCategory(text, filters)
  return result ? result.name : "generic"
}

export function getFilter(text: string, commandFilters?: Filters): DetectionResult | null {
  return detectCategory(text, commandFilters || filters)
}
