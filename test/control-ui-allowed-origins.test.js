import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("wrapper reads explicit and Railway-derived control UI origins", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /OPENCLAW_CONTROL_UI_ALLOWED_ORIGINS/);
  assert.match(src, /RAILWAY_PUBLIC_DOMAIN/);
  assert.match(src, /function resolveControlUiAllowedOrigins\(/);
  assert.match(src, /gateway\.controlUi\.allowedOrigins/);
});

test("debug JSON exposes computed and configured control UI origins", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /controlUiAllowedOrigins/);
  assert.match(src, /controlUiAllowedOriginsConfigured/);
});
