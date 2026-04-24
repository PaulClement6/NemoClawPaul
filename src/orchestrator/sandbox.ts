import { execFileSync } from "child_process";
import path from "path";
import { AgentRole } from "../types";

export interface PolicySwitchEvent {
  role: AgentRole;
  policyFile: string;
  applied: boolean;
  dryRun: boolean;
  detail?: string;
}

/**
 * Hot-reload the NemoClaw sandbox policy for a given agent role.
 *
 * When `NEMOCLAW_ENABLED=true` (server running inside `openshell` on a
 * NemoClaw-enabled host), shells out to `openshell policy set <file>`.
 *
 * When `NEMOCLAW_ENABLED=false` or unset (local dev), no process is
 * spawned — the intended command is logged and the caller receives a
 * dry-run event so the dashboard can still render the transition.
 */
export function switchPolicy(role: AgentRole): PolicySwitchEvent {
  const policyDir = process.env.NEMOCLAW_POLICY_DIR || "./policies";
  const policyFile = path.join(policyDir, `sandbox-${role}.yaml`);
  const enabled = process.env.NEMOCLAW_ENABLED === "true";

  if (!enabled) {
    console.log(
      `[NemoClaw dry-run] openshell policy set ${policyFile} (NEMOCLAW_ENABLED=false)`
    );
    return { role, policyFile, applied: false, dryRun: true };
  }

  try {
    execFileSync("openshell", ["policy", "set", policyFile], {
      stdio: "pipe",
      timeout: 5000,
    });
    console.log(`[NemoClaw] policy applied: ${policyFile}`);
    return { role, policyFile, applied: true, dryRun: false };
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(`[NemoClaw] policy switch failed: ${detail}`);
    return { role, policyFile, applied: false, dryRun: false, detail };
  }
}
