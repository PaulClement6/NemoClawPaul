#!/usr/bin/env bash
# =============================================================================
# setup-brev.sh — Set up a fresh Brev instance for the NemoClaw demo
# =============================================================================
# Run this ONCE on a fresh Brev instance.
# After setup, use run-demo.sh to launch the demo.
# =============================================================================
set -euo pipefail

INSTALL_DIR="$(cd "$(dirname "$0")/.." && pwd)"

echo "=== NemoClaw Demo: Brev Instance Setup ==="
echo "Working directory: $INSTALL_DIR"
echo ""

# --- 1. Install Node.js if not present ---
if ! command -v node &>/dev/null; then
  echo "[1/5] Installing Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[1/5] Node.js already installed: $(node --version)"
fi

# --- 2. Check for NemoClaw (openshell) ---
echo ""
if command -v openshell &>/dev/null; then
  echo "[2/5] NemoClaw (openshell) found: $(openshell --version 2>/dev/null || echo 'version unknown')"
else
  echo "[2/5] WARNING: NemoClaw (openshell) is NOT installed."
  echo ""
  echo "  NemoClaw must be installed manually. Check the official docs for"
  echo "  installation instructions specific to your environment."
  echo ""
  echo "  Once installed, verify with: openshell --version"
  echo ""
  echo "  The demo will still work without NemoClaw (NEMOCLAW_ENABLED=false)"
  echo "  but sandbox enforcement won't be active."
  echo ""
fi

# --- 3. Install npm dependencies ---
echo "[3/5] Installing dependencies..."
cd "$INSTALL_DIR"
npm ci

# --- 4. Build TypeScript ---
echo ""
echo "[4/5] Building TypeScript..."
npm run build

# --- 5. Create .env if it doesn't exist ---
echo ""
if [ ! -f "$INSTALL_DIR/.env" ]; then
  echo "[5/5] Creating .env from .env.example..."
  cp "$INSTALL_DIR/.env.example" "$INSTALL_DIR/.env"
  echo ""
  echo "  IMPORTANT: Edit .env and set your NVIDIA_API_KEY:"
  echo "    nano $INSTALL_DIR/.env"
  echo ""
  echo "  If running with NemoClaw, also set:"
  echo "    NEMOCLAW_ENABLED=true"
else
  echo "[5/5] .env already exists — skipping."
fi

# --- 6. Run tests to verify ---
echo ""
echo "Running tests to verify setup..."
npm test

echo ""
echo "=== Setup complete! ==="
echo ""
echo "Next steps:"
echo "  1. Edit .env and set NVIDIA_API_KEY"
echo "  2. Set NEMOCLAW_ENABLED=true (if openshell is installed)"
echo "  3. Run: bash scripts/run-demo.sh"
echo ""
