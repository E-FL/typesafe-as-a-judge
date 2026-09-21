import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import readline from "node:readline";
import test from "node:test";

test("the dependency-free stdio server exposes all tools and runs the local escalation gate", async () => {
  const child = spawn(process.execPath, ["server/index.mjs"], { cwd: process.cwd(), stdio: ["pipe", "pipe", "pipe"] });
  const lines = readline.createInterface({ input: child.stdout, crlfDelay: Infinity });
  const responses = [];
  lines.on("line", (line) => responses.push(JSON.parse(line)));
  const write = (message) => child.stdin.write(`${JSON.stringify(message)}\n`);
  const responseFor = async (id) => {
    for (let i = 0; i < 100; i += 1) {
      const found = responses.find((item) => item.id === id);
      if (found) return found;
      await new Promise((resolve) => setTimeout(resolve, 10));
    }
    throw new Error(`Timed out waiting for response ${id}`);
  };

  write({ jsonrpc: "2.0", id: 1, method: "initialize", params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "test", version: "0" } } });
  assert.equal((await responseFor(1)).result.serverInfo.name, "typesafe-as-a-judge");
  write({ jsonrpc: "2.0", method: "notifications/initialized", params: {} });
  write({ jsonrpc: "2.0", id: 2, method: "tools/list", params: {} });
  assert.deepEqual((await responseFor(2)).result.tools.map((tool) => tool.name), [
    "typesafe_route",
    "typesafe_rank",
    "typesafe_extract",
    "typesafe_verify",
    "typesafe_judge",
    "typesafe_escalation_gate",
  ]);
  write({ jsonrpc: "2.0", id: 3, method: "tools/call", params: { name: "typesafe_escalation_gate", arguments: { signals: [{ id: "gap", value: 0.9, threshold: 0.8 }] } } });
  const gate = JSON.parse((await responseFor(3)).result.content[0].text);
  assert.equal(gate.recommended_action, "review");
  child.stdin.end();
  await new Promise((resolve) => child.once("close", resolve));
});
