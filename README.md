# S.P.A.R.T.A

**Super Personal Assistant for Real-time Tactical & Autonomous**

A hierarchical multi-agent system built on top of the opencode framework, with tactical command structure, domain-expert skills database, and safety-governed deployment.

## Install

### Option 1: Quick install (recommended)

| Platform | Download |
|---|---|
| Windows | [sparta-1.0.0-win32-x64.tar.gz](https://github.com/Kenzioda/sparta-ai/releases/tag/v1.0.0) |
| macOS / Linux | [sparta-1.0.0-linux-x64.tar.gz](https://github.com/Kenzioda/sparta-ai/releases/tag/v1.0.0) |

**Usage:** Download, extract, then double-click `install.ps1` (Windows) or run `bash install.sh` (Mac/Linux). The script auto-installs Node.js + Bun + the opencode engine, copies the Sparta config, and creates a desktop shortcut.

After install, just type `sparta` in your terminal or double-click the desktop icon.

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
