import * as Tool from "./tool"
import DESCRIPTION from "./activepieces.txt"
import { ToolJsonSchema } from "./json-schema"
import { Effect, Schema } from "effect"

const DEFAULT_ENDPOINT = "http://localhost:8080"

async function apiCall(endpoint: string, action: string, params: Record<string, unknown> = {}): Promise<Record<string, unknown>> {
  const url = endpoint || DEFAULT_ENDPOINT
  const headers: Record<string, string> = { "Content-Type": "application/json" }

  if (action === "list") {
    const res = await fetch(`${url}/api/v1/workflows`, { headers, signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`Workflow API returned ${res.status}`)
    const data = await res.json() as { data?: { id: string; displayName: string; status: string }[] }
    return { workflows: (data.data || []).map((w) => ({ id: w.id, name: w.displayName, status: w.status })) }
  }

  if (action === "execute") {
    const res = await fetch(`${url}/api/v1/webhooks/${params.workflowId}`, {
      method: "POST", headers,
      body: JSON.stringify(params.payload || {}),
      signal: AbortSignal.timeout(30000),
    })
    if (!res.ok) throw new Error(`Execution returned ${res.status}`)
    const data = await res.json() as Record<string, unknown>
    return { executionId: data.id || data.executionId, status: "completed" }
  }

  if (action === "status") {
    const res = await fetch(`${url}/api/v1/executions/${params.executionId}`, { headers, signal: AbortSignal.timeout(10000) })
    if (!res.ok) throw new Error(`Status returned ${res.status}`)
    const data = await res.json() as { status?: string }
    return { executionId: params.executionId, status: data.status }
  }

  throw new Error(`Unknown action: ${action}`)
}

export const Parameters = Schema.Struct({
  action: Schema.Literal("list", "execute", "status").annotate({
    description: "Workflow action: list workflows, execute by ID, or check execution status",
  }),
  workflowId: Schema.optional(Schema.String).annotate({
    description: "Workflow ID (required for execute action)",
  }),
  executionId: Schema.optional(Schema.String).annotate({
    description: "Execution ID (required for status action)",
  }),
  payload: Schema.optional(Schema.Record(Schema.String, Schema.Unknown)).annotate({
    description: "Optional payload for workflow execution. Include browser_step to trigger stealth_browser actions.",
  }),
  endpoint: Schema.optional(Schema.String).annotate({
    description: "Workflow server URL (default: http://localhost:8080)",
  }),
})

export const ActivepiecesTool = Tool.define(
  "activepieces",
  Effect.gen(function* () {
    const execute = Effect.fn("Activepieces.execute")(function* (
      params: typeof Parameters.Type,
      ctx: Tool.Context,
    ) {
      yield* ctx.ask({ permission: "activepieces", patterns: ["*"] })

      const ep = params.endpoint || process.env.ACTIVEPIECES_ENDPOINT || DEFAULT_ENDPOINT

      try {
        if (params.action === "list") {
          const result = yield* Effect.promise(() => apiCall(ep, "list"))
          const workflows = (result.workflows as { id: string; name: string; status: string }[]) || []
          if (workflows.length === 0) {
            return { title: "Workflow", metadata: {}, output: "No workflows found. Create one in the workflow UI." }
          }
          const lines = workflows.map((w) => `  ${w.id.padEnd(20)} ${w.name.padEnd(30)} ${w.status}`)
          return { title: "Workflow", metadata: {}, output: `Workflows:\n${lines.join("\n")}` }
        }

        if (params.action === "execute") {
          if (!params.workflowId) return { title: "Error", metadata: {}, output: "workflowId is required for execute" }
          const result = yield* Effect.promise(() => apiCall(ep, "execute", { workflowId: params.workflowId, payload: params.payload || {} }))
          return {
            title: "Workflow",
            metadata: {},
            output: [
              `Workflow executed: ${params.workflowId}`,
              `Execution ID: ${result.executionId}`,
              `Status: ${result.status}`,
              "",
              "The workflow may include browser automation steps via stealth_browser.",
              "Check status with: activepieces action=status executionId=<id>",
            ].join("\n"),
          }
        }

        if (params.action === "status") {
          if (!params.executionId) return { title: "Error", metadata: {}, output: "executionId is required for status" }
          const result = yield* Effect.promise(() => apiCall(ep, "status", { executionId: params.executionId }))
          return { title: "Workflow", metadata: {}, output: `Execution ${params.executionId}: ${result.status}` }
        }

        return { title: "Error", metadata: {}, output: "Unknown action" }
      } catch (err) {
        return {
          title: "Workflow Error",
          metadata: {},
          output: `Error: ${(err as Error).message}\n\nEnsure the workflow engine is running.\nInstall: sandbox install activepieces npm\nStart:   sandbox start activepieces`,
        }
      }
    })

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      jsonSchema: ToolJsonSchema.fromSchema(Parameters, { id: "activepieces" }),
      execute: (params: typeof Parameters.Type, ctx: Tool.Context) =>
        execute(params, ctx).pipe(Effect.orDie),
    }
  }),
)
