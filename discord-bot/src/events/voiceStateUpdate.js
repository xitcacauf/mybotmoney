const GuildConfig = require("../models/GuildConfig");
const User = require("../models/User");
const logger = require("../utils/logger");
const config = require("../config/config");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const { addCallMinutes } = require("../systems/ObsessionSystem");
const { addMemory } = require("../systems/MemorySystem");
const { addHeat } = require("../systems/SocialHeat");

const voiceJoinTime = new Map();
const voiceChannelMembers = new Map(); // channelId -> Set(userId)
const creatingChannel = new Set(); // anti-duplicação

module.exports = {
  name: "voiceStateUpdate",
  async execute(oldState, newState, client) {
    try {
      const gConfig = await GuildConfig.findOrCreate(newState.guild.id);

      if (newState.member?.user?.bot) return;

      // Usuário saiu de um canal
      if (oldState.channelId && (!newState.channelId || newState.channelId !== oldState.channelId)) {
        const joined = voiceJoinTime.get(`${newState.id}_${oldState.channelId}`);
        if (joined) {
          const minutes = Math.floor((Date.now() - joined) / 60000);
          voiceJoinTime.delete(`${newState.id}_${oldState.channelId}`);

          if (minutes > 0) {
            await User.findOneAndUpdate(
              { userId: newState.id, guildId: newState.guild.id },
              { $inc: { "social.voiceMinutes": minutes, "social.xp": minutes } }
            );
            await addHeat(newState.guild.id, Math.min(minutes, 5)).catch(() => {});

            // Registrar vínculo de call com outros membros do canal
            const members = voiceChannelMembers.get(oldState.channelId);
            if (members) {
              for (const memberId of members) {
                if (memberId !== newState.id) {
                  await addCallMinutes(newState.id, newState.guild.id, memberId, minutes).catch(() => {});

                  // Primeira call juntos → memória
                  const userDb = await User.findOne({ userId: newState.id, guildId: newState.guild.id });
                  const bond = userDb?.bonds?.[memberId];
                  if (bond && bond.callMinutes <= minutes) {
                    await addMemory(newState.id, newState.guild.id, "first_call", `Primeira call com <@${memberId}>`).catch(() => {});
                  }
                }
              }
              members.delete(newState.id);
              if (members.size === 0) voiceChannelMembers.delete(oldState.channelId);
            }
          }
        }

        // Auto-delete de call privada vazia
        if (client.privateCallTimers.has(oldState.channelId)) {
          clearTimeout(client.privateCallTimers.get(oldState.channelId));
          client.privateCallTimers.delete(oldState.channelId);
        }

        if (oldState.channel && oldState.channel.members.size === 0) {
          const isPrivate =
            oldState.channel.name.startsWith("🔊") ||
            oldState.channel.name.startsWith("📞") ||
            oldState.channel.name.includes("ticket-");

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

      // Usuário entrou em um canal
      if (newState.channelId && (!oldState.channelId || newState.channelId !== oldState.channelId)) {
        voiceJoinTime.set(`${newState.id}_${newState.channelId}`, Date.now());

        // Rastrear membros no canal
        if (!voiceChannelMembers.has(newState.channelId)) voiceChannelMembers.set(newState.channelId, new Set());
        voiceChannelMembers.get(newState.channelId).add(newState.id);

        // Criar call privada ao entrar no canal trigger
        if (newState.channelId === gConfig.privateCalls?.joinChannelId) {
          // Anti-duplicação: verificar se já está criando
          const lockKey = `${newState.id}_${newState.guild.id}`;
          if (creatingChannel.has(lockKey)) return;
          creatingChannel.add(lockKey);

          try {
            const channel = await newState.guild.channels.create({
              name: `🔊 ${newState.member.displayName}`,
              type: ChannelType.GuildVoice,
              parent: gConfig.privateCalls?.categoryId || null,
              permissionOverwrites: [
                { id: newState.guild.id, deny: [PermissionFlagsBits.Connect] },
                {
                  id: newState.member.id,
                  allow: [
                    PermissionFlagsBits.Connect,
                    PermissionFlagsBits.ManageChannels,
                    PermissionFlagsBits.MoveMembers,
                    PermissionFlagsBits.Speak,
                  ],
                },
              ],
            });

            await newState.setChannel(channel).catch(() => {});

            // Auto-delete se vazar
            const timer = setTimeout(async () => {
              const ch = newState.guild.channels.cache.get(channel.id);
              if (ch && ch.members.size === 0) await ch.delete("Call privada sem uso").catch(() => {});
              client.privateCallTimers.delete(channel.id);
            }, 10 * 60 * 1000);
            client.privateCallTimers.set(channel.id, timer);
          } catch (err) {
            logger.error(`Erro ao criar call privada: ${err.message}`);
          } finally {
            setTimeout(() => creatingChannel.delete(lockKey), 5000);
          }
        }
      }

      // Cancelar timer de delete se alguém entrou
      if (newState.channelId && client.privateCallTimers.has(newState.channelId)) {
        clearTimeout(client.privateCallTimers.get(newState.channelId));
        client.privateCallTimers.delete(newState.channelId);
      }
    } catch (err) {
      logger.error(`Erro voiceStateUpdate: ${err.message}`);
    }
  },
};
