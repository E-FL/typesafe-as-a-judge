import assert from "node:assert/strict";
import test from "node:test";
import { getSessionMode, getSessionModel, isJevEnabled, setSessionMode, setSessionModel } from "../server/session.mjs";

test("session mode can be enabled, disabled, and restored without persistence", () => {
  assert.equal(getSessionMode().mode, "auto");
  assert.equal(isJevEnabled(), true);
  assert.equal(setSessionMode({ mode: "disabled", billing_context: "plan", reason: "quota test" }).mode, "disabled");
  assert.equal(isJevEnabled(), false);
  assert.equal(setSessionMode({ mode: "enabled", billing_context: "api" }).mode, "enabled");
  assert.equal(isJevEnabled(), true);
  assert.equal(setSessionMode({ mode: "auto" }).mode, "auto");
});

test("session model survives policy changes and can be cleared", () => {
  assert.equal(getSessionModel(), null);
  assert.equal(setSessionModel(" jev-preview "), "jev-preview");
  setSessionMode({ mode: "enabled" });
  assert.equal(getSessionModel(), "jev-preview");
  assert.equal(getSessionMode().jev_model, "jev-preview");
  assert.equal(setSessionModel("default"), null);
  assert.equal(setSessionModel("jev-1.14.0"), "jev-1.14.0");
  assert.equal(setSessionModel(""), null);
  assert.throws(() => setSessionModel(5), /must be a string/);
  setSessionMode({ mode: "auto" });
});
