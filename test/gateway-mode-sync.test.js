import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("setup and startup both enforce gateway.mode=local", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  const matches = src.match(/"gateway\.mode", "local"/g) || [];
  assert.ok(matches.length >= 2, "expected gateway.mode=local to be written during setup and startup");
});
