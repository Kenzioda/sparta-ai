#!/bin/bash
set -euo pipefail

VERSION="${1:-1.0.0}"
BINARY_PATH="${2:-sparta}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_DIR="/usr/local/lib/sparta"
BINARY_DEST="/usr/local/bin/sparta"

echo "Installing S.P.A.R.T.A v${VERSION}..."

# Create directories
sudo mkdir -p "$INSTALL_DIR"
sudo mkdir -p "$INSTALL_DIR/.opencode/agent"
sudo mkdir -p "$INSTALL_DIR/themes/tui"
sudo mkdir -p "$INSTALL_DIR/themes/ui"
sudo mkdir -p "$INSTALL_DIR/skills"
sudo mkdir -p "$INSTALL_DIR/specs"

# Copy binary
sudo cp "$BINARY_PATH" "$BINARY_DEST"
sudo chmod +x "$BINARY_DEST"

# Copy Sparta config
[ -d "$PKG_DIR/.opencode" ] && sudo cp -r "$PKG_DIR/.opencode/" "$INSTALL_DIR/.opencode/"
[ -d "$PKG_DIR/themes" ] && sudo cp -r "$PKG_DIR/themes/" "$INSTALL_DIR/themes/"
[ -d "$PKG_DIR/skills" ] && sudo cp -r "$PKG_DIR/skills/" "$INSTALL_DIR/skills/"
[ -d "$PKG_DIR/specs" ] && sudo cp -r "$PKG_DIR/specs/" "$INSTALL_DIR/specs/"

# Create desktop shortcut (AppleScript .app)
APP_NAME="S.P.A.R.T.A"
APP_PATH="$HOME/Applications/${APP_NAME}.app"
mkdir -p "$APP_PATH/Contents/MacOS"

cat > "$APP_PATH/Contents/Info.plist" <<EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>CFBundleExecutable</key>
  <string>${APP_NAME}</string>
  <key>CFBundleIdentifier</key>
  <string>ai.sparta</string>
  <key>CFBundleName</key>
  <string>S.P.A.R.T.A</string>
  <key>CFBundleVersion</key>
  <string>${VERSION}</string>
</dict>
</plist>
EOF

cat > "$APP_PATH/Contents/MacOS/${APP_NAME}" <<'LAUNCHER'
#!/bin/bash
export OPENCODE_CONFIG_DIR="/usr/local/lib/sparta/.opencode"
exec /usr/local/bin/sparta
LAUNCHER
chmod +x "$APP_PATH/Contents/MacOS/${APP_NAME}"

# Also create a symlink on Desktop
if [ -d "$HOME/Desktop" ]; then
  ln -sf "$APP_PATH" "$HOME/Desktop/${APP_NAME}.app"
  echo "  Desktop shortcut created: ~/Desktop/${APP_NAME}.app"
fi

echo ""
echo "S.P.A.R.T.A v${VERSION} installed successfully!"
echo "  Binary: $BINARY_DEST"
echo "  Shortcut: ~/Desktop/${APP_NAME}.app"
echo ""
echo "Run 'sparta' from terminal or click the desktop icon."
