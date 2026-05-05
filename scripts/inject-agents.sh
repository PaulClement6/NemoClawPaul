#!/usr/bin/env bash
# =============================================================================
# inject-agents.sh — Deploy Meridian agents inside the NemoClaw sandbox
# =============================================================================
#
# Run this INSIDE the sandbox after cloning the repo:
#   nemoclaw insurance-usecase connect
#   git clone https://github.com/PaulClement6/NemoClawPaul.git /tmp/deploy
#   bash /tmp/deploy/scripts/inject-agents.sh
#
# =============================================================================
set -euo pipefail

REPO_DIR="${1:-/tmp/deploy}"
DATA_DIR="/sandbox/.openclaw-data"
WORKSPACE="$DATA_DIR/workspace/meridian"
SKILLS_DIR="$DATA_DIR/skills"
CANVAS_DIR="$DATA_DIR/canvas"
MODEL="inference/nvidia/nemotron-3-super-120b-a12b"

echo "=============================================="
echo "  Meridian Insurance — Agent Injection"
echo "  NemoClaw Sandbox Deployment"
echo "=============================================="
echo ""
echo "  Repo:      $REPO_DIR"
echo "  Workspace: $WORKSPACE"
echo "  Skills:    $SKILLS_DIR"
echo "  Canvas:    $CANVAS_DIR"
echo ""

# --- Verify we're inside the sandbox ---
if [ ! -d "$DATA_DIR" ]; then
  echo "ERROR: $DATA_DIR not found. Are you inside the sandbox?"
  echo "Run: nemoclaw insurance-usecase connect"
  exit 1
fi

if [ ! -d "$REPO_DIR" ]; then
  echo "ERROR: $REPO_DIR not found."
  echo "Run: git clone https://github.com/PaulClement6/NemoClawPaul.git $REPO_DIR"
  exit 1
fi

# =============================================================================
# STEP 1: Create workspace directories
# =============================================================================
echo "[1/6] Creating workspace directories..."
mkdir -p "$WORKSPACE/demo-data/compliance-docs"
mkdir -p "$WORKSPACE/policies"
echo "  ✓ Directories created"

# =============================================================================
# STEP 2: Copy demo data
# =============================================================================
echo ""
echo "[2/6] Copying demo data..."
cp "$REPO_DIR/demo-data/customers.json" "$WORKSPACE/demo-data/"
cp "$REPO_DIR/demo-data/billing-history.json" "$WORKSPACE/demo-data/"
cp "$REPO_DIR/demo-data/claims.json" "$WORKSPACE/demo-data/"
cp "$REPO_DIR/demo-data/faq.json" "$WORKSPACE/demo-data/" 2>/dev/null || echo "  (faq.json not found, skipping)"
cp "$REPO_DIR/demo-data/compliance-docs/"*.md "$WORKSPACE/demo-data/compliance-docs/"

# Copy AGENTS.md and SOUL.md
cp "$REPO_DIR/AGENTS.md" "$WORKSPACE/AGENTS.md"
cp "$REPO_DIR/SOUL.md" "$WORKSPACE/SOUL.md"

FILE_COUNT=$(find "$WORKSPACE/demo-data" -type f | wc -l)
echo "  ✓ $FILE_COUNT data files copied"

# =============================================================================
# STEP 3: Deploy skills
# =============================================================================
echo ""
echo "[3/6] Deploying skills..."
for skill_dir in "$REPO_DIR/skills/"*/; do
  skill_name=$(basename "$skill_dir")
  mkdir -p "$SKILLS_DIR/$skill_name"
  cp "$skill_dir/SKILL.md" "$SKILLS_DIR/$skill_name/SKILL.md"
  echo "  ✓ $skill_name"
done
SKILL_COUNT=$(find "$SKILLS_DIR" -name 'SKILL.md' | wc -l)
echo "  ✓ $SKILL_COUNT skills deployed"

# =============================================================================
# STEP 4: Deploy dashboard
# =============================================================================
echo ""
echo "[4/6] Deploying dashboard..."
cp "$REPO_DIR/src/ui/dashboard-v2.html" "$CANVAS_DIR/index.html"
echo "  ✓ Dashboard deployed to canvas"

# =============================================================================
# STEP 5: Create agents
# =============================================================================
echo ""
echo "[5/6] Creating agents..."

# Check if agents already exist (idempotent)
EXISTING=$(openclaw agents list 2>/dev/null | grep -c "Workspace:" || echo "0")
echo "  Currently $EXISTING agent(s) registered"

# --- Triage (default front-desk router) ---
if ! openclaw agents list 2>/dev/null | grep -q "^- triage"; then
  echo ""
  echo "  Creating: triage..."
  openclaw agents add triage \
    --workspace "$WORKSPACE" \
    --model "$MODEL" \
    --non-interactive 2>/dev/null || echo "  (triage may already exist)"
  openclaw agents set-identity --agent triage \
    --name "Meridian Support" \
    --emoji "🏠" \
    --theme "professional UK insurance customer support front-desk" 2>/dev/null || true
  echo "  ✓ triage created"
else
  echo "  ⏭ triage already exists"
fi

# --- Billing ---
if ! openclaw agents list 2>/dev/null | grep -q "^- billing"; then
  echo ""
  echo "  Creating: billing..."
  openclaw agents add billing \
    --workspace "$WORKSPACE" \
    --model "$MODEL" \
    --non-interactive 2>/dev/null || echo "  (billing may already exist)"
  openclaw agents set-identity --agent billing \
    --name "Billing" \
    --emoji "💷" \
    --theme "meticulous UK insurance billing specialist" 2>/dev/null || true
  echo "  ✓ billing created"
else
  echo "  ⏭ billing already exists"
fi

# --- Compliance ---
if ! openclaw agents list 2>/dev/null | grep -q "^- compliance"; then
  echo ""
  echo "  Creating: compliance..."
  openclaw agents add compliance \
    --workspace "$WORKSPACE" \
    --model "$MODEL" \
    --non-interactive 2>/dev/null || echo "  (compliance may already exist)"
  openclaw agents set-identity --agent compliance \
    --name "Compliance" \
    --emoji "🔒" \
    --theme "careful UK insurance compliance and data protection officer" 2>/dev/null || true
  echo "  ✓ compliance created"
else
  echo "  ⏭ compliance already exists"
fi

# --- Technical ---
if ! openclaw agents list 2>/dev/null | grep -q "^- technical"; then
  echo ""
  echo "  Creating: technical..."
  openclaw agents add technical \
    --workspace "$WORKSPACE" \
    --model "$MODEL" \
    --non-interactive 2>/dev/null || echo "  (technical may already exist)"
  openclaw agents set-identity --agent technical \
    --name "Tech Support" \
    --emoji "🔧" \
    --theme "helpful UK insurance technical support specialist" 2>/dev/null || true
  echo "  ✓ technical created"
else
  echo "  ⏭ technical already exists"
fi

# --- Pricing ---
if ! openclaw agents list 2>/dev/null | grep -q "^- pricing"; then
  echo ""
  echo "  Creating: pricing..."
  openclaw agents add pricing \
    --workspace "$WORKSPACE" \
    --model "$MODEL" \
    --non-interactive 2>/dev/null || echo "  (pricing may already exist)"
  openclaw agents set-identity --agent pricing \
    --name "Pricing" \
    --emoji "📊" \
    --theme "analytical UK insurance pricing and quotes specialist" 2>/dev/null || true
  echo "  ✓ pricing created"
else
  echo "  ⏭ pricing already exists"
fi

# --- Claims Analyst ---
if ! openclaw agents list 2>/dev/null | grep -q "^- claims-analyst"; then
  echo ""
  echo "  Creating: claims-analyst..."
  openclaw agents add claims-analyst \
    --workspace "$WORKSPACE" \
    --model "$MODEL" \
    --non-interactive 2>/dev/null || echo "  (claims-analyst may already exist)"
  openclaw agents set-identity --agent claims-analyst \
    --name "Claims" \
    --emoji "📋" \
    --theme "thorough UK insurance claims investigation analyst" 2>/dev/null || true
  echo "  ✓ claims-analyst created"
else
  echo "  ⏭ claims-analyst already exists"
fi

# =============================================================================
# STEP 6: Verify
# =============================================================================
echo ""
echo "[6/6] Verifying deployment..."
echo ""
openclaw agents list
echo ""

AGENT_COUNT=$(openclaw agents list 2>/dev/null | grep -c "^- " || echo "0")
SKILL_COUNT=$(find "$SKILLS_DIR" -name 'SKILL.md' | wc -l)
DATA_COUNT=$(find "$WORKSPACE/demo-data" -type f | wc -l)

echo "=============================================="
echo "  Deployment Summary"
echo "=============================================="
echo "  Agents:    $AGENT_COUNT registered"
echo "  Skills:    $SKILL_COUNT deployed"
echo "  Data:      $DATA_COUNT files"
echo "  Dashboard: $([ -f "$CANVAS_DIR/index.html" ] && echo 'deployed' || echo 'MISSING')"
echo ""
echo "  Next steps:"
echo "    1. Test: openclaw agent --agent triage --message 'When does my policy renew?'"
echo "    2. Test: openclaw agent --agent billing --message 'Why did my premium increase?'"
echo "    3. Dashboard: http://127.0.0.1:18789 (needs SSH tunnel)"
echo ""
echo "  From your laptop:"
echo "    ssh -N -L 18789:127.0.0.1:18789 ubuntu@<brev-host>"
echo ""
