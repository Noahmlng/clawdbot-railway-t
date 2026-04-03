import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("setup exposes prefill API and env map for setup defaults", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /app\.get\("\/setup\/api\/prefill"/);
  assert.match(src, /SETUP_PREFILL_ENV_MAP/);
  assert.match(src, /MINIMAX_API_KEY/);
  assert.match(src, /OPENCLAW_SETUP_TELEGRAM_PAIRING_CODE/);
  assert.match(src, /OPENCLAW_SETUP_GOOGLE_CALENDAR_ENABLED/);
  assert.match(src, /OPENCLAW_SETUP_GOOGLE_CALENDAR_CREDENTIALS_JSON/);
});

test("setup UI submits telegram pairing code", () => {
  const src = fs.readFileSync(new URL("../src/setup-app.js", import.meta.url), "utf8");
  assert.match(src, /telegramPairingCode/);
  assert.match(src, /\/setup\/api\/prefill/);
  assert.match(src, /googleCalendarCredentialsJson/);
  assert.match(src, /googleCalendarReadOnlyMode/);
});

test("setup uses telegram user id to pre-authorize DM access when provided", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /payload\.telegramUserId/);
  assert.match(src, /const telegramAllowFrom = \/\^\\d\+\$\/\.test\(telegramOwnerId\) \? \[telegramOwnerId\] : undefined;/);
  assert.match(src, /dmPolicy: telegramAllowFrom \? "allowlist" : "pairing"/);
  assert.match(src, /allowFrom: telegramAllowFrom/);
});

test("setup run configures the bundled Google Calendar plugin when requested", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /configureGoogleCalendarPlugin\(payload\)/);
  assert.match(src, /plugins", "install", "-l", GOOGLE_CALENDAR_PLUGIN_SOURCE_DIR/);
  assert.match(src, /plugins\.entries\.\$\{GOOGLE_CALENDAR_PLUGIN_ID\}/);
  assert.match(src, /tools\.allow/);
});
