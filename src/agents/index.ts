import { AgentConfig, AgentRole } from "../types";
import { createTriageAgent } from "./triage";
import { createBillingAgent } from "./billing";
import { createComplianceAgent } from "./compliance";
import { createTechnicalAgent } from "./technical";
import { createPricingAgent } from "./pricing";
import { createClaimsAnalystAgent } from "./claims_analyst";

export { createTriageAgent } from "./triage";
export { createBillingAgent } from "./billing";
export { createComplianceAgent } from "./compliance";
export { createTechnicalAgent } from "./technical";
export { createPricingAgent } from "./pricing";
export { createClaimsAnalystAgent } from "./claims_analyst";

const agentFactories: Record<AgentRole, () => AgentConfig> = {
  triage: createTriageAgent,
  billing: createBillingAgent,
  compliance: createComplianceAgent,
  technical: createTechnicalAgent,
  pricing: createPricingAgent,
  claims_analyst: createClaimsAnalystAgent,
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
