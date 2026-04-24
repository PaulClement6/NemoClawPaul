import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import {
  AgentConfig,
  AgentRole,
  EscalationRequest,
} from "../types";
import { getAgent } from "../agents";
import { executeToolCall } from "../tools";
import { Session } from "./session";
import { switchPolicy, PolicySwitchEvent } from "./sandbox";

export { PolicySwitchEvent } from "./sandbox";

export interface ToolCallRecord {
  name: string;
  args: Record<string, unknown>;
  result: unknown;
}

export interface SecurityEvent {
  label: string;
  detail: string;
  result: string;
}

export interface RouteResult {
  response: string;
  currentAgent: AgentRole;
  escalation?: EscalationRequest;
  toolCalls: ToolCallRecord[];
  securityEvent?: SecurityEvent;
}

interface ModelResponse {
  content: string | null;
  tool_calls?: Array<{
    id: string;
    function: { name: string; arguments: string };
  }>;
}

function maxToolIterations(): number {
  return Number(process.env.MAX_TOOL_ITERATIONS) || 10;
}

let _client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || process.env.OPENAI_API_KEY || "",
      baseURL:
        process.env.NVIDIA_BASE_URL || "https://integrate.api.nvidia.com/v1",
    });
  }
  return _client;
}

async function callModel(
  messages: ChatCompletionMessageParam[],
  tools: AgentConfig["tools"]
): Promise<ModelResponse> {
  const client = getClient();

  const completion = await client.chat.completions.create({
    model: process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct",
    messages,
    tools: tools as ChatCompletionTool[],
    tool_choice: "auto",
    temperature: 0.2,
  });

  const choice = completion.choices[0];
  if (!choice) {
    return { content: "[No response from model]" };
  }

  const msg = choice.message;
  const toolCalls = msg.tool_calls
    ?.filter((tc) => tc.type === "function")
    .map((tc) => ({
      id: tc.id,
      function: {
        name: tc.function.name,
        arguments: tc.function.arguments,
      },
    }));

  return {
    content: msg.content ?? null,
    tool_calls: toolCalls && toolCalls.length > 0 ? toolCalls : undefined,
  };
}

export class Router {
  private agents: Map<AgentRole, AgentConfig>;

  constructor() {
    const roles: AgentRole[] = [
      "triage",
      "billing",
      "compliance",
      "technical",
      "pricing",
      "claims_analyst",
    ];

    this.agents = new Map();
    for (const role of roles) {
      this.agents.set(role, getAgent(role));
    }
  }

  async route(session: Session, userMessage: string): Promise<RouteResult> {
    session.addMessage({ role: "user", content: userMessage });

    const agentConfig = this.agents.get(session.currentAgent);
    if (!agentConfig) {
      throw new Error(`No agent config for role: ${session.currentAgent}`);
    }

    const toolCalls: ToolCallRecord[] = [];
    let escalation: EscalationRequest | undefined;
    let securityEvent: SecurityEvent | undefined;

    // Build initial message array from session history.
    const messages: ChatCompletionMessageParam[] = [
      { role: "system", content: agentConfig.systemPrompt },
      ...session
        .getHistory()
        .filter((m) => m.role === "user" || m.role === "assistant")
        .map((m) => ({
          role: m.role as "user" | "assistant",
          content: m.content,
        })),
    ];

    const maxIter = maxToolIterations();
    for (let iter = 0; iter < maxIter; iter++) {
      let modelResponse: ModelResponse;
      try {
        modelResponse = await callModel(messages, agentConfig.tools);
      } catch (err: unknown) {
        const detail = err instanceof Error ? err.message : String(err);
        // Network / proxy denials surface here — surface as a security event
        // so the dashboard can render them.
        if (
          detail.toLowerCase().includes("denied") ||
          detail.toLowerCase().includes("blocked") ||
          detail.toLowerCase().includes("forbidden")
        ) {
          securityEvent = {
            label: "Outbound request blocked",
            detail,
            result: "blocked",
          };
        }
        const failMsg = `[Model call failed] ${detail}`;
        session.addMessage({ role: "assistant", content: failMsg });
        return {
          response: failMsg,
          currentAgent: session.currentAgent,
          toolCalls,
          securityEvent,
        };
      }

      if (modelResponse.tool_calls && modelResponse.tool_calls.length > 0) {
        // Append the assistant turn (with tool_calls) to messages exactly
        // as the OpenAI SDK expects it on the next iteration.
        messages.push({
          role: "assistant",
          content: modelResponse.content ?? "",
          tool_calls: modelResponse.tool_calls.map((tc) => ({
            id: tc.id,
            type: "function" as const,
            function: {
              name: tc.function.name,
              arguments: tc.function.arguments,
            },
          })),
        });

        for (const tc of modelResponse.tool_calls) {
          const toolName = tc.function.name;
          let toolArgs: Record<string, unknown>;
          try {
            toolArgs = JSON.parse(tc.function.arguments || "{}");
          } catch {
            toolArgs = {};
          }

          const toolResult = executeToolCall(toolName, toolArgs);
          toolCalls.push({ name: toolName, args: toolArgs, result: toolResult });

          session.addMessage({
            role: "assistant",
            content: `[Tool call: ${toolName}] ${JSON.stringify(toolArgs)}`,
          });
          session.addMessage({
            role: "tool",
            content: JSON.stringify(toolResult),
            tool_call_id: tc.id,
          });

          messages.push({
            role: "tool",
            tool_call_id: tc.id,
            content: JSON.stringify(toolResult),
          });

          if (toolName === "escalate_to_specialist") {
            escalation = toolResult as EscalationRequest;
            const escalationMsg = `Escalating to ${escalation.targetAgent} agent. ${escalation.context}`;
            session.addMessage({ role: "assistant", content: escalationMsg });
            return {
              response: escalationMsg,
              currentAgent: session.currentAgent,
              escalation,
              toolCalls,
              securityEvent,
            };
          }
        }

        // Loop again so the model can incorporate tool results.
        continue;
      }

      // Plain text reply — done.
      const reply =
        modelResponse.content && modelResponse.content.trim().length > 0
          ? modelResponse.content
          : "[No response content from model]";
      session.addMessage({ role: "assistant", content: reply });
      return {
        response: reply,
        currentAgent: session.currentAgent,
        toolCalls,
        securityEvent,
      };
    }

    // Max iterations exhausted — return what we have.
    const guardMsg = `[Max tool iterations (${maxIter}) reached without a final response.]`;
    session.addMessage({ role: "assistant", content: guardMsg });
    return {
      response: guardMsg,
      currentAgent: session.currentAgent,
      toolCalls,
      securityEvent,
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
