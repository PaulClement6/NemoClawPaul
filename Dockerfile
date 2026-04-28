# =============================================================================
# Single image, six roles.
#
# Each OpenShell sandbox pod runs this image with a different AGENT_ROLE env
# var (set via `env AGENT_ROLE=… node …` after `--` on `openshell sandbox
# create`). The orchestrator on the Brev host reaches each pod via
# `openshell forward`.
#
# Base image: ghcr.io/nvidia/openshell-community/sandboxes/base:latest
#   - Ubuntu 22.04
#   - Node 22, npm 11
#   - Python 3.13, pip
#   - User `sandbox` (uid 1000) with /sandbox writable, but /sandbox/app
#     (created by WORKDIR) is owned by root until we chown it.
#
# Build (locally for testing):
#   docker build -t nemoclaw-demo .
#
# On Brev: `openshell sandbox create --from ./` builds & pushes automatically.
# =============================================================================

ARG BASE_IMAGE=ghcr.io/nvidia/openshell-community/sandboxes/base:latest
FROM ${BASE_IMAGE}

USER root
WORKDIR /sandbox/app
RUN chown -R sandbox:sandbox /sandbox/app

USER sandbox

# Install deps first so the layer caches when only source changes.
COPY --chown=sandbox:sandbox package*.json tsconfig.json ./
RUN npm ci

# App source + demo data.
COPY --chown=sandbox:sandbox src ./src
COPY --chown=sandbox:sandbox demo-data ./demo-data

# Compile TypeScript ahead of time so the running container needs only Node.
RUN npx tsc

# CMD is intentionally absent — OpenShell ignores image CMD/ENTRYPOINT and
# expects the start command after `--` in `openshell sandbox create`.
# For reference: `env AGENT_ROLE=… node /sandbox/app/dist/agent-server.js`
