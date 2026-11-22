import { afterEach, describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { AcpProvider } from "@acp/provider.js";
import { accessConfigFor } from "@acp/access/index.js";
import { antigravityPersonalMode, resolvePersonalAntigravity } from "@acp/antigravity-personal.js";

const roots: string[] = [];
const saved = { ...process.env };
afterEach(() => {
  for (const key of ["REMI_ANTIGRAVITY_AUTH_MODE", "REMI_ANTIGRAVITY_PERSONAL_HOME", "REMI_AGY_EXECUTABLE"]) {
    if (saved[key] === undefined) delete process.env[key]; else process.env[key] = saved[key];
  }
  for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true });
});
function setup() {
  const root = mkdtempSync(join(tmpdir(), "personal-agy-test-")); roots.push(root);
  process.env.REMI_ANTIGRAVITY_AUTH_MODE = "personal";
  process.env.REMI_ANTIGRAVITY_PERSONAL_HOME = join(root, "account");
  process.env.REMI_AGY_EXECUTABLE = process.execPath;
  return root;
}
function provider(root: string, env: Record<string, string> = {}) {
  return new AcpProvider({ agentType: "antigravity", cwd: root, providerHome: join(root, "session"),
    executable: process.execPath, args: [join(import.meta.dir, "../../fixtures/antigravity-personal-acp-fake.mjs")],
    env: { FAKE_PERSONAL_CAPTURE: join(root, "capture.jsonl"), GEMINI_API_KEY: "wrong-api-key", AGY_LLM_GATEWAY_URL: "https://wrong.test", ...env } });
}
describe("Antigravity personal account", () => {
  it("keeps gateway as the default and selects native account auth explicitly", () => {
    expect(antigravityPersonalMode({})).toBe(false);
    const root = setup();
    const access = accessConfigFor("antigravity")!;
    expect(access).toMatchObject({ usage: "bridge", modelRequired: false });
    const env = access.buildEnv({ home: join(root, "session"), shimUrl: "", model: null, daemonEnv: {} });
    expect(env.GEMINI_HOME).toBe(join(root, "account"));
    expect(env.AGY_ACP_ENABLE_OAUTH).toBe("1");
    expect(env.AGY_LLM_GATEWAY_URL).toBe("");
    expect(resolvePersonalAntigravity().args).toEqual(["acp", "--gemini-dir", join(root, "account"), "--disable-telemetry"]);
    expect(() => resolvePersonalAntigravity({ REMI_AGY_EXECUTABLE: "relative/agy" })).toThrow("absolute path");
  });
  it("discovers account models and completes a prompt without gateway configuration", async () => {
    const root = setup(); const agent = provider(root);
    try {
      const models = await agent.discoverModelCapabilities();
      expect(models.map(model => model.id)).toContain("account-model-fast");
      const response = await agent.send("hello", { chatId: "personal-test", model: "account-model-fast" });
      expect(response.text).toContain("account reply: account-model-fast");
      const records = readFileSync(join(root, "capture.jsonl"), "utf8").trim().split("\n").map(line => JSON.parse(line));
      expect(records.every(row => row.home === join(root, "account") && row.oauth === "1" && row.gateway === "" && row.key === "")).toBe(true);
    } finally { await agent.close(); }
  });
  it("reports the node login command when account credentials are missing", async () => {
    const root = setup(); const agent = provider(root, { FAKE_PERSONAL_AUTH_REQUIRED: "1" });
    try { await expect(agent.send("hello")).rejects.toThrow("remi runtime auth login antigravity"); }
    finally { await agent.close(); }
  });
});
