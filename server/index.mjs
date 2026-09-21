import readline from "node:readline";
import { escalationGate, extract, formatError, judge, rank, route, verify } from "./judge.mjs";

const TOOL_DEFINITIONS = [
  {
    name: "typesafe_route",
    description: "Choose one route from a closed set using TypeSafe Jev. Returns a route plus a confidence-aware proceed/review recommendation; it never performs the route.",
    inputSchema: { type: "object", additionalProperties: false, required: ["state", "instructions", "routes"], properties: {
      state: { description: "Minimum relevant JSON state.", anyOf: [{ type: "string" }, { type: "object" }, { type: "array" }] },
      instructions: { type: "string", description: "One narrow routing question." },
      routes: { type: "object", description: "Route id to rubric description. The tool adds needs_review." },
      review_route: { type: "string", description: "Optional reserved no-match route id; defaults to needs_review." },
      confidence_threshold: { type: "number", minimum: 0, maximum: 1, default: 0.8 }
    } },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "typesafe_rank",
    description: "Score and rank up to 50 retrieved candidates against a concrete rubric. Returns scores, confidence, and a review recommendation; it never selects or changes a record.",
    inputSchema: { type: "object", additionalProperties: false, required: ["instructions", "candidates", "criteria"], properties: {
      instructions: { type: "string", description: "What makes a candidate good for this task." },
      context: { description: "Optional minimum relevant JSON context.", anyOf: [{ type: "string" }, { type: "object" }, { type: "array" }, { type: "null" }] },
      candidates: { type: "array", minItems: 2, maxItems: 50, items: { type: "object", required: ["id", "value"], properties: { id: { type: "string" }, value: {} } } },
      criteria: { type: "array", minItems: 2, maxItems: 10, items: {} },
      confidence_threshold: { type: "number", minimum: 0, maximum: 1, default: 0.7 }
    } },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "typesafe_extract",
    description: "Select supported values from candidates code already found in a source. It cannot generate values. Returns selected values, confidence, and review fields.",
    inputSchema: { type: "object", additionalProperties: false, required: ["source", "fields"], properties: {
      source: { description: "Source text or structured source to evaluate.", anyOf: [{ type: "string" }, { type: "object" }, { type: "array" }] },
      fields: { type: "array", minItems: 1, maxItems: 20, items: { type: "object", required: ["id", "instructions", "candidates"], properties: { id: { type: "string" }, instructions: { type: "string" }, candidates: { type: "array", minItems: 1, maxItems: 100, items: { type: "object", required: ["id", "value"], properties: { id: { type: "string" }, value: {}, description: {} } } } } } },
      confidence_threshold: { type: "number", minimum: 0, maximum: 1, default: 0.8 }
    } },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "typesafe_verify",
    description: "Judge whether supplied evidence directly supports a claim. Returns a support probability and an explicit proceed/review recommendation; it never treats a claim as proven on its own.",
    inputSchema: { type: "object", additionalProperties: false, required: ["claim", "evidence"], properties: {
      claim: { type: "string" },
      evidence: { description: "The source passage(s) or structured evidence.", anyOf: [{ type: "string" }, { type: "object" }, { type: "array" }] },
      context: { description: "Optional relevant JSON context.", anyOf: [{ type: "string" }, { type: "object" }, { type: "array" }, { type: "null" }] },
      support_threshold: { type: "number", minimum: 0, maximum: 1, default: 0.85 }
    } },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "typesafe_judge",
    description: "Run up to 25 independent, narrow TypeSafe Choice, Score, or Noul questions against shared state. Returns raw typed signals for the caller's explicit policy.",
    inputSchema: { type: "object", additionalProperties: false, required: ["state", "questions"], properties: {
      state: { description: "Minimum relevant JSON state.", anyOf: [{ type: "string" }, { type: "object" }, { type: "array" }] },
      questions: { type: "object", description: "Question id to a TypeSafe Choice, Score, or Noul question." }
    } },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: true }
  },
  {
    name: "typesafe_escalation_gate",
    description: "Apply a deterministic max-style review gate to explicit probabilities or confidences. No model call, writes, or external action occurs.",
    inputSchema: { type: "object", additionalProperties: false, required: ["signals"], properties: {
      signals: { type: "array", minItems: 1, maxItems: 100, items: { type: "object", required: ["id", "value", "threshold"], properties: { id: { type: "string" }, value: { type: "number", minimum: 0, maximum: 1 }, threshold: { type: "number", minimum: 0, maximum: 1 }, comparator: { type: "string", enum: [">=", "<="] }, reason: { type: "string" } } } }
    } },
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }
];

const HANDLERS = {
  typesafe_route: route,
  typesafe_rank: rank,
  typesafe_extract: extract,
  typesafe_verify: verify,
  typesafe_judge: judge,
  typesafe_escalation_gate: escalationGate,
};

function textResult(payload, isError = false) {
  return { content: [{ type: "text", text: JSON.stringify(payload, null, 2) }], isError };
}

function response(id, result) {
  return { jsonrpc: "2.0", id, result };
}

function errorResponse(id, code, message) {
  return { jsonrpc: "2.0", id, error: { code, message } };
}

export async function handleMessage(message, dependencies = {}) {
  if (!message || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    return errorResponse(message?.id ?? null, -32600, "Invalid JSON-RPC request.");
  }
  const id = message.id;
  if (message.method === "notifications/initialized") return null;
  if (message.method === "initialize") {
    return response(id, {
      protocolVersion: message.params?.protocolVersion ?? "2025-06-18",
      capabilities: { tools: {} },
      serverInfo: { name: "typesafe-as-a-judge", version: "0.1.0" },
      instructions: "Use TypeSafe-as-a-Judge for bounded semantic signals only. All returned actions are recommendations and require caller policy.",
    });
  }
  if (message.method === "ping") return response(id, {});
  if (message.method === "tools/list") return response(id, { tools: TOOL_DEFINITIONS });
  if (message.method === "tools/call") {
    const toolName = message.params?.name;
    const handler = HANDLERS[toolName];
    if (!handler) return response(id, textResult({ error: `Unknown TypeSafe-as-a-Judge tool: ${toolName}` }, true));
    try {
      return response(id, textResult(await handler(message.params?.arguments ?? {}, dependencies)));
    } catch (error) {
      return response(id, textResult({ error: formatError(error) }, true));
    }
  }
  return id === undefined ? null : errorResponse(id, -32601, `Method not found: ${message.method}`);
}

async function main() {
  const lines = readline.createInterface({ input: process.stdin, crlfDelay: Infinity });
  for await (const line of lines) {
    if (!line.trim()) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      process.stdout.write(`${JSON.stringify(errorResponse(null, -32700, "Parse error."))}\n`);
      continue;
    }
    const result = await handleMessage(message);
    if (result) process.stdout.write(`${JSON.stringify(result)}\n`);
  }
}

await main();
