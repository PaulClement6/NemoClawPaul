# CLAUDE.md — NemoClaw Demo Project

> Paul uses this file to sync context between Claude Code (IDE) and Claude Cowork (planning).
> Update after every significant change.

---

## Project Overview

**NemoClaw Demo** is a multi-agent customer support system for **Meridian Insurance Group**
(fictional UK insurer), built on the NVIDIA NemoClaw stack. EY consulting demo by Paul Clement,
targeting banks, insurers, and reinsurers.

**The goal:** a real, working system where every agent makes real LLM calls, every tool executes
against real data, and every security policy is enforced by kernel-level sandboxing.

---

## Architecture (OpenClaw Native — May 2026)

The demo runs **natively on OpenClaw**, the agent framework installed by NemoClaw. No custom
orchestrator needed — OpenClaw handles routing, sessions, tools, and sandbox enforcement.

### The 3-Layer Stack

```
NemoClaw (installer/blueprint — sets up the whole environment)
  └── OpenClaw (agent framework — Gateway on port 18789, 25+ built-in tools)
       └── OpenShell (kernel-level sandbox — Landlock, seccomp, netns, L7 Rust proxy)
```

### How It Works

1. All messages arrive at the **Triage agent** (default)
2. Triage classifies intent and either answers (FAQ) or uses **`sessions_spawn`** to route to a specialist
3. `sessions_spawn` is **non-blocking** — returns `{ status: "accepted", runId }` immediately
4. The specialist agent processes the query using its domain-specific tools and skills
5. The specialist announces its result back to the chat when finished
6. All agents run inside **OpenShell sandboxes** with per-agent security policies

### Agent Roster

| Agent | ID | Role | Key Data Sources |
|-------|-----|------|-----------------|
| Triage | `triage` | Front-desk router, FAQ | faq.json, customers.json |
| Billing | `billing` | Payments, premiums, refunds | billing-history.json, customers.json |
| Compliance | `compliance` | GDPR, data retention, sharing | compliance-docs/*.md, customers.json |
| Technical | `technical` | Portal, claims status, uploads | claims.json, customers.json |
| Pricing | `pricing` | Quotes, discounts, cover levels | customers.json, faq.json |
| Claims Analyst | `claims_analyst` | Investigations, settlements | claims.json, customers.json |

### Key Configuration Patterns

**Triage** (the only agent that can spawn others):
- `tools.profile: "minimal"` + `alsoAllow: ["read", "sessions_spawn", "subagents", "agents_list", ...]`
- `subagents.allowAgents: ["billing", "compliance", "technical", "pricing", "claims_analyst"]`
- `subagents.requireAgentId: true`

**Specialists** (cannot spawn, can only respond):
- `tools.profile: "minimal"` + `alsoAllow: ["read", "memory_search", "sessions_send", "session_status"]`
- `deny: ["write", "edit", "exec", "sessions_spawn", ...]`
- `subagents.allowAgents: []`

**All agents**:
- Model: `nvidia/nvidia/nemotron-3-super-120b-a12b` (NVIDIA NIM, bundled provider)
- Sandbox: `backend: "openshell"`, `mode: "all"`, `scope: "agent"`, `workspaceAccess: "ro"`
- Each has a `systemPromptOverride` containing full domain knowledge and personality

---

## File Map

```
nemoclaw-demo/
  CLAUDE.md                              <-- THIS FILE
  AGENTS.md                              <-- Shared operational instructions (injected into sub-agents)
  SOUL.md                                <-- Personality guide (main sessions only, NOT sub-agents)
  openclaw.json                          <-- OpenClaw config: 6 agents, tools, skills, sandbox settings

  skills/                                <-- OpenClaw skills (YAML frontmatter + markdown)
    meridian-triage/SKILL.md             <-- Intent classification, routing rules, FAQ lookup
    meridian-billing/SKILL.md            <-- Premium factors, payment methods, refund process
    meridian-compliance/SKILL.md         <-- GDPR rights, data retention, DSARs, third-party sharing
    meridian-technical/SKILL.md          <-- Claims stages, portal troubleshooting, upload specs
    meridian-pricing/SKILL.md            <-- Discount schedule, premium factors, cover levels
    meridian-claims/SKILL.md             <-- 5-step claims process, settlements, fraud awareness

  demo-data/                             <-- Read-only data (accessed via `read` tool)
    customers.json                       <-- 5 Meridian customers
    billing-history.json                 <-- 16 billing records
    claims.json                          <-- 4 claims
    faq.json                             <-- 18 FAQ entries
    compliance-docs/
      gdpr-summary.md
      data-retention-policy.md
      third-party-sharing.md

  src/                                   <-- LEGACY: Express orchestrator (reference/fallback)
    dev-server.ts                        <-- Express server (local dev without OpenClaw)
    agent-server.ts                      <-- Per-agent HTTP server (microservice mode)
    types.ts                             <-- Shared TypeScript interfaces
    agents/*.ts                          <-- Agent definitions (system prompts + tool schemas)
    orchestrator/*.ts                    <-- Router, agent-loop, sandbox, session management
    tools/*.ts                           <-- 12 tool functions + exfiltrate-data demo tool
    ui/dashboard.html                    <-- 3-panel dashboard (agents, chat, logs)

  policies/                              <-- OpenShell sandbox policy YAMLs
    sandbox-triage.yaml                  <-- Most restrictive (inference only)
    sandbox-billing.yaml                 <-- Inference + billing endpoint (GET)
    sandbox-compliance.yaml              <-- Inference + docs endpoint (read-only)
    sandbox-technical.yaml               <-- Inference + claims + portal endpoints
    sandbox-pricing.yaml
    sandbox-claims.yaml

  Dockerfile                             <-- Single image, role via AGENT_ROLE env var
  scripts/create-sandboxes.sh            <-- Creates 6 OpenShell sandbox pods on Brev
  tests/                                 <-- 22 tests (unit, integration, security)

  guardrails/                            <-- Lot 3 stubs (NeMo Guardrails)
  models/                                <-- Lot 2 stubs (Python ML models)
```

---

## Important Technical Details

### tools.allow vs tools.alsoAllow
- `allow` is a **restrictive allowlist** — everything else is blocked
- `alsoAllow` **adds** tools to the profile without blocking others
- We use `alsoAllow` everywhere to keep the `minimal` profile's base tools

### Sub-agent Context Limitation
Sub-agents spawned via `sessions_spawn` only get **AGENTS.md + TOOLS.md** injected.
They do NOT get SOUL.md, IDENTITY.md, USER.md, etc. That's why:
- `AGENTS.md` contains shared operational instructions for all agents
- Each agent's `systemPromptOverride` already includes personality and domain knowledge

### systemPromptOverride Behaviour
When `systemPromptOverride` is set, it **replaces the entire** OpenClaw-assembled system prompt.
Skills are NOT injected into the prompt (but our overrides already contain all domain knowledge).

### NVIDIA Model ID Format
The model ID uses a double `nvidia/` prefix: `nvidia/nvidia/nemotron-3-super-120b-a12b`.
First `nvidia/` is the provider ID, second is part of NVIDIA's model naming convention.

### sessions_spawn is Non-Blocking
The parameter is `task` (not `message`). Returns immediately with `{ status: "accepted", runId, childSessionKey }`.
The specialist announces its result back when done — do NOT poll or wait.

---

## NVIDIA Brev Infrastructure

| Instance | ID | Status |
|----------|-----|--------|
| nemoclaw-d4f028 (active) | 7jwrynsiq | RUNNING |
| nemoclaw-b52392 (backup) | ikz5vb2aj | STOPPED |

- **Pre-installed**: NemoClaw v0.0.7, OpenShell v0.0.24, Node v22, k3s, containerd
- **Host ports**: 3000 (Traefik), 3001 (Brev), 8080 (OpenShell gateway), 18789 (OpenClaw UI forwarded from sandbox)
- **Cost**: $0.04/hr — stop from NVIDIA dashboard when not using

---

## NemoClaw Sandbox Architecture (CRITICAL — May 2026 Discovery)

NemoClaw is NOT just an installer — it creates isolated **Docker sandbox containers** managed by OpenShell. OpenClaw runs INSIDE the sandbox, not on the host.

### The Real Architecture

```
Host (Brev Instance)
  ├── NemoClaw CLI (/usr/bin/nemoclaw)
  ├── OpenShell Gateway (port 8080, manages sandboxes)
  └── Docker container "insurance-usecase"    ← OUR SANDBOX
       ├── OpenClaw 2026.3.11 (Gateway on port 18789)
       ├── Landlock + seccomp + netns isolation
       ├── L7 Rust proxy (all egress filtered)
       └── Node.js runtime
```

### Sandbox Filesystem Layout

```
/sandbox/                           ← home dir, workdir
  .openclaw/                        ← READ-ONLY (root-owned, Landlock enforced)
    openclaw.json                   ← main config (CANNOT be modified at runtime)
    agents/ → .openclaw-data/agents/     ← symlink to writable
    skills/ → .openclaw-data/skills/     ← symlink to writable
    canvas/ → .openclaw-data/canvas/     ← symlink to writable
    workspace/ → .openclaw-data/workspace/ ← symlink to writable
    memory/ → .openclaw-data/memory/
    hooks/ → .openclaw-data/hooks/
    identity/ → .openclaw-data/identity/
  .openclaw-data/                   ← READ-WRITE (sandbox user)
    agents/                         ← agent state directories
      main/agent/models.json        ← default agent (created by onboard)
    skills/                         ← custom SKILL.md files go here
    canvas/                         ← dashboard HTML goes here
      index.html                    ← default NemoClaw dashboard
    workspace/                      ← working data files go here
    memory/                         ← persistent agent memory
    hooks/                          ← agent hooks
    identity/                       ← agent identity files
  .nemoclaw/                        ← NemoClaw plugin + blueprints
    blueprints/0.1.0/               ← default blueprint
```

### Key Constraint: openclaw.json is LOCKED

The file `/sandbox/.openclaw/openclaw.json` is:
- Owned by root
- Read-only (Landlock enforced)
- Its SHA256 hash is stored in `.config-hash` and verified
- CANNOT be modified at runtime

This means we CANNOT use our monolithic `openclaw.json` with `agents.list[]` directly. Instead, we must use the **OpenClaw CLI** to add agents via file-based configuration.

### How Agents Work in the Sandbox

Each agent is a directory in `/sandbox/.openclaw-data/agents/<name>/agent/`:
- `models.json` — model/provider configuration
- The workspace directory contains AGENTS.md, data files, skills

Agent management commands (run INSIDE the sandbox via `nemoclaw <name> connect`):
- `openclaw agents add <name> --workspace <dir> --model <id> --non-interactive` — create agent
- `openclaw agents set-identity --agent <id> --name "..." --emoji "..." --theme "..."` — set identity
- `openclaw agents bind --agent <id> --bind <channel>` — route messages
- `openclaw agents list` — show all agents
- `openclaw agents delete <name>` — remove agent

### How Inference Works

All LLM calls route through OpenShell's L7 proxy:
```
Agent → https://inference.local/v1 → L7 Proxy → integrate.api.nvidia.com → Nemotron 120B
```
- The proxy terminates TLS and enforces method/path rules
- Only POST /v1/chat/completions, /v1/completions, /v1/embeddings and GET /v1/models are allowed
- The NVIDIA API key is stored in `~/.nemoclaw/credentials.json` on the host (mode 600)
- Inside the sandbox, inference uses `apiKey: "unused"` because the proxy handles auth

### Network Policies (Active)

The sandbox has these network policies enforced by the L7 proxy:
- `nvidia` — integrate.api.nvidia.com, inference-api.nvidia.com (inference only)
- `github` — github.com, api.github.com (full access)
- `npm_registry` — registry.npmjs.org (GET only)
- `pypi` — pypi.org, files.pythonhosted.org (added via preset)
- `claude_code` — api.anthropic.com (POST /v1/messages only)
- `openclaw_api` — openclaw.ai, docs.openclaw.ai
- `clawhub` — clawhub.ai
- `discord`, `telegram` — messaging APIs (not active for our demo)
- ALL OTHER EGRESS IS BLOCKED

### NemoClaw CLI Commands (run from HOST)

```bash
nemoclaw list                              # list sandboxes
nemoclaw insurance-usecase status          # sandbox health + policies
nemoclaw insurance-usecase connect         # shell into sandbox
nemoclaw insurance-usecase logs --follow   # stream sandbox logs
nemoclaw insurance-usecase destroy         # delete sandbox
nemoclaw insurance-usecase policy-add      # add network policy preset
nemoclaw insurance-usecase policy-list     # list active policies
```

### Onboarding Details (Completed 2026-05-01)

- Sandbox name: `insurance-usecase`
- Sandbox ID: `71f18890-5591-4a0a-8f78-7498f124995d`
- Phase: Ready
- Inference: NVIDIA Endpoints → nvidia/nemotron-3-super-120b-a12b
- Provider: nvidia-prod
- API: openai-responses
- GPU: none (cloud inference)
- Policies: pypi, npm (added), + all defaults
- Dashboard token: f8029eab2ad9b5508f14e71b955478bf358072ed0b0b36ca4aa384f29f08493e
- Dashboard URL: http://127.0.0.1:18789/#token=<above>

---

## Deployment Plan (Revised — Sandbox-Native)

Our original `deploy-brev.sh` and `deploy-brev.yml` assumed OpenClaw ran on the host. Now we know it runs INSIDE a sandbox container. The deployment must work differently:

### Step 1: Create Workspace Directories (inside sandbox)
```bash
mkdir -p /sandbox/.openclaw-data/workspace/meridian/demo-data/compliance-docs
mkdir -p /sandbox/.openclaw-data/workspace/meridian/policies
```

### Step 2: Copy Demo Data (into sandbox workspace)
Customer JSON, billing, claims, FAQ, compliance docs → workspace/meridian/demo-data/

### Step 3: Copy Skills (into sandbox skills dir)
6 SKILL.md files → /sandbox/.openclaw-data/skills/meridian-*/SKILL.md

### Step 4: Create Agents via CLI
```bash
openclaw agents add triage --workspace /sandbox/.openclaw-data/workspace/meridian --model inference/nvidia/nemotron-3-super-120b-a12b --non-interactive
openclaw agents set-identity --agent triage --name "Meridian Support" --emoji "🏠" --theme "professional UK insurance customer support front-desk"
# ... repeat for billing, compliance, technical, pricing, claims-analyst
```

### Step 5: Write AGENTS.md into Each Agent Workspace
Each agent's workspace needs an AGENTS.md with its system prompt and operating instructions.

### Step 6: Deploy Dashboard
Replace /sandbox/.openclaw-data/canvas/index.html with our dashboard-v2.html

### Step 7: Verify
```bash
openclaw agents list  # should show 7 agents (main + 6 Meridian)
```

### Open Questions
- How does `systemPromptOverride` work via files? Likely via AGENTS.md in the workspace
- Can multiple agents share a workspace (demo-data), or does each need its own copy?
- How to configure triage as the default agent and set up routing?
- How to restrict tool access per-agent without modifying openclaw.json?

---

## Next Steps

### Immediate (In Progress)
1. Write injection script to create 6 agents + data inside the sandbox
2. Test `openclaw agents add` + `set-identity` for one agent first
3. Deploy all 6 agents with skills and demo data
4. Test multi-agent routing via OpenClaw Control UI
5. Deploy custom dashboard to canvas

### Future
- Configure Ollama as second provider for hybrid cloud/local privacy routing
- Wire dashboard UI to OpenClaw's WebSocket API for live streaming
- Lot 2: RAG (FAISS + embeddings), ML pricing/claims models
- Lot 3: NeMo Guardrails (jailbreak, PII redaction, topical constraints)

---

## Legacy Express Architecture

The `src/` directory contains a complete Express-based orchestrator that was built before
we discovered OpenClaw. It remains useful as:
- A **reference implementation** showing the agent logic in TypeScript
- A **local testing environment** (works on MacBook without OpenClaw/Brev)
- A **fallback** if OpenClaw doesn't meet specific demo needs

To run locally: `cp .env.example .env` → set `NVIDIA_API_KEY` → `npm install` → `npm run dev`

### Tests (22 passing)
- `tests/unit/tools.test.ts` — 6 tool function tests
- `tests/unit/router.test.ts` — 6 router tests (OpenAI SDK mocked)
- `tests/integration/chat-api.test.ts` — 4 end-to-end API tests
- `tests/security/injection.test.ts` — 6 security scenarios

---

## Notes for Claude Code

- `getCustomerProfile()` strips sensitive data (city only) — intentional for compliance story
- The `FaqEntry` interface has `id`/`keywords` fields not in the actual JSON — handled gracefully
- Dashboard's `simulateResponse()` is offline fallback only
- Keep dashboard as a single HTML file
- **Always run `npm run build && npm test` after changes**
- **Always update this file after completing work**
