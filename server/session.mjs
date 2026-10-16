const VALID_MODES = new Set(["auto", "enabled", "disabled"]);
const VALID_BILLING_CONTEXTS = new Set(["unknown", "plan", "api"]);

let state = {
  mode: "auto",
  billing_context: "unknown",
  reason: "Default automatic policy.",
};

// Session default Jev model. Kept outside `state` so changing the policy never clears it.
let sessionModel = null;

function validString(value, fallback) {
  return typeof value === "string" && value.trim() ? value.trim() : fallback;
}

export function getSessionModel() {
  return sessionModel;
}

// An empty string or "default" clears the session model so the environment or built-in default applies again.
export function setSessionModel(model) {
  if (typeof model !== "string") {
    throw new Error("model must be a string; use an empty string to clear it.");
  }
  const trimmed = model.trim();
  sessionModel = trimmed === "" || trimmed === "default" ? null : trimmed;
  return sessionModel;
}

export function getSessionMode() {
  return { ...state, jev_model: sessionModel, scope: "current MCP server process; resets when the process restarts" };
}

export function setSessionMode({ mode = "auto", billing_context = "unknown", reason = "" } = {}) {
  if (!VALID_MODES.has(mode)) {
    throw new Error("mode must be auto, enabled, or disabled.");
  }
  if (!VALID_BILLING_CONTEXTS.has(billing_context)) {
    throw new Error("billing_context must be unknown, plan, or api.");
  }
  state = {
    mode,
    billing_context,
    reason: validString(reason, mode === "auto" ? "Automatic policy." : `Explicitly ${mode}.`),
  };
  return getSessionMode();
}

export function isJevEnabled() {
  return state.mode !== "disabled";
}
