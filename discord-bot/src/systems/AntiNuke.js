const logger = require("../utils/logger");
const GuildConfig = require("../models/GuildConfig");

const auditLog = new Map();

function track(guildId, action, userId) {
  const key = `${guildId}-${userId}-${action}`;
  const now = Date.now();
  if (!auditLog.has(key)) auditLog.set(key, []);
  const times = auditLog.get(key).filter((t) => now - t < 10000);
  times.push(now);
  auditLog.set(key, times);
  return times.length;
}

async function punish(guild, userId, reason) {
  try {
    const member = await guild.members.fetch(userId).catch(() => null);
    if (!member) return;
    if (member.permissions.has("Administrator")) return;
    await member.ban({ reason: `[AntiNuke] ${reason}` });
    logger.info(`AntiNuke: ${userId} banido — ${reason}`);
  } catch (err) {
    logger.error(`AntiNuke punish error: ${err.message}`);
  }
}

module.exports = {
  async onChannelDelete(channel, client) {
    try {
      const gConfig = await GuildConfig.findOrCreate(channel.guild.id);
      if (!gConfig.antiNuke?.enabled) return;

      const logs = await channel.guild
        .fetchAuditLogs({ type: 12, limit: 1 })
        .catch(() => null);
      if (!logs) return;
      const entry = logs.entries.first();
      if (!entry || Date.now() - entry.createdTimestamp > 5000) return;

      const count = track(channel.guild.id, "channelDelete", entry.executor.id);
      const max = gConfig.antiNuke.maxChannelDeletes || 3;
      if (count >= max) {
        await punish(channel.guild, entry.executor.id, "Deleção em massa de canais");
      }
    } catch (err) {
      logger.error(`AntiNuke channelDelete: ${err.message}`);
    }
  },

  async onBan(guild, user, client) {
    try {
      const gConfig = await GuildConfig.findOrCreate(guild.id);
      if (!gConfig.antiNuke?.enabled) return;

      const logs = await guild
        .fetchAuditLogs({ type: 22, limit: 1 })
        .catch(() => null);
      if (!logs) return;
      const entry = logs.entries.first();
      if (!entry || Date.now() - entry.createdTimestamp > 5000) return;

      const count = track(guild.id, "ban", entry.executor.id);
      const max = gConfig.antiNuke.maxBans || 5;
      if (count >= max) {
        await punish(guild, entry.executor.id, "Banimento em massa");
      }
    } catch (err) {
      logger.error(`AntiNuke ban: ${err.message}`);
    }
  },
};
