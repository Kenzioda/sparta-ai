export interface CompressionRule {
  pattern: RegExp
  replacement: string
  description: string
}

export const RULE_SETS: Record<string, CompressionRule[]> = {
  filler: [
    { pattern: /\b(could you please|would you please|if you don't mind|if possible)\b/gi, replacement: "", description: "polite_requests" },
    { pattern: /\b(I think|I believe|I feel|I guess|I suppose|it seems|it appears)\b/gi, replacement: "", description: "hedging" },
    { pattern: /\b(please make sure to|i need you to|just a quick|as you know)\b/gi, replacement: "", description: "unnecessary_phrases" },
    { pattern: /\b(i think we should|it would be great if|thanks in advance)\b/gi, replacement: "", description: "polite_padding" },
    { pattern: /\b(just|simply|basically|actually|literally|pretty|quite|rather|somewhat|kind of|sort of)\b/gi, replacement: "", description: "filler_adverbs" },
    { pattern: /\b(additionally|furthermore|moreover|nevertheless|nonetheless|notwithstanding)\b/gi, replacement: "", description: "verbose_connectors" },
    { pattern: /\b(in order to|for the purpose of|with the intention of)\b/gi, replacement: " to ", description: "purpose_phrases" },
    { pattern: /\b(at this point in time|at the present time|at this moment|currently)\b/gi, replacement: " now ", description: "time_redundancy" },
    { pattern: /\b(due to the fact that|owing to the fact that|on account of the fact that)\b/gi, replacement: " because ", description: "causal_redundancy" },
    { pattern: /\b(it is worth noting that|it should be noted that|it is important to note that)\b/gi, replacement: "", description: "meta_commentary" },
  ],
  context: [
    { pattern: /^I would like to (ask you to|request that|suggest that|recommend that)\s+/i, replacement: "", description: "intro_framing" },
    { pattern: /^Let me (start by|begin by|first)\s+/i, replacement: "", description: "intro_sequence" },
    { pattern: /^The (purpose|goal|objective) of (this|my) (request|message|question) is to\s+/i, replacement: "", description: "purpose_intro" },
    { pattern: /^I am (reaching out|writing|contacting you) (to|regarding|about)\s+/i, replacement: "", description: "contact_intro" },
    { pattern: /\b(i am going to|i will now|let us now|we shall)\b/gi, replacement: " ", description: "intent_setup" },
    { pattern: /\b(what i mean is|in other words|to put it another way|that is to say)\b/gi, replacement: " i.e. ", description: "rephrasing" },
    { pattern: /\b(as i mentioned (earlier|before|previously)|as stated (earlier|before|previously)|as noted)\b/gi, replacement: "", description: "reference_back" },
    { pattern: /\b(with regard to|with respect to|regarding|concerning|in reference to)\b/gi, replacement: " re: ", description: "reference_prefix" },
    { pattern: /\b(in the event that|in the case that|under the circumstances that)\b/gi, replacement: " if ", description: "conditional_redundancy" },
    { pattern: /\b(the vast majority of|the overwhelming majority of|a large number of|a significant number of)\b/gi, replacement: " most ", description: "majority_phrase" },
  ],
  structural: [
    { pattern: /\bi am going to\b/gi, replacement: " will ", description: "future_strip" },
    { pattern: /\bi would like to\b/gi, replacement: " want ", description: "desire_strip" },
    { pattern: /\bin order to\b/gi, replacement: " to ", description: "purpose_strip" },
    { pattern: /\bdue to the fact that\b/gi, replacement: " because ", description: "causal_strip" },
    { pattern: /\bat this point in time\b/gi, replacement: " now ", description: "temporal_strip" },
    { pattern: /\bin the event that\b/gi, replacement: " if ", description: "conditional_strip" },
    { pattern: /\ba number of\b/gi, replacement: " some ", description: "quantifier_strip" },
    { pattern: /\bin excess of\b/gi, replacement: " over ", description: "excess_strip" },
    { pattern: /\bas a result of\b/gi, replacement: " from ", description: "result_strip" },
    { pattern: /\b(is able to|are able to|has the ability to|have the ability to)\b/gi, replacement: " can ", description: "ability_strip" },
    { pattern: /\b(despite the fact that|in spite of the fact that)\b/gi, replacement: " although ", description: "concession_strip" },
    { pattern: /\b(in the vicinity of|in the neighborhood of)\b/gi, replacement: " near ", description: "proximity_strip" },
    { pattern: /\b(prior to|previous to)\b/gi, replacement: " before ", description: "temporal_order" },
    { pattern: /\b(subsequent to|following after)\b/gi, replacement: " after ", description: "temporal_sequence" },
    { pattern: /\b(on a regular basis|on a daily basis|on a weekly basis)\b/gi, replacement: " regularly ", description: "frequency_strip" },
  ],
  dedup: [
    { pattern: /(.+\n)\1{2,}/g, replacement: "$1  [repeated content collapsed]\n", description: "repeated_lines" },
    { pattern: /(i need you to|i want you to|please)\s{0,3}(i need you to|i want you to|please)/gi, replacement: "$1", description: "repeated_requests" },
    { pattern: /\b(again|once more|one more time)\b.*\b(again|once more|one more time)\b/gi, replacement: " again ", description: "repeated_emphasis" },
  ],
}

export const INTENSITY_LEVELS: Record<string, string[]> = {
  lite: ["filler", "structural"],
  full: ["filler", "context", "structural", "dedup"],
}

export function getRulesForIntensity(intensity: string): CompressionRule[] {
  const categories = INTENSITY_LEVELS[intensity] || INTENSITY_LEVELS.lite
  const rules: CompressionRule[] = []
  for (const cat of categories) {
    const catRules = RULE_SETS[cat]
    if (catRules) rules.push(...catRules)
  }
  return rules
}
