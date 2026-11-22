import { resolvePersonalAntigravity } from "@acp/antigravity-personal.js";
import { ANTIGRAVITY_PERSONAL_ACCESS } from "@acp/access/antigravity.js";
import type { CommandSpec } from "../core/command-registry.js";

export function runtimeAuthCommandSpec(): CommandSpec {
  return {
    id: "runtime.auth.login.antigravity",
    path: ["runtime", "auth", "login", "antigravity"],
    description: "Sign in to the execution node's personal Google account with agy",
    mutation: "write",
    run: async () => {
      const launch = resolvePersonalAntigravity();
      const child = Bun.spawn([launch.executable, ...launch.args, "--login"], {
        stdin: "inherit", stdout: "inherit", stderr: "inherit",
        env: { ...process.env, ...ANTIGRAVITY_PERSONAL_ACCESS.buildEnv({
          home: "", shimUrl: "", model: null, daemonEnv: process.env,
        }) },
      });
      const code = await child.exited;
      if (code !== 0) throw new Error(`Antigravity login exited with code ${code}`);
      console.log("Antigravity account login saved on this node. Start the daemon with REMI_ANTIGRAVITY_AUTH_MODE=personal.");
    },
  };
}
