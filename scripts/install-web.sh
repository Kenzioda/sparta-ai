#!/bin/bash
# S.P.A.R.T.A Web Installer (macOS / Linux)
# Usage: curl -fsSL https://sparta.ai/install.sh | bash

set -euo pipefail

VERSION="${1:-latest}"
REPO="Kenzioda/sparta-ai"

# Detect OS and architecture
OS="$(uname -s | tr '[:upper:]' '[:lower:]')"
ARCH="$(uname -m)"

case "$OS" in
  linux)
    case "$ARCH" in
      x86_64|amd64) PLATFORM="linux-x64" ;;
      aarch64|arm64) PLATFORM="linux-arm64" ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  darwin)
    case "$ARCH" in
      x86_64) PLATFORM="mac-x64" ;;
      arm64) PLATFORM="mac-arm64" ;;
      *) echo "Unsupported architecture: $ARCH"; exit 1 ;;
    esac
    ;;
  *)
    echo "Unsupported OS: $OS"
    echo "Windows users: run the PowerShell installer instead"
    exit 1
    ;;
esac

echo "Downloading S.P.A.R.T.A for $PLATFORM..."

# Get download URL
if [ "$VERSION" = "latest" ]; then
  API_URL="https://api.github.com/repos/$REPO/releases/latest"
else
  API_URL="https://api.github.com/repos/$REPO/releases/tags/v$VERSION"
fi

DOWNLOAD_URL=$(curl -s "$API_URL" | grep "browser_download_url" | grep "$PLATFORM" | head -1 | cut -d'"' -f4)

if [ -z "$DOWNLOAD_URL" ]; then
  echo "Error: No release found for $PLATFORM"
  exit 1
fi

TMP_DIR=$(mktemp -d)
ARCHIVE="$TMP_DIR/sparta.tar.gz"

echo "Downloading from $DOWNLOAD_URL ..."
curl -fsSL "$DOWNLOAD_URL" -o "$ARCHIVE"

echo "Extracting..."
tar -xzf "$ARCHIVE" -C "$TMP_DIR"

echo "Installing..."
bash "$TMP_DIR/scripts/installer-linux.sh" "$VERSION" "$TMP_DIR/sparta"

rm -rf "$TMP_DIR"
echo "Done! Run 'sparta' to start."
