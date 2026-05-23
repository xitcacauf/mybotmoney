const {
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const Match = require("../models/Match");
const { calcCompatibility, getCompatibilityEmoji } = require("../systems/CompatibilityEngine");
const GuildConfig = require("../models/GuildConfig");

module.exports = {
  customId: /^match_accept_|^match_ignore_/,
  async execute(interaction, client) {
    // Defer immediately — prevents double-click from processing twice
    await interaction.deferReply({ ephemeral: false });

    const isAccept = interaction.customId.startsWith("match_accept_");
    const targetUserId = interaction.customId.replace(/^match_accept_|^match_ignore_/, "");

    if (interaction.user.id === targetUserId) {
      return interaction.editReply({ content: "❌ Você não pode dar match em si mesmo!" });
    }

    if (!isAccept) {
      return interaction.editReply({ content: "✅ Perfil ignorado." });
    }

    const user1 = await User.findOne({ userId: targetUserId, guildId: interaction.guild.id });
    const user2 = await User.findOrCreate(interaction.user.id, interaction.guild.id, interaction.user.username);

    const score = user1?.dating?.profileData
      ? calcCompatibility(user1.dating.profileData, user2.dating.profileData || {})
      : Math.floor(50 + Math.random() * 50);

    const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);

    let callChannel = null;
    try {
      callChannel = await interaction.guild.channels.create({
        name: `💕 match-${interaction.user.username.slice(0, 10)}`,
        type: ChannelType.GuildText,
        parent: gConfig.privateCalls?.categoryId || null,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
          { id: targetUserId, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages] },
        ],
      });
    } catch {}

    let privateCall = null;
    try {
      privateCall = await interaction.guild.channels.create({
        name: `💕 call-match`,
        type: ChannelType.GuildVoice,
        parent: gConfig.privateCalls?.categoryId || null,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.Connect] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.Connect] },
          { id: targetUserId, allow: [PermissionFlagsBits.Connect] },
        ],
      });
    } catch {}

    await Match.create({
      guildId: interaction.guild.id,
      type: "dating",
      user1Id: targetUserId,
      user2Id: interaction.user.id,
      compatibility: score,
      channelId: callChannel?.id || null,
      callId: privateCall?.id || null,
    });

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("💘 Match Encontrado!")
      .setDescription(
        `<@${targetUserId}> e <@${interaction.user.id}> fizeram match!\n\n**Compatibilidade:** ${score}% — ${getCompatibilityEmoji(score)}`
      )
      .setTimestamp();

    if (callChannel) embed.addFields({ name: "💬 Chat privado", value: `<#${callChannel.id}>`, inline: true });
    if (privateCall) embed.addFields({ name: "🔊 Call privada", value: `<#${privateCall.id}>`, inline: true });

    await interaction.editReply({ embeds: [embed] });

    if (callChannel) {
      const intro = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("💕 Chat de Match")
        .setDescription(`Olá <@${targetUserId}> e <@${interaction.user.id}>! Vocês fizeram match com **${score}%** de compatibilidade!\n\nAproveitam para se conhecer! 💌`);
      await callChannel.send({ content: `<@${targetUserId}> <@${interaction.user.id}>`, embeds: [intro] });
    }

    const timerMs = config.privateCall.deleteAfterMinutes * 60 * 1000;
    if (privateCall) {
      const timer = setTimeout(async () => {
        const ch = interaction.guild.channels.cache.get(privateCall.id);
        if (ch && ch.members.size === 0) await ch.delete().catch(() => {});
      }, timerMs);
      client.privateCallTimers.set(privateCall.id, timer);
    }
  },
};
