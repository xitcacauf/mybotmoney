const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const GuildConfig = require("../models/GuildConfig");
const { sanitizeText } = require("../utils/sanitize");

module.exports = {
  customId: /^duo_create_/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: false });
    const game = interaction.customId.replace("duo_create_", "");
    const rank = sanitizeText(interaction.fields.getTextInputValue("rank"), 30);
    const platform = sanitizeText(interaction.fields.getTextInputValue("platform"), 20);
    const objective = sanitizeText(interaction.fields.getTextInputValue("objective"), 50);
    const schedule = sanitizeText(interaction.fields.getTextInputValue("schedule"), 50);
    const playstyle = sanitizeText(interaction.fields.getTextInputValue("playstyle") || "Flex", 50);

    await User.findOneAndUpdate(
      { userId: interaction.user.id, guildId: interaction.guild.id },
      {
        $set: {
          "duo.active": true,
          "duo.profileData": { game, rank, platform, objective, schedule, playstyle, microphone: true },
        },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🎮 ${interaction.user.username} — Procurando Duo`)
      .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "🎮 Jogo", value: game, inline: true },
        { name: "🏆 Rank", value: rank, inline: true },
        { name: "📱 Plataforma", value: platform, inline: true },
        { name: "🎯 Objetivo", value: objective, inline: true },
        { name: "⏰ Horário", value: schedule, inline: true },
        { name: "🕹️ Estilo", value: playstyle, inline: true }
      )
      .setAuthor({ name: interaction.user.tag, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setFooter({ text: "Clique em ✅ para aceitar o duo!" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("duo_accept").setLabel("✅ Aceitar Duo").setStyle(ButtonStyle.Success),
      new ButtonBuilder().setCustomId("duo_deactivate").setLabel("❌ Cancelar").setStyle(ButtonStyle.Danger)
    );

    const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);
    const duoChannel = interaction.guild.channels.cache.get(config.channels.duo || gConfig.dating?.channelId);

    if (duoChannel) {
      await duoChannel.send({ embeds: [embed], components: [row] });
      return interaction.editReply({ content: `✅ Perfil publicado em <#${duoChannel.id}>!` });
    }

    await interaction.editReply({ embeds: [embed], components: [row] });
  },
};
