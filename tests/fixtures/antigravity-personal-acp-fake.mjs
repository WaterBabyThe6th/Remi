import { appendFileSync } from "node:fs";
import { createInterface } from "node:readline";

const send = body => process.stdout.write(JSON.stringify({ jsonrpc: "2.0", ...body }) + "\n");
let model = "account-model";
const state = sessionId => ({ sessionId, configOptions: [{ id: "model", name: "Model", category: "model", type: "select", currentValue: model,
  options: [{ value: "account-model", name: "Account model" }, { value: "account-model-fast", name: "Account fast" }] }] });
if (process.env.FAKE_PERSONAL_CAPTURE) appendFileSync(process.env.FAKE_PERSONAL_CAPTURE, JSON.stringify({
  kind: "env", home: process.env.GEMINI_HOME, oauth: process.env.AGY_ACP_ENABLE_OAUTH,
  gateway: process.env.AGY_LLM_GATEWAY_URL, key: process.env.GEMINI_API_KEY,
}) + "\n");
for await (const line of createInterface({ input: process.stdin })) {
  const request = JSON.parse(line);
  if (request.id == null) continue;
  const { id, method, params } = request;
  if (method === "initialize") send({ id, result: { protocolVersion: 1, agentInfo: { name: "fake-personal-agy", version: "1.5.14" }, agentCapabilities: { loadSession: true, sessionCapabilities: { resume: {} } } } });
  else if (method === "session/new" || method === "session/load" || method === "session/resume") {
    if (process.env.FAKE_PERSONAL_AUTH_REQUIRED === "1") send({ id, error: { code: -32000, message: "Authentication required" } });
    else send({ id, result: state(params.sessionId ?? "personal-session") });
  } else if (method === "session/set_config_option") {
    model = params.value;
    send({ id, result: { configOptions: state(params.sessionId).configOptions } });
  } else if (method === "session/prompt") {
    send({ method: "session/update", params: { sessionId: params.sessionId, update: { sessionUpdate: "agent_message_chunk", content: { type: "text", text: `account reply: ${model}` } } } });
    send({ id, result: { stopReason: "end_turn" } });
  } else send({ id, result: {} });
}
