import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("setup exposes prefill API and env map for setup defaults", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /app\.get\("\/setup\/api\/prefill"/);
  assert.match(src, /SETUP_PREFILL_ENV_MAP/);
  assert.match(src, /MINIMAX_API_KEY/);
  assert.match(src, /OPENCLAW_SETUP_TELEGRAM_PAIRING_CODE/);
});

test("setup UI submits telegram pairing code", () => {
  const src = fs.readFileSync(new URL("../src/setup-app.js", import.meta.url), "utf8");
  assert.match(src, /telegramPairingCode/);
  assert.match(src, /\/setup\/api\/prefill/);
});
