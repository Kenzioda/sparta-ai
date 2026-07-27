import { Context, Effect, Layer } from "effect"
import { CompressionPipeline, createPipeline } from "./pipeline"

export interface Interface {
  readonly pipeline: CompressionPipeline
  readonly processToolOutput: (text: string) => string
  readonly compressProse: (text: string, intensity?: string) => string
  readonly processContextHistory: (history: { content?: string; output?: string }[]) => { content?: string; output?: string }[]
}

export class Service extends Context.Service<Service, Interface>()("@sparta/Compression") {}

const layer = Layer.effect(
  Service,
  Effect.gen(function* () {
    const pipeline = createPipeline({ collectStats: true })
    return Service.of({
      pipeline,
      processToolOutput: (text) => pipeline.processToolOutput(text),
      compressProse: (text, intensity) => pipeline.compressProse(text, intensity),
      processContextHistory: (history) => pipeline.processContextHistory(history),
    })
  }),
)

export { layer }
