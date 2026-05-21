const {
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const Match = require("../models/Match");
const { calcCompatibility, getCompatibilityEmoji } = require("../systems/CompatibilityEngine");
const GuildConfig = require("../models/GuildConfig");

module.exports = {
  customId: ["duo_accept", "duo_deactivate"],
  async execute(interaction, client) {
    const id = interaction.customId;

    if (id === "duo_deactivate") {
      await User.findOneAndUpdate(
        { userId: interaction.user.id, guildId: interaction.guild.id },
        { $set: { "duo.active": false } }
      );
      return interaction.reply({ content: "✅ Perfil de duo desativado.", ephemeral: true });
    }

    if (id === "duo_accept") {
      const originalUserId = interaction.message.content?.match(/<@(\d+)>/)?.[1] ||
        interaction.message.embeds[0]?.author?.name;

      const targetUser = interaction.guild.members.cache.find(
        (m) => interaction.message.author?.id !== interaction.user.id && m.id !== interaction.user.id
      );

      const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);
      const [caller1, caller2] = [interaction.user, interaction.message.author || { id: "unknown" }];

      const compat = Math.floor(60 + Math.random() * 40);

      const privateCall = await interaction.guild.channels.create({
        name: `🎮 Duo Match`,
        type: ChannelType.GuildVoice,
        parent: gConfig.privateCalls?.categoryId || null,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.Connect] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.Connect] },
        ],
      }).catch(() => null);

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle("🎮 Duo Match Encontrado!")
        .setDescription(`**Compatibilidade:** ${compat}% — ${getCompatibilityEmoji(compat)}`)
        .setTimestamp();

      if (privateCall) embed.addFields({ name: "🔊 Call privada", value: `<#${privateCall.id}>` });

      await interaction.reply({ embeds: [embed] });
    }
  },
};
