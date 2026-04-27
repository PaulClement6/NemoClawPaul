import { execFileSync } from "child_process";
import { AgentRole } from "../types";
import { getAgentEndpoint } from "./agent-registry";

export interface PolicySwitchEvent {
  role: AgentRole;
  /** Sandbox name targeted (e.g. `agent-billing`). */
  sandboxName: string;
  /** Path of the policy YAML supplied to `openshell policy set`. */
  policyFile: string;
  /** True when `openshell policy set ... --wait` returned 0. */
  applied: boolean;
  /** True when `NEMOCLAW_ENABLED=false` (host has no openshell — local dev). */
  dryRun: boolean;
  /** Error message captured if applied=false and dryRun=false. */
  detail?: string;
}

/**
 * Hot-reload the OpenShell network policy on an agent's sandbox pod.
 *
 * Real CLI shape (verified on Brev, openshell ≥ 0.0.24):
 *   openshell policy set <SANDBOX_NAME> --policy <FILE> --wait
 *
 * `--wait` blocks until the gRPC poll loop on the sandbox confirms the new
 * policy is loaded (default 60s timeout — typically 1–10s in practice).
 *
 * When `NEMOCLAW_ENABLED=false` (local laptop dev, no openshell installed),
 * skip the shell-out and return a dry-run event so the dashboard can still
 * render the transition card.
 */
export function switchPolicy(role: AgentRole): PolicySwitchEvent {
  const endpoint = getAgentEndpoint(role);
  const sandboxName = endpoint.sandboxName;
  const policyFile = endpoint.policyFile;
  const enabled = process.env.NEMOCLAW_ENABLED === "true";

  if (!enabled) {
    console.log(
      `[NemoClaw dry-run] openshell policy set ${sandboxName} --policy ${policyFile} --wait (NEMOCLAW_ENABLED=false)`
    );
    return {
      role,
      sandboxName,
      policyFile,
      applied: false,
      dryRun: true,
    };
  }

  try {
    execFileSync(
      "openshell",
      ["policy", "set", sandboxName, "--policy", policyFile, "--wait"],
      { stdio: "pipe", timeout: 30000 }
    );
    console.log(
      `[NemoClaw] policy applied: ${sandboxName} <- ${policyFile}`
    );
    return {
      role,
      sandboxName,
      policyFile,
      applied: true,
      dryRun: false,
    };
  } catch (err: unknown) {
    const detail = err instanceof Error ? err.message : String(err);
    console.error(
      `[NemoClaw] policy switch failed for ${sandboxName}: ${detail}`
    );
    return {
      role,
      sandboxName,
      policyFile,
      applied: false,
      dryRun: false,
      detail,
    };
  }
}
