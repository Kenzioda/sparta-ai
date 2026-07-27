#!/bin/bash
set -euo pipefail

VERSION="${1:-1.0.0}"
BINARY_PATH="${2:-sparta}"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PKG_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_DIR="/opt/sparta"
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

# Create .desktop file for application menu + desktop shortcut
DESKTOP_FILE="/usr/share/applications/sparta.desktop"
cat | sudo tee "$DESKTOP_FILE" > /dev/null <<EOF
[Desktop Entry]
Name=S.P.A.R.T.A
Comment=Super Personal Assistant for Real-time Tactical & Autonomous
Exec=$BINARY_DEST
Icon=terminal
Terminal=true
Type=Application
Categories=Utility;
StartupNotify=true
EOF

# Copy to user desktop if it exists
for desktop_dir in "$HOME/Desktop" "$HOME/桌面"; do
  if [ -d "$desktop_dir" ]; then
    cp "$DESKTOP_FILE" "$desktop_dir/sparta.desktop"
    chmod +x "$desktop_dir/sparta.desktop"
    echo "  Desktop shortcut created: $desktop_dir/sparta.desktop"
  fi
done

# Create uninstaller
UNINSTALL_SCRIPT="$INSTALL_DIR/uninstall.sh"
cat | sudo tee "$UNINSTALL_SCRIPT" > /dev/null <<'UNINSTALL'
#!/bin/bash
set -e
echo "Uninstalling S.P.A.R.T.A..."
sudo rm -f /usr/local/bin/sparta
sudo rm -rf /opt/sparta
sudo rm -f /usr/share/applications/sparta.desktop
rm -f ~/Desktop/sparta.desktop
echo "S.P.A.R.T.A has been uninstalled."
UNINSTALL
sudo chmod +x "$UNINSTALL_SCRIPT"

echo ""
echo "S.P.A.R.T.A v${VERSION} installed successfully!"
echo "  Binary: $BINARY_DEST"
echo "  Desktop shortcut: ~/Desktop/sparta.desktop"
echo ""
echo "Run 'sparta' from terminal or click the desktop icon."
