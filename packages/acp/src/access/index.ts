import { ANTIGRAVITY_ACCESS, ANTIGRAVITY_PERSONAL_ACCESS } from "./antigravity.js";
import { antigravityPersonalMode } from "../antigravity-personal.js";
import type { AcpAccessConfig } from "./types.js";

export type { AcpAccessConfig, AcpAccessEnvInput, AcpLaunchCommand } from "./types.js";
export type {
  GatewayShimChannel, GatewayShimEvent, GatewayShimHost, GatewayShimListingFailure, GatewayShimRequestObservation,
} from "./gateway-shim-types.js";
export {
  ANTIGRAVITY_ACCESS, ANTIGRAVITY_BLANKED_ENV, ANTIGRAVITY_DEFAULT_CONTEXT_WINDOW, ANTIGRAVITY_PLACEHOLDER_KEY,
  antigravityHomeFiles, buildAntigravityEnv, mapAntigravityPermissionMode, seedAntigravityHome,
} from "./antigravity.js";

const ACCESS_CONFIGS: Readonly<Record<string, AcpAccessConfig>> = {
  antigravity: ANTIGRAVITY_ACCESS,
};

/** The access config of an agent type, or null for the npm-bridge agents (Claude, Codex). */
export function accessConfigFor(agentType: string | null | undefined): AcpAccessConfig | null {
  if (agentType === "antigravity" && antigravityPersonalMode()) return ANTIGRAVITY_PERSONAL_ACCESS;
  return (agentType && Object.hasOwn(ACCESS_CONFIGS, agentType) ? ACCESS_CONFIGS[agentType] : undefined) ?? null;
}
