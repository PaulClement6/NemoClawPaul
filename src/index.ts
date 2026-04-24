import "dotenv/config";
import * as readline from "readline";
import { v4 as uuidv4 } from "uuid";
import { Router } from "./orchestrator/router";
import { Session } from "./orchestrator/session";

async function main(): Promise<void> {
  const router = new Router();
  const session = new Session(uuidv4());

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("NemoClaw Demo — Meridian Insurance Support");
  console.log(`Session: ${session.sessionId}`);
  console.log('Type your message and press Enter. Type "quit" or Ctrl+C to exit.\n');

  const prompt = (): void => {
    rl.question("You> ", async (input: string) => {
      const trimmed = input.trim();

      if (trimmed.toLowerCase() === "quit") {
        console.log("Goodbye.");
        rl.close();
        process.exit(0);
      }

      if (!trimmed) {
        prompt();
        return;
      }

      try {
        const result = await router.route(session, trimmed);

        // Handle escalation
        if (result.escalation) {
          console.log(
            `\n[Escalating to ${result.escalation.targetAgent}...]\n`
          );
          const ps = router.handleEscalation(session, result.escalation);
          if (ps.dryRun) {
            console.log(
              `[NemoClaw dry-run] would load ${ps.policyFile}\n`
            );
          } else if (ps.applied) {
            console.log(`[NemoClaw] loaded ${ps.policyFile}\n`);
          } else {
            console.log(
              `[NemoClaw] policy load FAILED for ${ps.policyFile}: ${ps.detail ?? "unknown"}\n`
            );
          }
        }

        console.log(`\n[${session.currentAgent}] ${result.response}\n`);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error(`\n[Error] ${msg}\n`);
      }

      prompt();
    });
  };

  // Graceful shutdown on Ctrl+C
  rl.on("close", () => {
    console.log("\nGoodbye.");
    process.exit(0);
  });

  prompt();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
