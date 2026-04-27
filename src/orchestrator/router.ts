import { AgentRole, EscalationRequest } from "../types";
import { Session } from "./session";
import { callAgent } from "./agent-client";
import { switchPolicy, PolicySwitchEvent } from "./sandbox";
import {
  AgentLoopResult,
  ToolCallRecord,
  SecurityEvent,
} from "./agent-loop";

export { ToolCallRecord, SecurityEvent } from "./agent-loop";
export { PolicySwitchEvent } from "./sandbox";

export interface RouteResult {
  response: string;
  currentAgent: AgentRole;
  escalation?: EscalationRequest;
  toolCalls: ToolCallRecord[];
  securityEvent?: SecurityEvent;
}

/**
 * The orchestrator's per-session dispatcher.
 *
 * `Router.route()` does NOT run the LLM tool loop in-process — that lives in
 * `agent-loop.ts`, behind `callAgent()`'s pluggable transport (in-process or
 * HTTP to a sandbox pod). The Router's job is session bookkeeping and
 * agent-switch / policy-switch coordination.
 *
 * The dev-server orchestrator may call `route()` twice for a single user
 * turn — once for the originating agent, then again (after `handleEscalation`)
 * for the specialist. `route()` detects re-entry and avoids re-adding the
 * same user message.
 */
export class Router {
  async route(session: Session, userMessage: string): Promise<RouteResult> {
    // Avoid duplicating the user turn if we're being called for a
    // post-escalation continuation (same message, same session).
    const hist = session.getHistory();
    const last = hist[hist.length - 1];
    const alreadyAdded =
      last?.role === "user" && last.content === userMessage;
    if (!alreadyAdded) {
      session.addMessage({ role: "user", content: userMessage });
    }

    // Build the history passed to the agent: prior user/assistant turns only
    // (no tool sentinels, no system handoff lines, no trailing user msg).
    const passHistory = session
      .getHistory()
      .filter((m) => m.role === "user" || m.role === "assistant")
      .filter(
        (m) =>
          !(m.role === "assistant" && m.content.startsWith("[Tool call:"))
      )
      .slice(0, -1);

    const result: AgentLoopResult = await callAgent(session.currentAgent, {
      message: userMessage,
      history: passHistory,
      customerId: session.customerId,
    });

    if (result.escalation) {
      // Escalation in flight — the orchestrator caller will run the policy
      // switch and (if it wants) call route() again with the new agent.
      return {
        response: result.response,
        currentAgent: session.currentAgent,
        escalation: result.escalation,
        toolCalls: result.toolCalls,
        securityEvent: result.securityEvent,
      };
    }

    if (result.response) {
      session.addMessage({ role: "assistant", content: result.response });
    }

    return {
      response: result.response,
      currentAgent: session.currentAgent,
      toolCalls: result.toolCalls,
      securityEvent: result.securityEvent,
    };
  }

  handleEscalation(
    session: Session,
    escalation: EscalationRequest
  ): PolicySwitchEvent {
    session.switchAgent(escalation.targetAgent);
    return switchPolicy(escalation.targetAgent);
  }
}
