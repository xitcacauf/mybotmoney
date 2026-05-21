const GuildConfig = require("../models/GuildConfig");
const User = require("../models/User");
const logger = require("../utils/logger");
const config = require("../config/config");
const { ChannelType, PermissionFlagsBits } = require("discord.js");

const voiceJoinTime = new Map();

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState, client) {
    try {
      const gConfig = await GuildConfig.findOrCreate(newState.guild.id);

      if (newState.member?.user?.bot) return;

      if (oldState.channelId && !newState.channelId) {
        const joined = voiceJoinTime.get(newState.id);
        if (joined) {
          const minutes = Math.floor((Date.now() - joined) / 60000);
          voiceJoinTime.delete(newState.id);
          if (minutes > 0) {
            await User.findOneAndUpdate(
              { userId: newState.id, guildId: newState.guild.id },
              { $inc: { "social.voiceMinutes": minutes } }
            );
          }
        }

        if (client.privateCallTimers.has(oldState.channelId)) {
          clearTimeout(client.privateCallTimers.get(oldState.channelId));
          client.privateCallTimers.delete(oldState.channelId);
        }
        if (oldState.channel && oldState.channel.members.size === 0) {
          const isPrivate = oldState.channel.name.startsWith("🔊") ||
            oldState.channel.name.startsWith("📞");
          if (isPrivate) {
            const timer = setTimeout(async () => {
              const ch = oldState.guild.channels.cache.get(oldState.channelId);
              if (ch && ch.members.size === 0) {
                await ch.delete("Call privada vazia — auto delete").catch(() => {});
              }
              client.privateCallTimers.delete(oldState.channelId);
            }, config.privateCall.deleteAfterMinutes * 60 * 1000);
            client.privateCallTimers.set(oldState.channelId, timer);
          }
        }
      }

      if (!oldState.channelId && newState.channelId) {
        voiceJoinTime.set(newState.id, Date.now());

        if (newState.channelId === gConfig.privateCalls?.joinChannelId) {
          const channel = await newState.guild.channels.create({
            name: `🔊 ${newState.member.displayName}`,
            type: ChannelType.GuildVoice,
            parent: gConfig.privateCalls?.categoryId || null,
            permissionOverwrites: [
              {
                id: newState.guild.id,
                deny: [PermissionFlagsBits.Connect],
              },
              {
                id: newState.member.id,
                allow: [
                  PermissionFlagsBits.Connect,
                  PermissionFlagsBits.ManageChannels,
                  PermissionFlagsBits.MoveMembers,
                ],
              },
            ],
          });
          await newState.setChannel(channel);
        }
      }

      if (newState.channelId && client.privateCallTimers.has(newState.channelId)) {
        clearTimeout(client.privateCallTimers.get(newState.channelId));
        client.privateCallTimers.delete(newState.channelId);
      }
    } catch (err) {
      logger.error(`Erro voiceStateUpdate: ${err.message}`);
    }
  },
};
