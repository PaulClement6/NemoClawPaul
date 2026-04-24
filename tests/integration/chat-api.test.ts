import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import request from "supertest";

jest.mock("openai", () => {
  const create = jest.fn();
  const OpenAI = jest.fn().mockImplementation(() => ({
    chat: { completions: { create } },
  }));
  return { __esModule: true, default: OpenAI, __mockCreate: create };
});

process.env.NEMOCLAW_ENABLED = "false";
process.env.NODE_ENV = "test";

import { app } from "../../src/dev-server";

// eslint-disable-next-line @typescript-eslint/no-var-requires, @typescript-eslint/no-explicit-any
const mockCreate: any = require("openai").__mockCreate;

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

describe("POST /chat — enriched payload", () => {
  beforeEach(() => {
    mockCreate.mockReset();
  });

  it("returns sessionId + response + currentAgent for a simple FAQ reply", async () => {
    mockCreate.mockResolvedValueOnce(
      textCompletion("Your policy renews on the date in your schedule.")
    );

    const res = await request(app)
      .post("/chat")
      .send({
        message: "when does my policy renew?",
        customerId: "CUST-001",
      })
      .expect(200);

    expect(res.body.sessionId).toEqual(expect.any(String));
    expect(res.body.response).toContain("Your policy renews");
    expect(res.body.currentAgent).toBe("triage");
    // No tools called → toolCalls and escalation are omitted.
    expect(res.body.toolCalls).toBeUndefined();
    expect(res.body.escalation).toBeUndefined();
    expect(res.body.policySwitch).toBeUndefined();
  });

  it("includes toolCalls[] when the agent uses a tool", async () => {
    mockCreate
      .mockResolvedValueOnce(
        toolCallCompletion([
          {
            id: "call_kb",
            name: "search_knowledge_base",
            args: { query: "renewal" },
          },
        ])
      )
      .mockResolvedValueOnce(
        textCompletion("Here is what I found about renewal.")
      );

    const res = await request(app)
      .post("/chat")
      .send({ message: "tell me about renewal", customerId: "CUST-001" })
      .expect(200);

    expect(res.body.toolCalls).toHaveLength(1);
    expect(res.body.toolCalls[0].name).toBe("search_knowledge_base");
    expect(res.body.toolCalls[0].result).toHaveProperty("results");
  });

  it("includes escalation + policySwitch when triage hands off to a specialist", async () => {
    mockCreate.mockResolvedValueOnce(
      toolCallCompletion([
        {
          id: "call_esc",
          name: "escalate_to_specialist",
          args: {
            specialist: "billing",
            context: "Premium dispute.",
            customerId: "CUST-001",
          },
        },
      ])
    );

    const res = await request(app)
      .post("/chat")
      .send({ message: "my premium went up", customerId: "CUST-001" })
      .expect(200);

    expect(res.body.currentAgent).toBe("billing");
    expect(res.body.escalation).toEqual({
      targetAgent: "billing",
      context: "Premium dispute.",
    });
    expect(res.body.policySwitch).toMatchObject({
      role: "billing",
      applied: false,
      dryRun: true,
    });
    expect(res.body.policySwitch.policyFile).toMatch(/sandbox-billing\.yaml$/);
  });

  it("rejects an empty body with 400", async () => {
    const res = await request(app).post("/chat").send({}).expect(400);
    expect(res.body.error).toMatch(/message/);
  });
});

describe("GET /health", () => {
  it("reports ok, known agents, model, and nemoclawEnabled flag", async () => {
    const res = await request(app).get("/health").expect(200);
    expect(res.body.status).toBe("ok");
    expect(res.body.agents).toEqual(
      expect.arrayContaining(["triage", "billing", "compliance", "technical"])
    );
    expect(typeof res.body.model).toBe("string");
    expect(res.body.nemoclawEnabled).toBe(false);
  });
});
