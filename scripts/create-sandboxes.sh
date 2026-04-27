#!/usr/bin/env bash
# =============================================================================
# create-sandboxes.sh — create one OpenShell sandbox per agent role on Brev.
#
# Roles, sandbox names, host ports and policies are read from
# `src/orchestrator/agent-registry.ts` (mirrored here for the shell layer):
#
#   triage          agent-triage      8081  policies/sandbox-triage.yaml
#   billing         agent-billing     8082  policies/sandbox-billing.yaml
#   compliance      agent-compliance  8083  policies/sandbox-compliance.yaml
#   technical       agent-technical   8084  policies/sandbox-technical.yaml
#   pricing         agent-pricing     8085  policies/sandbox-pricing.yaml
#   claims_analyst  agent-claims      8086  policies/sandbox-claims.yaml
#
# Each sandbox is built from the repo's Dockerfile, started with the agent's
# initial network policy, has its container :3000 forwarded to the listed host
# port, and runs `node dist/agent-server.js` with the matching AGENT_ROLE.
#
# Usage:  bash scripts/create-sandboxes.sh
# Idempotent: deletes any existing sandbox with the same name before creating.
# =============================================================================
set -euo pipefail

if ! command -v openshell >/dev/null 2>&1; then
  echo "ERROR: openshell not found in PATH. Are you on a Brev instance?" >&2
  exit 1
fi

# role:sandbox:port pairs (claims_analyst -> agent-claims for shorter sandbox name)
ENTRIES=(
  "triage:agent-triage:8081"
  "billing:agent-billing:8082"
  "compliance:agent-compliance:8083"
  "technical:agent-technical:8084"
  "pricing:agent-pricing:8085"
  "claims_analyst:agent-claims:8086"
)

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

for entry in "${ENTRIES[@]}"; do
  IFS=":" read -r role sandbox port <<< "$entry"

  # The policy file uses the sandbox short-name (claims_analyst -> claims).
  policy_short=${sandbox#agent-}
  policy_file="policies/sandbox-${policy_short}.yaml"

  if [ ! -f "$policy_file" ]; then
    echo "ERROR: missing policy file: $policy_file" >&2
    exit 1
  fi

  # Delete any pre-existing sandbox of the same name (idempotent reruns).
  if openshell sandbox list 2>/dev/null | awk '{print $1}' | grep -qx "$sandbox"; then
    echo "[$sandbox] removing existing sandbox..."
    openshell sandbox delete "$sandbox" >/dev/null 2>&1 || true
  fi

  echo "[$sandbox] creating (role=$role port=$port policy=$policy_file)..."
  openshell sandbox create \
    --name "$sandbox" \
    --from ./ \
    --policy "$policy_file" \
    --forward "$port" \
    --keep \
    -e "AGENT_ROLE=$role" \
    -e "AGENT_PORT=3000" \
    -- node /sandbox/app/dist/agent-server.js
done

echo ""
echo "All 6 sandboxes created."
echo "Health-check: for p in 8081 8082 8083 8084 8085 8086; do curl -s http://127.0.0.1:\$p/health; echo; done"
echo "Start orchestrator with:  PORT=9000 AGENT_TRANSPORT=http npm run orchestrator"
