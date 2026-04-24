import { describe, it, expect, beforeEach, jest } from "@jest/globals";

// ---------------------------------------------------------------------------
// Mock the OpenAI SDK before the router is imported.  `mockCreate` is exposed
// through the mock factory so each test can script the sequence of responses
// that would come back from NVIDIA NIM.
// ---------------------------------------------------------------------------
jest.mock("openai", () => {
  const create = jest.fn();
  const OpenAI = jest.fn().mockImplementation(() => ({
    chat: { completions: { create } },
  }));
  return { __esModule: true, default: OpenAI, __mockCreate: create };
});

// Disable real NemoClaw policy shell-outs; we only care that the switch was
// attempted.  `dryRun: true` is what we assert against in local dev.
process.env.NEMOCLAW_ENABLED = "false";

import { Router } from "../../src/orchestrator/router";
import { Session } from "../../src/orchestrator/session";

// The module namespace (not the default export) carries __mockCreate.
// `require` gives us the whole object; `import openai from "openai"` would
// only return the default export (the OpenAI class).
// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const mockCreate: any = require("openai").__mockCreate;

/** Build a stub NIM completion that returns a plain-text assistant turn. */
function textCompletion(content: string) {
  return {
    choices: [
      {
        index: 0,
        message: { role: "assistant", content, tool_calls: undefined },
        finish_reason: "stop",
      },
    ],
  };
}

/** Build a stub NIM completion that returns one or more tool calls. */
function toolCallCompletion(
  calls: Array<{ id: string; name: string; args: object }>
) {
  return {
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: null,
          tool_calls: calls.map((c) => ({
            id: c.id,
            type: "function",
            function: {
              name: c.name,
              arguments: JSON.stringify(c.args),
            },
          })),
        },
        finish_reason: "tool_calls",
      },
    ],
  };
}

describe("Router", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns a plain text reply when the model produces no tool calls", async () => {
    mockCreate.mockResolvedValueOnce(textCompletion("Hello, how can I help?"));

    const router = new Router();
    const session = new Session("s-plain", "CUST-001");
    const result = await router.route(session, "Hi there");

    expect(result.response).toBe("Hello, how can I help?");
    expect(result.currentAgent).toBe("triage");
    expect(result.escalation).toBeUndefined();
    expect(result.toolCalls).toEqual([]);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });

  it("executes a tool call and feeds the result back to the model", async () => {
    mockCreate
      .mockResolvedValueOnce(
        toolCallCompletion([
          {
            id: "call_1",
            name: "search_knowledge_base",
            args: { query: "renewal" },
          },
        ])
      )
      .mockResolvedValueOnce(
        textCompletion("Your policy renews on the date in your schedule.")
      );

    const router = new Router();
    const session = new Session("s-tool", "CUST-001");
    const result = await router.route(session, "when does my policy renew?");

    expect(result.response).toContain("Your policy renews");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe("search_knowledge_base");
    expect(result.toolCalls[0].args).toEqual({ query: "renewal" });
    expect(result.escalation).toBeUndefined();

    // Model should have been called twice: once to emit the tool call, once
    // to produce the final answer after seeing the tool result.
    expect(mockCreate).toHaveBeenCalledTimes(2);

    // The second call's `messages` must include a `tool` role message
    // carrying the JSON-encoded tool result.
    const secondCallArgs = mockCreate.mock.calls[1][0] as {
      messages: Array<{ role: string; content: string }>;
    };
    const toolMsg = secondCallArgs.messages.find((m) => m.role === "tool");
    expect(toolMsg).toBeDefined();
    expect(toolMsg!.content).toContain("results");
  });

  it("returns an escalation + dry-run policySwitch when escalate_to_specialist fires", async () => {
    mockCreate.mockResolvedValueOnce(
      toolCallCompletion([
        {
          id: "call_esc",
          name: "escalate_to_specialist",
          args: {
            specialist: "billing",
            context: "Customer disputes a premium increase.",
            customerId: "CUST-001",
          },
        },
      ])
    );

    const router = new Router();
    const session = new Session("s-esc", "CUST-001");
    const result = await router.route(session, "Why did my premium go up?");

    expect(result.escalation).toBeDefined();
    expect(result.escalation!.targetAgent).toBe("billing");
    expect(result.toolCalls).toHaveLength(1);
    expect(result.toolCalls[0].name).toBe("escalate_to_specialist");

    // Only one LLM call — the router must NOT re-invoke the model after an
    // escalation is decided; the next user turn is handled by the new agent.
    expect(mockCreate).toHaveBeenCalledTimes(1);

    // handleEscalation switches the session agent AND fires a policy
    // reload.  In local dev (NEMOCLAW_ENABLED=false) it should be a dry run.
    const policySwitch = router.handleEscalation(session, result.escalation!);
    expect(session.currentAgent).toBe("billing");
    expect(policySwitch.role).toBe("billing");
    expect(policySwitch.policyFile).toMatch(/sandbox-billing\.yaml$/);
    expect(policySwitch.dryRun).toBe(true);
    expect(policySwitch.applied).toBe(false);
  });

  it("stops the tool loop at MAX_TOOL_ITERATIONS to prevent runaway agents", async () => {
    // Always return a tool call — loop should bail after the guard trips.
    mockCreate.mockResolvedValue(
      toolCallCompletion([
        {
          id: "call_loop",
          name: "search_knowledge_base",
          args: { query: "anything" },
        },
      ])
    );

    // MAX_TOOL_ITERATIONS is read lazily per-request, so setting the env
    // var here is enough — no module reset needed.
    process.env.MAX_TOOL_ITERATIONS = "3";
    try {
      const router = new Router();
      const session = new Session("s-loop", "CUST-001");
      const result = await router.route(session, "loop forever");

      expect(result.response).toMatch(/Max tool iterations/i);
      expect(result.toolCalls.length).toBe(3);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    } finally {
      delete process.env.MAX_TOOL_ITERATIONS;
    }
  });

  it("surfaces transport denials as securityEvent", async () => {
    mockCreate.mockRejectedValueOnce(
      new Error("Request blocked by L7 proxy: endpoint not in current policy")
    );

    const router = new Router();
    const session = new Session("s-sec", "CUST-001");
    const result = await router.route(session, "trigger a block");

    expect(result.response).toMatch(/Model call failed/);
    expect(result.securityEvent).toBeDefined();
    expect(result.securityEvent!.result).toBe("blocked");
    expect(result.securityEvent!.detail).toMatch(/blocked by L7 proxy/);
  });
});
