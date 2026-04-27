import "dotenv/config";
import express, { Request, Response } from "express";
import { AgentRole } from "./types";
import { runAgentLoop } from "./orchestrator/agent-loop";

const VALID_ROLES: AgentRole[] = [
  "triage",
  "billing",
  "compliance",
  "technical",
  "pricing",
  "claims_analyst",
];

function loadRole(): AgentRole {
  const raw = process.env.AGENT_ROLE;
  if (!raw) {
    throw new Error(
      `AGENT_ROLE env var is required (one of: ${VALID_ROLES.join(", ")})`
    );
  }
  if (!VALID_ROLES.includes(raw as AgentRole)) {
    throw new Error(
      `Invalid AGENT_ROLE='${raw}'. Must be one of: ${VALID_ROLES.join(", ")}`
    );
  }
  return raw as AgentRole;
}

export function createAgentApp(role: AgentRole): express.Express {
  const app = express();
  app.use(express.json({ limit: "1mb" }));

  app.use((req, _res, next) => {
    console.log(
      `[${new Date().toISOString()}] [agent:${role}] ${req.method} ${req.path}`
    );
    next();
  });

  app.get("/health", (_req: Request, res: Response) => {
    res.json({
      status: "ok",
      role,
      model: process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct",
    });
  });

  app.post("/agent/chat", async (req: Request, res: Response) => {
    try {
      const { message, history, customerId } = req.body as {
        message?: string;
        history?: Array<{ role: "user" | "assistant"; content: string }>;
        customerId?: string;
      };

      if (!message || typeof message !== "string") {
        res.status(400).json({ error: '"message" field is required.' });
        return;
      }

      const result = await runAgentLoop({
        role,
        message,
        history: Array.isArray(history) ? history : [],
        customerId,
      });

      res.json(result);
    } catch (err: unknown) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error(`[agent:${role}] /agent/chat error:`, detail);
      res.status(500).json({ error: detail });
    }
  });

  return app;
}

if (require.main === module) {
  const role = loadRole();
  const app = createAgentApp(role);
  // Inside the sandbox container we listen on 3000; OpenShell's `--forward`
  // maps the host port (8081–8086) to this internal 3000.
  const port = Number(process.env.AGENT_PORT) || 3000;
  app.listen(port, () => {
    console.log(`[agent:${role}] listening on http://localhost:${port}`);
  });
}
