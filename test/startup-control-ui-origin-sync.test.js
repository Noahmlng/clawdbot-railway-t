import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("onboarding and startup sync both apply control UI allowed origins", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  const matches = src.match(/syncControlUiAllowedOrigins\(".*?"\)/g) || [];
  assert.ok(matches.length >= 2, "expected setup and startup origin sync calls");
  assert.match(src, /syncControlUiAllowedOrigins\("setup"\)/);
  assert.match(src, /syncControlUiAllowedOrigins\("wrapper"\)/);
});
