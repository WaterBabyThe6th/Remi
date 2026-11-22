import { accessSync, constants, statSync } from "node:fs";
import { homedir } from "node:os";
import { delimiter, isAbsolute, join } from "node:path";

/** A node operator opts into its own Google account; gateway remains the default. */
export function antigravityPersonalMode(env: NodeJS.ProcessEnv = process.env): boolean {
  return env.REMI_ANTIGRAVITY_AUTH_MODE === "personal";
}

/** Shared native account state. Remi's per-session instructions stay in providerHome. */
export function antigravityPersonalHome(env: NodeJS.ProcessEnv = process.env): string {
  const home = env.REMI_ANTIGRAVITY_PERSONAL_HOME?.trim() || join(homedir(), ".gemini");
  if (!isAbsolute(home)) throw new Error("REMI_ANTIGRAVITY_PERSONAL_HOME must be an absolute path");
  return home;
}

export function resolvePersonalAntigravity(env: NodeJS.ProcessEnv = process.env): { executable: string; args: string[] } {
  const home = antigravityPersonalHome(env);
  const explicit = env.REMI_AGY_EXECUTABLE?.trim();
  if (explicit && !isAbsolute(explicit)) throw new Error("REMI_AGY_EXECUTABLE must be an absolute path");
  const candidates = explicit ? [explicit] : [
    ...(env.PATH ?? "").split(delimiter).filter(Boolean).map(path => join(path, "agy")),
    join(homedir(), ".local", "bin", "agy"),
  ];
  for (const executable of candidates) {
    try {
      if (!statSync(executable).isFile()) continue;
      accessSync(executable, constants.X_OK);
      return { executable, args: ["acp", "--gemini-dir", home, "--disable-telemetry"] };
    } catch {}
  }
  throw new Error("[antigravity_not_installed] Install Google's agy CLI on this node, then run remi runtime auth login antigravity");
}
