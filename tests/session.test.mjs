import assert from "node:assert/strict";
import test from "node:test";
import { getSessionMode, isJevEnabled, setSessionMode } from "../server/session.mjs";

test("session mode can be enabled, disabled, and restored without persistence", () => {
  assert.equal(getSessionMode().mode, "auto");
  assert.equal(isJevEnabled(), true);
  assert.equal(setSessionMode({ mode: "disabled", billing_context: "plan", reason: "quota test" }).mode, "disabled");
  assert.equal(isJevEnabled(), false);
  assert.equal(setSessionMode({ mode: "enabled", billing_context: "api" }).mode, "enabled");
  assert.equal(isJevEnabled(), true);
  assert.equal(setSessionMode({ mode: "auto" }).mode, "auto");
});
