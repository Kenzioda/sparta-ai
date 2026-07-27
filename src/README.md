<p align="center">
  <a href="https://sparta.ai">
    <picture>
      <source srcset="packages/console/app/src/asset/logo-ornate-dark.svg" media="(prefers-color-scheme: dark)">
      <source srcset="packages/console/app/src/asset/logo-ornate-light.svg" media="(prefers-color-scheme: light)">
      <img src="packages/console/app/src/asset/logo-ornate-light.svg" alt="S.P.A.R.T.A logo">
    </picture>
  </a>
</p>

<pre align="center">
███████╗██████╗  █████╗ ██████╗ ████████╗ █████╗ 
██╔════╝██╔══██╗██╔══██╗██╔══██╗╚══██╔══╝██╔══██╗
███████╗██████╔╝███████║██████╔╝   ██║   ███████║
╚════██║██╔═══╝ ██╔══██║██╔══██╗   ██║   ██╔══██║
███████║██║     ██║  ██║██║  ██║   ██║   ██║  ██║
╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝  ╚═╝   ╚═╝   ╚═╝  ╚═╝
</pre>

<p align="center"><strong>Super Personal Assistant for Real-time Tactical & Autonomous</strong></p>
<p align="center">The open source AI coding agent. Relentless. Precise. Autonomous.</p>
<p align="center">
  <a href="https://sparta.ai/discord"><img alt="Discord" src="https://img.shields.io/discord/1391832426048651334?style=flat-square&label=discord" /></a>
  <a href="https://www.npmjs.com/package/sparta-ai"><img alt="npm" src="https://img.shields.io/npm/v/sparta-ai?style=flat-square" /></a>
  <a href="https://github.com/anomalyco/sparta/actions/workflows/publish.yml"><img alt="Build status" src="https://img.shields.io/github/actions/workflow/status/anomalyco/sparta/publish.yml?style=flat-square&branch=dev" /></a>
</p>

<p align="center">
  <a href="README.md">English</a> |
  <a href="README.zh.md">简体中文</a> |
  <a href="README.zht.md">繁體中文</a> |
  <a href="README.ko.md">한국어</a> |
  <a href="README.de.md">Deutsch</a> |
  <a href="README.es.md">Español</a> |
  <a href="README.fr.md">Français</a> |
  <a href="README.it.md">Italiano</a> |
  <a href="README.da.md">Dansk</a> |
  <a href="README.ja.md">日本語</a> |
  <a href="README.pl.md">Polski</a> |
  <a href="README.ru.md">Русский</a> |
  <a href="README.bs.md">Bosanski</a> |
  <a href="README.ar.md">العربية</a> |
  <a href="README.no.md">Norsk</a> |
  <a href="README.br.md">Português (Brasil)</a> |
  <a href="README.th.md">ไทย</a> |
  <a href="README.tr.md">Türkçe</a> |
  <a href="README.uk.md">Українська</a> |
  <a href="README.bn.md">বাংলা</a> |
  <a href="README.gr.md">Ελληνικά</a> |
  <a href="README.vi.md">Tiếng Việt</a>
</p>

[![S.P.A.R.T.A Terminal UI](packages/web/src/assets/lander/screenshot.png)](https://sparta.ai)

---

### Installation

```bash
# YOLO
curl -fsSL https://sparta.ai/install | bash

# Package managers
npm i -g sparta-ai@latest             # or bun/pnpm/yarn
scoop install sparta                  # Windows
choco install sparta                  # Windows
brew install anomalyco/tap/sparta     # macOS and Linux (recommended, always up to date)
brew install sparta                   # macOS and Linux (official brew formula, updated less)
sudo pacman -S sparta                 # Arch Linux (Stable)
paru -S sparta-bin                    # Arch Linux (Latest from AUR)
mise use -g sparta                    # Any OS
nix run nixpkgs#sparta                # or github:anomalyco/sparta for latest dev branch
```

> [!TIP]
> Remove versions older than 0.1.x before installing.

### Desktop App (BETA)

S.P.A.R.T.A is also available as a desktop application. Download directly from the [releases page](https://github.com/anomalyco/sparta/releases) or [sparta.ai/download](https://sparta.ai/download).

| Platform              | Download                           |
| --------------------- | ---------------------------------- |
| macOS (Apple Silicon) | `sparta-desktop-mac-arm64.dmg`   |
| macOS (Intel)         | `sparta-desktop-mac-x64.dmg`     |
| Windows               | `sparta-desktop-windows-x64.exe` |
| Linux                 | `.deb`, `.rpm`, or `.AppImage`     |

```bash
# macOS (Homebrew)
brew install --cask sparta-desktop
# Windows (Scoop)
scoop bucket add extras; scoop install extras/sparta-desktop
```

#### Installation Directory

The install script respects the following priority order for the installation path:

1. `$SPARTA_INSTALL_DIR` - Custom installation directory
2. `$XDG_BIN_DIR` - XDG Base Directory Specification compliant path
3. `$HOME/bin` - Standard user binary directory (if it exists or can be created)
4. `$HOME/.sparta/bin` - Default fallback

```bash
# Examples
SPARTA_INSTALL_DIR=/usr/local/bin curl -fsSL https://sparta.ai/install | bash
XDG_BIN_DIR=$HOME/.local/bin curl -fsSL https://sparta.ai/install | bash
```

### Agents

S.P.A.R.T.A includes two built-in agents you can switch between with the `Tab` key.

- **build** - Default, full-access agent for development work
- **plan** - Read-only agent for analysis and code exploration
  - Denies file edits by default
  - Asks permission before running bash commands
  - Ideal for exploring unfamiliar codebases or planning changes

Also included is a **general** subagent for complex searches and multistep tasks.
This is used internally and can be invoked using `@general` in messages.

Learn more about [agents](https://sparta.ai/docs/agents).

### Documentation

For more info on how to configure S.P.A.R.T.A, [**head over to our docs**](https://sparta.ai/docs).

### Contributing

If you're interested in contributing to S.P.A.R.T.A, please read our [contributing docs](./CONTRIBUTING.md) before submitting a pull request.

---

**Join our community** [Discord](https://discord.gg/sparta) | [X.com](https://x.com/sparta)
