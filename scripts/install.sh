#!/usr/bin/env bash
set -euo pipefail

SPARTA_DIR="$(cd "$(dirname "$0")" && pwd)"
INSTALL_DIR="${HOME}/.local/share/sparta"

echo "========================================"
echo "  S.P.A.R.T.A - Setup"
echo "========================================"
echo ""

# ─── 1. Check/Install Node.js ───────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "[1/4] Installing Node.js..."
  if command -v brew &>/dev/null; then
    brew install node
  elif command -v apt &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo -E bash -
    sudo dnf install -y nodejs
  else
    echo "Please install Node.js manually from https://nodejs.org"
    exit 1
  fi
else
  echo "[1/4] Node.js found: $(which node)"
fi

# ─── 2. Check/Install Bun ───────────────────────────────────────
if ! command -v bun &>/dev/null; then
  echo "[2/4] Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export BUN_INSTALL="$HOME/.bun"
  export PATH="$BUN_INSTALL/bin:$PATH"
else
  echo "[2/4] Bun found: $(which bun)"
fi

# ─── 3. Install opencode engine ──────────────────────────────────
echo "[3/4] Installing opencode engine..."
npm install -g opencode 2>/dev/null || bun install -g opencode 2>/dev/null || {
  echo "Failed to install opencode engine."
  echo "Run manually: npm install -g opencode"
  exit 1
}
echo "[3/4] opencode engine installed"

# ─── 4. Copy Sparta config ───────────────────────────────────────
echo "[4/4] Installing Sparta config..."
mkdir -p "$INSTALL_DIR"

cp -r "$SPARTA_DIR/.opencode" "$INSTALL_DIR/" 2>/dev/null || true
cp -r "$SPARTA_DIR/themes" "$INSTALL_DIR/" 2>/dev/null || true
cp -r "$SPARTA_DIR/skills" "$INSTALL_DIR/" 2>/dev/null || true
cp -r "$SPARTA_DIR/specs" "$INSTALL_DIR/" 2>/dev/null || true

# Create launcher script
cat > "$INSTALL_DIR/sparta" << 'EOF'
#!/usr/bin/env bash
export OPENCODE_CONFIG_DIR="$(cd "$(dirname "$0")" && pwd)/.opencode"
exec opencode "$@"
EOF
chmod +x "$INSTALL_DIR/sparta"

# Symlink to PATH
mkdir -p "${HOME}/.local/bin"
ln -sf "$INSTALL_DIR/sparta" "${HOME}/.local/bin/sparta"

# Add ~/.local/bin to PATH if not already
if [[ ":$PATH:" != *":${HOME}/.local/bin:"* ]]; then
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "${HOME}/.bashrc"
  echo 'export PATH="$HOME/.local/bin:$PATH"' >> "${HOME}/.zshrc" 2>/dev/null || true
fi

# Desktop shortcut (Linux)
if command -v xdg-desktop-menu &>/dev/null; then
  cat > "$INSTALL_DIR/sparta.desktop" << EOF
[Desktop Entry]
Name=S.P.A.R.T.A
Exec=${INSTALL_DIR}/sparta
Icon=terminal
Type=Application
Categories=Utility;
Terminal=true
EOF
  chmod +x "$INSTALL_DIR/sparta.desktop"
  xdg-desktop-menu install "$INSTALL_DIR/sparta.desktop" 2>/dev/null || true
fi

# macOS .app bundle
if [[ "$(uname)" == "Darwin" ]]; then
  mkdir -p "$INSTALL_DIR/S.P.A.R.T.A.app/Contents/MacOS"
  cat > "$INSTALL_DIR/S.P.A.R.T.A.app/Contents/MacOS/S.P.A.R.T.A" << 'EOF'
#!/usr/bin/env bash
export OPENCODE_CONFIG_DIR="$(cd "$(dirname "$0")/../../.." && pwd)/.opencode"
exec opencode
EOF
  chmod +x "$INSTALL_DIR/S.P.A.R.T.A.app/Contents/MacOS/S.P.A.R.T.A"
  ln -sf "$INSTALL_DIR/S.P.A.R.T.A.app" "${HOME}/Applications/S.P.A.R.T.A.app" 2>/dev/null || true
fi

echo ""
echo "========================================"
echo "  S.P.A.R.T.A installed successfully!"
echo "========================================"
echo ""
echo "  Run: sparta"
echo "  Uninstall: rm -rf $INSTALL_DIR && npm uninstall -g opencode"