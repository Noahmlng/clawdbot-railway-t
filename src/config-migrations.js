function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

const CHANNEL_PLUGIN_ALLOWLIST_IDS = {
  telegram: "telegram",
  discord: "discord",
  slack: "slack",
};

export function applyKnownConfigMigrations(input) {
  if (!isPlainObject(input)) {
    return { config: input, applied: [] };
  }

  const config = structuredClone(input);
  const applied = [];

  const larkPluginEntry = config.plugins?.entries?.["openclaw-lark"];
  const larkPluginConfig = larkPluginEntry?.config;
  if (isPlainObject(larkPluginConfig) && Object.keys(larkPluginConfig).length > 0) {
    config.channels ||= {};
    const existingFeishu = isPlainObject(config.channels.feishu) ? config.channels.feishu : {};
    const nextFeishu = { ...existingFeishu };
    const movedKeys = [];
    const skippedKeys = [];

    for (const [key, value] of Object.entries(larkPluginConfig)) {
      if (nextFeishu[key] === undefined) {
        nextFeishu[key] = value;
        movedKeys.push(key);
      } else {
        skippedKeys.push(key);
      }
    }

    config.channels.feishu = nextFeishu;
    larkPluginEntry.config = {};
    applied.push({
      type: "move-lark-plugin-config-to-feishu-channel",
      movedKeys,
      skippedKeys,
    });
  }

  const telegram = config.channels?.telegram;
  if (isPlainObject(telegram) && typeof telegram.streamMode === "string" && telegram.streaming == null) {
    telegram.streaming = telegram.streamMode;
    delete telegram.streamMode;
    applied.push({
      type: "rename-telegram-streamMode-to-streaming",
      value: telegram.streaming,
    });
  }

  if (Array.isArray(config.plugins?.allow)) {
    const nextAllow = [...config.plugins.allow];
    const addedPlugins = [];

    for (const [channelName, pluginId] of Object.entries(CHANNEL_PLUGIN_ALLOWLIST_IDS)) {
      const channelConfig = config.channels?.[channelName];
      if (isPlainObject(channelConfig) && channelConfig.enabled === true && !nextAllow.includes(pluginId)) {
        nextAllow.push(pluginId);
        addedPlugins.push(pluginId);
      }
    }

    if (addedPlugins.length) {
      config.plugins.allow = nextAllow;
      applied.push({
        type: "allowlist-enabled-channel-plugins",
        pluginIds: addedPlugins,
      });
    }
  }

  return { config, applied };
}
