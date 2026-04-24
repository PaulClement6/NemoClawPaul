import { AgentRole, EscalationRequest } from "../types";

const VALID_ROLES: AgentRole[] = [
  "triage",
  "billing",
  "compliance",
  "technical",
  "pricing",
  "claims_analyst",
];

/**
 * Create an escalation request to transfer the conversation to a
 * specialist agent. Validates that the target specialist is a
 * recognised agent role.
 */
export function escalateToSpecialist(
  specialist: string,
  context: string,
  customerId: string
): EscalationRequest {
  if (!VALID_ROLES.includes(specialist as AgentRole)) {
    // Return a typed object with error info — callers should check
    // for the targetAgent field to determine success.
    return {
      targetAgent: "triage" as AgentRole,
      context: `[ESCALATION ERROR] Invalid specialist role '${specialist}'. Valid roles: ${VALID_ROLES.join(", ")}. Original context: ${context}`,
      customerId: customerId,
    };
  }

  return {
    targetAgent: specialist as AgentRole,
    context: context,
    customerId: customerId,
  };
}
