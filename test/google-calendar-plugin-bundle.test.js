import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";

test("Dockerfile bundles and installs the Google Calendar plugin", () => {
  const src = fs.readFileSync(new URL("../Dockerfile", import.meta.url), "utf8");
  assert.match(src, /COPY plugins \.\/plugins/);
  assert.match(src, /npm install --prefix \/app\/plugins\/openclaw-google-calendar --omit=dev/);
});

test("vendored Google Calendar plugin manifest is present", () => {
  const manifestPath = new URL("../plugins/openclaw-google-calendar/openclaw.plugin.json", import.meta.url);
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  assert.equal(manifest.id, "openclaw-google-calendar");
});
