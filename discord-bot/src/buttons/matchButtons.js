const {
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const { getCompatibilityEmoji } = require("../systems/CompatibilityEngine");
const GuildConfig = require("../models/GuildConfig");

module.exports = {
  customId: ["duo_accept", "duo_deactivate"],
  async execute(interaction, client) {
    const id = interaction.customId;

    // Defer immediately to prevent double-click from processing twice
    await interaction.deferReply({ ephemeral: id === "duo_deactivate" });

    if (id === "duo_deactivate") {
      await User.findOneAndUpdate(
        { userId: interaction.user.id, guildId: interaction.guild.id },
        { $set: { "duo.active": false } }
      );
      return interaction.editReply({ content: "✅ Perfil de duo desativado." });
    }

    if (id === "duo_accept") {
      const compat = Math.floor(60 + Math.random() * 40);
      const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);

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

      return interaction.editReply({ embeds: [embed] });
    }
  },
};
