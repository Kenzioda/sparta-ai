import git from "./git.json"
import test from "./test.json"
import build from "./build.json"
import pkg from "./package.json"
import shell from "./shell.json"
import docker from "./docker.json"
import stacktrace from "./stacktrace.json"
import generic from "./generic.json"

export interface CommandFilter {
  command: string
  detect: string[]
  dropLines: string[]
  collapseLines: string[]
  includeLines: string[]
  deduplicate: boolean
  dedupThreshold: number
  maxLines: number
  headLines: number
  tailLines: number
  priorityPatterns: string[]
}

export type Filters = Record<string, CommandFilter>

export default {
  git, test, build, package: pkg, shell, docker, stacktrace, generic,
} as Filters
