import { AgentRole, ConversationMessage } from "../types";
import { runAgentLoop, AgentLoopResult } from "./agent-loop";
import { getAgentEndpoint } from "./agent-registry";

export interface AgentCallPayload {
  message: string;
  history: ConversationMessage[];
  customerId?: string;
}

/**
 * Talk to a single agent.
 *
 * Transport is selected via `AGENT_TRANSPORT`:
 *   - `in-process` (default) — call `runAgentLoop` directly. Used in tests
 *      and when running the demo on a single laptop without sandbox pods.
 *   - `http` — POST to the agent sandbox's `/agent/chat` endpoint, looked up
 *      via `agent-registry`. Used on Brev when each agent runs in its own
 *      OpenShell sandbox pod.
 */
export async function callAgent(
  role: AgentRole,
  payload: AgentCallPayload
): Promise<AgentLoopResult> {
  const transport = process.env.AGENT_TRANSPORT || "in-process";

  // Only forward user/assistant turns — tool/system turns are reconstructed
  // inside the agent loop from its own system prompt.
  const history = payload.history
    .filter((m) => m.role === "user" || m.role === "assistant")
    .map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

  if (transport === "http") {
    const endpoint = getAgentEndpoint(role);
    const url = `${endpoint.baseUrl}/agent/chat`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: payload.message,
        history,
        customerId: payload.customerId,
      }),
    });

    if (!res.ok) {
      throw new Error(
        `Agent ${role} at ${url} returned HTTP ${res.status}: ${await res.text().catch(() => "")}`
      );
    }
    return (await res.json()) as AgentLoopResult;
  }

  // in-process
  return runAgentLoop({
    role,
    message: payload.message,
    history,
    customerId: payload.customerId,
  });
}
