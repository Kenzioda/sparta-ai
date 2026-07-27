interface PreservedBlock {
  id: string
  content: string
  critical: boolean
}

const PATTERNS: [RegExp, boolean][] = [
  [/```[\s\S]*?```/g, true],
  [/`[^`]+`/g, true],
  [/https?:\/\/\S+/g, true],
  [/["'][^"']*["']/g, true],
  [/\{[\s\S]*?\}/g, true],
  [/\[[\s\S]*?\]/g, true],
  [/\/\/.*$/gm, true],
  [/\b\d+\.\d+\.\d+\.\d+\b/g, true],
  [/[A-Za-z]:\\(?:[^\\"<>|:*?]+\\)*[^\\"<>|:*?]+\.[a-zA-Z0-9]+/g, true],
  [/\/[a-z_\/]+\/[a-z_\/]+(?:\.[a-z]+)?/g, false],
  [/@\w+\/\w+/g, false],
  [/Error:\s.+$/gm, true],
  [/TypeError:\s.+$/gm, true],
  [/SyntaxError:\s.+$/gm, true],
]

export class Preservation {
  extract(text: string): { text: string; blocks: PreservedBlock[] } {
    if (!text) return { text, blocks: [] }
    const blocks: PreservedBlock[] = []
    let processed = text
    for (const [pattern] of PATTERNS) {
      processed = processed.replace(pattern, (match) => {
        const id = `\x00PRESERVED_${blocks.length}\x00`
        blocks.push({ id, content: match, critical: true })
        return id
      })
    }
    return { text: processed, blocks }
  }

  restore(text: string, blocks: PreservedBlock[]): string {
    if (!blocks.length) return text
    let result = text
    for (const block of blocks) {
      result = result.replace(block.id, block.content)
    }
    return result
  }
}
