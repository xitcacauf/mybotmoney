const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const JsonDB = require("../utils/JsonDB");

const webDB = new JsonDB("webprofiles");

module.exports = {
  customId: "web_toggle_profile",
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const existing = await webDB.findOne({ userId: interaction.user.id, guildId: interaction.guild.id });
    const isActive = existing?.active || false;

    await webDB.findOneAndUpdate(
      { userId: interaction.user.id, guildId: interaction.guild.id },
      { $set: { active: !isActive, userId: interaction.user.id, guildId: interaction.guild.id, username: interaction.user.username } },
      { upsert: true }
    );

    const embed = new EmbedBuilder()
      .setColor(!isActive ? config.colors.success : config.colors.warning)
      .setDescription(
        !isActive
          ? "✅ Seu perfil web foi **ativado**! Você aparece nas buscas de `!web ver`."
          : "❌ Seu perfil web foi **desativado**. Você não aparece mais nas buscas."
      );

    return interaction.editReply({ embeds: [embed] });
  },
};
