import "dotenv/config";
import express, { Request, Response } from "express";
import cors from "cors";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import { Router } from "./orchestrator/router";
import { Session } from "./orchestrator/session";

const app = express();
app.use(cors());
app.use(express.json());

// ── Serve dashboard UI ──────────────────────────────────────────────
app.get("/", (_req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "ui", "dashboard.html"));
});

// ── In-memory session store ──────────────────────────────────────────
const sessions = new Map<string, Session>();
const router = new Router();

// ── Request logging middleware ───────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// ── POST /chat ───────────────────────────────────────────────────────
app.post("/chat", async (req: Request, res: Response) => {
  try {
    const { sessionId, customerId, message } = req.body as {
      sessionId?: string;
      customerId?: string;
      message: string;
    };

    if (!message || typeof message !== "string") {
      res.status(400).json({ error: "\"message\" field is required." });
      return;
    }

    let sid = sessionId;
    let session: Session;

    if (sid && sessions.has(sid)) {
      session = sessions.get(sid)!;
    } else {
      sid = sid ?? uuidv4();
      session = new Session(sid, customerId);
      sessions.set(sid, session);
    }

    const result = await router.route(session, message);

    let policySwitch;
    if (result.escalation) {
      policySwitch = router.handleEscalation(session, result.escalation);
    }

    const payload: Record<string, unknown> = {
      sessionId: session.sessionId,
      response: result.response,
      currentAgent: session.currentAgent,
    };

    if (result.toolCalls && result.toolCalls.length > 0) {
      payload.toolCalls = result.toolCalls;
    }
    if (result.escalation) {
      payload.escalation = {
        targetAgent: result.escalation.targetAgent,
        context: result.escalation.context,
      };
    }
    if (policySwitch) {
      payload.policySwitch = policySwitch;
    }
    if (result.securityEvent) {
      payload.securityEvent = result.securityEvent;
    }

    res.json(payload);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("POST /chat error:", msg);
    res.status(500).json({ error: msg });
  }
});

// ── GET /sessions/:id ────────────────────────────────────────────────
app.get("/sessions/:id", (req: Request, res: Response) => {
  const session = sessions.get(req.params.id);
  if (!session) {
    res.status(404).json({ error: "Session not found." });
    return;
  }
  res.json(session.toJSON());
});

// ── GET /health ──────────────────────────────────────────────────────
app.get("/health", (_req: Request, res: Response) => {
  const agentRoles = [
    "triage",
    "billing",
    "compliance",
    "technical",
    "pricing",
    "claims_analyst",
  ];
  res.json({
    status: "ok",
    agents: agentRoles,
    model: process.env.NVIDIA_MODEL || "meta/llama-3.1-70b-instruct",
    nemoclawEnabled: process.env.NEMOCLAW_ENABLED === "true",
  });
});

// ── Start ────────────────────────────────────────────────────────────
export { app };

if (require.main === module) {
  const PORT = Number(process.env.PORT) || 3000;
  app.listen(PORT, () => {
    console.log(`NemoClaw dev-server listening on http://localhost:${PORT}`);
  });
}
