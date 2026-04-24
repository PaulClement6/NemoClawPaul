import { AgentConfig, AgentRole } from "../types";
import { createTriageAgent } from "./triage";
import { createBillingAgent } from "./billing";
import { createComplianceAgent } from "./compliance";
import { createTechnicalAgent } from "./technical";

export { createTriageAgent } from "./triage";
export { createBillingAgent } from "./billing";
export { createComplianceAgent } from "./compliance";
export { createTechnicalAgent } from "./technical";

const agentFactories: Record<AgentRole, () => AgentConfig> = {
  triage: createTriageAgent,
  billing: createBillingAgent,
  compliance: createComplianceAgent,
  technical: createTechnicalAgent,
  pricing: createTriageAgent, // Placeholder — pricing shares triage config in demo
  claims_analyst: createTriageAgent, // Placeholder — claims analyst shares triage config in demo
};

/**
 * Returns the AgentConfig for the given role.
 * Throws if the role is not recognised.
 */
export function getAgent(role: AgentRole): AgentConfig {
  const factory = agentFactories[role];
  if (!factory) {
    throw new Error(`Unknown agent role: ${role}`);
  }
  return factory();
}
