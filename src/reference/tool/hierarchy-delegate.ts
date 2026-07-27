import * as Tool from "./tool"
import DESCRIPTION from "./hierarchy-delegate.txt"
import { ToolJsonSchema } from "./json-schema"
import { SessionV1 } from "@opencode-ai/core/v1/session"
import { BackgroundJob } from "@/background/job"
import { Session } from "@/session/session"
import { SessionID, MessageID } from "../session/schema"
import { Agent } from "../agent/agent"
import { deriveSubagentSessionPermission } from "../agent/subagent-permissions"
import type { SessionPrompt } from "../session/prompt"
import { Config } from "@/config/config"
import { Effect, Schema, Scope } from "effect"
import { RuntimeFlags } from "@/effect/runtime-flags"

export interface TaskPromptOps {
  cancel(sessionID: SessionID): Effect.Effect<void>
  resolvePromptParts(template: string): Effect.Effect<SessionPrompt.PromptInput["parts"]>
  prompt(input: SessionPrompt.PromptInput): Effect.Effect<SessionV1.WithParts>
}

const id = "hierarchy_delegate"
const BACKGROUND_STARTED = [
  "The delegate is working in the background. You will be notified automatically when it finishes.",
  "DO NOT sleep, poll for progress, or duplicate this delegate's work.",
  "Work on non-overlapping tasks, or briefly tell the user what you launched and end your response.",
].join("\n")

const helper_tier_descriptions = [
  "Available helper tiers:",
  "  junior - Cheap/fast model for mechanical tasks (grep, glob, read, simple edits)",
  "  senior - Mid-tier model for analysis, code review, complex sub-tasks",
  "  cross_validate - Runs two independent helpers for security-critical tasks",
  "",
  "The system selects the best available model for the chosen tier automatically.",
].join("\n")

export const Parameters = Schema.Struct({
  description: Schema.String.annotate({ description: "A short (3-5 words) description of the sub-task" }),
  prompt: Schema.String.annotate({ description: "A focused, self-contained task description for the helper. Be specific about what to do and what to return." }),
  helper_tier: Schema.optional(Schema.Literal("junior", "senior", "cross_validate")).annotate({
    description: helper_tier_descriptions,
  }),
  task_id: Schema.optional(Schema.String).annotate({
    description: "Resume a previous delegate session by passing its task_id",
  }),
  background: Schema.optional(Schema.Boolean).annotate({
    description: "Run in background. You will be notified when it completes.",
  }),
})

const TIER_AGENT_MAP: Record<string, string> = {
  junior: "explore",
  senior: "general",
  cross_validate: "general",
}

function renderOutput(input: {
  sessionID: SessionID
  state: "running" | "completed" | "error"
  summary?: string
  text: string
}) {
  const tag = input.state === "error" ? "task_error" : "task_result"
  return [
    `<delegate id="${input.sessionID}" state="${input.state}">`,
    ...(input.summary ? [`<summary>${input.summary}</summary>`] : []),
    `<${tag}>`,
    input.text,
    `</${tag}>`,
    "</delegate>",
  ].join("\n")
}

export const HierarchyDelegateTool = Tool.define(
  id,
  Effect.gen(function* () {
    const sessions = yield* Session.Service
    const agent = yield* Agent.Service
    const cfg = yield* Config.Service
    const background = yield* BackgroundJob.Service
    const flags = yield* RuntimeFlags.Service

    const run = Effect.fn("HierarchyDelegate.execute")(function* (
      params: typeof Parameters.Type,
      ctx: Tool.Context,
    ) {
      const helperTier = params.helper_tier || "junior"
      const subagentType = TIER_AGENT_MAP[helperTier] || "general"

      const parent = yield* sessions.get(ctx.sessionID)
      let current = parent
      let depth = 0
      while (current.parentID) {
        depth++
        current = yield* sessions.get(current.parentID)
      }
      const maxDepth = cfg.subagent_depth ?? 3
      if (depth >= maxDepth) {
        return renderOutput({
          sessionID: ctx.sessionID,
          state: "error",
          text: `Max delegate depth (${maxDepth}) reached. Handle this directly.`,
        })
      }

      yield* ctx.ask({ permission: "task", patterns: [subagentType] })

      const next = yield* agent.get(subagentType)
      if (!next) {
        return renderOutput({
          sessionID: ctx.sessionID,
          state: "error",
          text: `Helper tier "${helperTier}" resolved to agent "${subagentType}" which was not found.`,
        })
      }

      const childPermission = deriveSubagentSessionPermission({
        parentSessionPermission: parent.permission ?? [],
        subagent: next,
      })
      const runInBackground = params.background === true
      if (runInBackground && !flags.experimentalBackgroundSubagents) {
        return renderOutput({
          sessionID: ctx.sessionID,
          state: "error",
          text: "Background delegates require OPENCODE_EXPERIMENTAL_BACKGROUND_SUBAGENTS=true",
        })
      }

      const ops = ctx.extra?.promptOps as TaskPromptOps | undefined
      if (!ops) {
        return renderOutput({
          sessionID: ctx.sessionID,
          state: "error",
          text: "HierarchyDelegate tool requires promptOps in context",
        })
      }

      if (helperTier === "cross_validate") {
        const a = yield* sessions.create({
          parentID: ctx.sessionID,
          title: `${params.description} (review A)`,
          agent: "general",
          permission: childPermission,
        })
        const b = yield* sessions.create({
          parentID: ctx.sessionID,
          title: `${params.description} (review B)`,
          agent: "general",
          permission: childPermission,
        })

        const runOne = (sessionID: SessionID) =>
          Effect.gen(function* () {
            const parts = yield* ops.resolvePromptParts(params.prompt)
            const result = yield* ops.prompt({
              messageID: MessageID.ascending(),
              sessionID,
              model: undefined,
              agent: "general",
              parts,
            })
            return result.parts.findLast((p) => p.type === "text")?.text ?? ""
          })

        const [resultA, resultB] = yield* Effect.all([runOne(a.id), runOne(b.id)], { concurrency: 2 })

        const divergence = resultA !== resultB ? "high" : "low"
        const synthesized = [
          `<cross_validation divergence="${divergence}">`,
          `<review_a>${resultA}</review_a>`,
          `<review_b>${resultB}</review_b>`,
          divergence === "high" ? "<note>Reviews differ. Review both and reconcile.</note>" : "<note>Reviews agree.</note>",
          "</cross_validation>",
        ].join("\n")

        return renderOutput({
          sessionID: ctx.sessionID,
          state: "completed",
          summary: `Cross-validation (${divergence} divergence)`,
          text: synthesized,
        })
      }

      const session = params.task_id
        ? yield* sessions.get(SessionID.make(params.task_id)).pipe(Effect.catchCause(() => Effect.succeed(undefined)))
        : undefined

      const model = next.model
      const nextSession = session ?? (yield* sessions.create({
        parentID: ctx.sessionID,
        title: `${params.description} (@${subagentType} ${helperTier})`,
        agent: subagentType,
        permission: childPermission,
      }))

      yield* ctx.metadata({
        title: params.description,
        metadata: {
          parentSessionId: ctx.sessionID,
          sessionId: nextSession.id,
          model,
          ...(runInBackground ? { background: true } : {}),
        },
      })

      if (runInBackground) {
        yield* background.start({
          id: nextSession.id,
          type: "delegate",
          sessionID: ctx.sessionID,
          messageID: ctx.messageID,
        })
        const bgRun = Effect.fn("HierarchyDelegate.backgroundRun")(function* () {
          const parts = yield* ops.resolvePromptParts(params.prompt)
          yield* ops.prompt({
            messageID: MessageID.ascending(),
            sessionID: nextSession.id,
            model,
            agent: subagentType,
            parts,
          })
        })
        yield* Effect.forkDaemon(bgRun)
        return renderOutput({
          sessionID: nextSession.id,
          state: "running",
          text: BACKGROUND_STARTED,
        })
      }

      const parts = yield* ops.resolvePromptParts(params.prompt)
      const result = yield* ops.prompt({
        messageID: MessageID.ascending(),
        sessionID: nextSession.id,
        model,
        agent: subagentType,
        parts,
      })
      const text = result.parts.findLast((p) => p.type === "text")?.text ?? ""

      return renderOutput({
        sessionID: nextSession.id,
        state: "completed",
        summary: params.description,
        text,
      })
    })

    return {
      description: DESCRIPTION,
      parameters: Parameters,
      jsonSchema: ToolJsonSchema.fromSchema(Parameters, { id }),
      execute: (params: typeof Parameters.Type, ctx: Tool.Context) =>
        run(params, ctx).pipe(Effect.orDie),
    }
  }),
)
