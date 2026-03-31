import test from "node:test";
import assert from "node:assert/strict";

import { applyKnownConfigMigrations } from "../src/config-migrations.js";

test("moves invalid lark plugin config into channels.feishu", () => {
  const input = {
    channels: {
      telegram: {
        enabled: true,
      },
    },
    plugins: {
      entries: {
        "openclaw-lark": {
          enabled: true,
          config: {
            appId: "cli_123",
            appSecret: "secret_456",
          },
        },
      },
    },
  };

  const { config, applied } = applyKnownConfigMigrations(input);

  assert.deepEqual(config.channels.feishu, {
    appId: "cli_123",
    appSecret: "secret_456",
  });
  assert.deepEqual(config.plugins.entries["openclaw-lark"].config, {});
  assert.match(applied[0]?.type || "", /move-lark-plugin-config-to-feishu-channel/);
});

test("keeps existing feishu values when clearing invalid lark plugin config", () => {
  const input = {
    channels: {
      feishu: {
        appId: "cli_existing",
      },
    },
    plugins: {
      entries: {
        "openclaw-lark": {
          enabled: true,
          config: {
            appId: "cli_ignored",
            appSecret: "secret_456",
          },
        },
      },
    },
  };

  const { config } = applyKnownConfigMigrations(input);

  assert.deepEqual(config.channels.feishu, {
    appId: "cli_existing",
    appSecret: "secret_456",
  });
  assert.deepEqual(config.plugins.entries["openclaw-lark"].config, {});
});

test("renames telegram streamMode to streaming", () => {
  const input = {
    channels: {
      telegram: {
        enabled: true,
        streamMode: "partial",
      },
    },
  };

  const { config, applied } = applyKnownConfigMigrations(input);

  assert.equal(config.channels.telegram.streaming, "partial");
  assert.equal("streamMode" in config.channels.telegram, false);
  assert.match(applied[0]?.type || "", /rename-telegram-streamMode-to-streaming/);
});

test("adds enabled channel plugins back into plugins.allow", () => {
  const input = {
    channels: {
      telegram: {
        enabled: true,
      },
      discord: {
        enabled: false,
      },
    },
    plugins: {
      allow: ["openclaw-lark"],
    },
  };

  const { config, applied } = applyKnownConfigMigrations(input);

  assert.deepEqual(config.plugins.allow, ["openclaw-lark", "telegram"]);
  assert.match(applied[0]?.type || applied[1]?.type || "", /allowlist-enabled-channel-plugins/);
});
