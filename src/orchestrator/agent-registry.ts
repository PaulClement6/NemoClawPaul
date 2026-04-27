import { AgentRole } from "../types";

export interface AgentEndpoint {
  role: AgentRole;
  /** Name of the OpenShell sandbox (e.g. `agent-billing`). */
  sandboxName: string;
  /** Path to the role's network policy YAML, relative to repo root. */
  policyFile: string;
  /** Host-side port the orchestrator hits (mapped from container's :3000 by `openshell forward`). */
  port: number;
  /** Full base URL the orchestrator forwards to. */
  baseUrl: string;
}

const HOST = process.env.AGENT_HOST || "127.0.0.1";

/**
 * Single source of truth for "which role maps to which sandbox + port + policy".
 *
 * Notes:
 * - The role `claims_analyst` maps to sandbox `agent-claims` and policy
 *   `sandbox-claims.yaml` so the YAML/CLI surface stays short.
 * - Port range 8081–8086 is empty on a stock NVIDIA Brev instance
 *   (3000/3001/8080/18789 are pre-occupied — see CLAUDE.md "Port Map").
 */
export const agentRegistry: Record<AgentRole, AgentEndpoint> = {
  triage: {
    role: "triage",
    sandboxName: "agent-triage",
    policyFile: "policies/sandbox-triage.yaml",
    port: 8081,
    baseUrl: `http://${HOST}:8081`,
  },
  billing: {
    role: "billing",
    sandboxName: "agent-billing",
    policyFile: "policies/sandbox-billing.yaml",
    port: 8082,
    baseUrl: `http://${HOST}:8082`,
  },
  compliance: {
    role: "compliance",
    sandboxName: "agent-compliance",
    policyFile: "policies/sandbox-compliance.yaml",
    port: 8083,
    baseUrl: `http://${HOST}:8083`,
  },
  technical: {
    role: "technical",
    sandboxName: "agent-technical",
    policyFile: "policies/sandbox-technical.yaml",
    port: 8084,
    baseUrl: `http://${HOST}:8084`,
  },
  pricing: {
    role: "pricing",
    sandboxName: "agent-pricing",
    policyFile: "policies/sandbox-pricing.yaml",
    port: 8085,
    baseUrl: `http://${HOST}:8085`,
  },
  claims_analyst: {
    role: "claims_analyst",
    sandboxName: "agent-claims",
    policyFile: "policies/sandbox-claims.yaml",
    port: 8086,
    baseUrl: `http://${HOST}:8086`,
  },
};

export function getAgentEndpoint(role: AgentRole): AgentEndpoint {
  const ep = agentRegistry[role];
  if (!ep) throw new Error(`No registry entry for role: ${role}`);
  return ep;
}
