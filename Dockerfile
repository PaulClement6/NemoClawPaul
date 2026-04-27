# =============================================================================
# Single image, six roles.
#
# Each OpenShell sandbox pod runs this image with a different AGENT_ROLE env
# var (set via `openshell sandbox create -e AGENT_ROLE=billing ...`). The
# orchestrator on the Brev host reaches each pod via `openshell forward`.
#
# Base image: ghcr.io/nvidia/openshell-community/sandboxes/base:latest
#   - Ubuntu 22.04
#   - Node 22, npm 11
#   - Python 3.13, pip
#   - User `sandbox` (uid 1000) with /sandbox writable
#
# Build (locally for testing):
#   docker build -t nemoclaw-demo .
#
# On Brev: `openshell sandbox create --from ./` builds & pushes automatically.
# =============================================================================

ARG BASE_IMAGE=ghcr.io/nvidia/openshell-community/sandboxes/base:latest
FROM ${BASE_IMAGE}

WORKDIR /sandbox/app

# Install deps first so the layer caches when only source changes.
COPY --chown=sandbox:sandbox package*.json tsconfig.json ./
RUN npm ci

# App source + demo data.
COPY --chown=sandbox:sandbox src ./src
COPY --chown=sandbox:sandbox demo-data ./demo-data

# Compile TypeScript ahead of time so the running container needs only Node.
RUN npx tsc

USER sandbox

# CMD is intentionally absent — OpenShell ignores image CMD/ENTRYPOINT and
# expects the start command after `--` in `openshell sandbox create`.
# For reference: `node /sandbox/app/dist/agent-server.js`
