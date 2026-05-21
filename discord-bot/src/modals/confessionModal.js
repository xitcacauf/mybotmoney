const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const GuildConfig = require("../models/GuildConfig");
const { sanitizeText } = require("../utils/sanitize");

module.exports = {
  customId: "confession_submit",
  async execute(interaction, client) {
    const text = sanitizeText(interaction.fields.getTextInputValue("confession_text"), 1000);
    if (!text) return interaction.reply({ content: "❌ Confissão inválida.", ephemeral: true });

    const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);
    const channel = interaction.guild.channels.cache.get(config.channels.confessions || gConfig.moderation?.logChannelId);

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("🕵️ Confissão Anônima")
      .setDescription(`> *${text}*`)
      .setFooter({ text: "Identidade completamente oculta • Dark Love System" })
      .setTimestamp();

    if (channel) {
      await channel.send({ embeds: [embed] });
      return interaction.reply({ content: "✅ Confissão enviada anonimamente!", ephemeral: true });
    }

    await interaction.reply({ embeds: [embed], ephemeral: false });
  },
};
