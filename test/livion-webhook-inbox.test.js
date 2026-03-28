import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("server exposes livion webhook inbox endpoint", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /app\.post\("\/webhooks\/livion"/);
  assert.match(src, /x-livion-shared-secret/);
});

test("setup writes hooks config to openclaw config", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /hooks\.enabled/);
  assert.match(src, /hooks\.path/);
  assert.match(src, /hooks\.token/);
});

test("dashboard auth bypasses webhooks inbox path", () => {
  const src = fs.readFileSync(new URL("../src/server.js", import.meta.url), "utf8");
  assert.match(src, /req\.path\.startsWith\("\/webhooks\/"\)/);
});
