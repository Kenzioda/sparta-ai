#!/usr/bin/env bash
set -euo pipefail

echo "========================================"
echo "  S.P.A.R.T.A - Setup"
echo "========================================"

if ! command -v node &>/dev/null; then
  echo "[1/2] Installing Node.js..."
  if command -v brew &>/dev/null; then
    brew install node
  elif command -v apt &>/dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
  elif command -v dnf &>/dev/null; then
    curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo -E bash -
    sudo dnf install -y nodejs
  else
    echo "Please install Node.js manually: https://nodejs.org"
    exit 1
  fi
else
  echo "[1/2] Node.js found"
fi

echo "[2/2] Installing S.P.A.R.T.A..."
npm install -g github:Kenzioda/sparta-ai

echo ""
echo "========================================"
echo "  S.P.A.R.T.A installed!"
echo "========================================"
echo ""
echo "  Run: sparta"
