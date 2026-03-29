import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("setup run declares respondJson outside try so catch can return JSON errors", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  const idx = src.indexOf('app.post("/setup/api/run"');
  assert.ok(idx >= 0);
  const window = src.slice(idx, idx + 900);

  const helperIndex = window.indexOf("const respondJson");
  const tryIndex = window.indexOf("try {");

  assert.ok(helperIndex >= 0, "respondJson helper should exist");
  assert.ok(tryIndex >= 0, "setup run should have a try block");
  assert.ok(helperIndex < tryIndex, "respondJson must be declared before try");
});
