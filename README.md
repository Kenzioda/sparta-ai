# S.P.A.R.T.A

**Super Personal Assistant for Real-time Tactical & Autonomous**

A hierarchical multi-agent system built on top of the opencode framework, with tactical command structure, domain-expert skills database, and safety-governed deployment.

## Install

### Option 1: Download archive (standalone — no install required)

| Platform | Download |
|---|---|
| Windows | [sparta-1.0.0-win32-x64.zip](https://github.com/Kenzioda/sparta-ai/releases/tag/v1.0.0) |
| macOS (Intel) | [sparta-1.0.0-darwin-x64.tar.gz](https://github.com/Kenzioda/sparta-ai/releases/tag/v1.0.0) |
| macOS (Apple Silicon) | [sparta-1.0.0-darwin-arm64.tar.gz](https://github.com/Kenzioda/sparta-ai/releases/tag/v1.0.0) |
| Linux (x64) | [sparta-1.0.0-linux-x64.tar.gz](https://github.com/Kenzioda/sparta-ai/releases/tag/v1.0.0) |
| Linux (ARM64) | [sparta-1.0.0-linux-arm64.tar.gz](https://github.com/Kenzioda/sparta-ai/releases/tag/v1.0.0) |

**Usage:** Download, extract, then run `sparta.exe` (Windows) or `./sparta` (Mac/Linux) from the extracted folder.

### Option 2: Via npm (requires Node.js 18+)

```bash
npm install -g opencode sparta-ai
sparta
```

## Features

- **Master Agent** — decomposes, delegates, verifies, synthesizes
- **Senior Helper** — analysis, code review, complex sub-tasks
- **Junior Helper** — search, grep, read, data gathering
- **41-domain faculty system** with risk-governed deployment
- **Context compression pipeline** for token optimization
- **Sandbox isolation** for secure execution
- **Anti-detection browser automation**
- **376 skills** across 41 faculties

## Repository Structure

```
.opencode/          — Agent definition, model tiering, config
themes/             — TUI and desktop UI themes
skills/             — Skills overview
specs/storage/      — Full identity spec and skills database
scripts/            — Installer scripts and CI pipeline
bin/sparta          — CLI wrapper for npm installation
```

## License

MIT

## Special Thanks

- **OpenCode** — https://github.com/anomalyco/opencode
- **Camofox** — https://github.com/jo-inc/camofox-browser
- **Activepieces** — https://github.com/activepieces/activepieces
