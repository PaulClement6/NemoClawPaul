import OpenAI from "openai";
import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "openai/resources/chat/completions";
import { AgentConfig, AgentRole, EscalationRequest } from "../types";
import { getAgent } from "../agents";
import { executeToolCall } from "../tools";

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

export interface AgentLoopRequest {
  role: AgentRole;
  message: string;
  history: Array<{ role: "user" | "assistant"; content: string }>;
  customerId?: string;
}

export interface AgentLoopResult {
  role: AgentRole;
  response: string;
  toolCalls: ToolCallRecord[];
  escalation?: EscalationRequest;
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

/**
 * Run the agentic tool loop for ONE agent role, statelessly.
 *
 * - Builds the OpenAI-format messages array from system prompt + history + new user message.
 * - Calls the model, executes any tool calls, feeds results back, repeats until
 *   the model produces a text response, an escalation, or the iteration cap fires.
 * - Returns a stateless result: response text, tool-call records, optional escalation/security event.
 *
 * This is what runs INSIDE each sandbox pod (via agent-server.ts) and ALSO what the
 * orchestrator calls in-process during local development (via agent-client.ts).
 */
export async function runAgentLoop(
  req: AgentLoopRequest
): Promise<AgentLoopResult> {
  const agentConfig = getAgent(req.role);

  const toolCalls: ToolCallRecord[] = [];
  let escalation: EscalationRequest | undefined;
  let securityEvent: SecurityEvent | undefined;

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: agentConfig.systemPrompt },
    ...req.history.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    { role: "user", content: req.message },
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
      return {
        role: req.role,
        response: `[Model call failed] ${detail}`,
        toolCalls,
        securityEvent,
      };
    }

    if (modelResponse.tool_calls && modelResponse.tool_calls.length > 0) {
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

        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(toolResult),
        });

        if (toolName === "escalate_to_specialist") {
          escalation = toolResult as EscalationRequest;
          break;
        }
      }

      if (escalation) break;
      continue;
    }

    const reply =
      modelResponse.content && modelResponse.content.trim().length > 0
        ? modelResponse.content
        : "[No response content from model]";
    return {
      role: req.role,
      response: reply,
      toolCalls,
      securityEvent,
    };
  }

  if (escalation) {
    return {
      role: req.role,
      response: "",
      escalation,
      toolCalls,
      securityEvent,
    };
  }

  return {
    role: req.role,
    response: `[Max tool iterations (${maxIter}) reached without a final response.]`,
    toolCalls,
    securityEvent,
  };
}
