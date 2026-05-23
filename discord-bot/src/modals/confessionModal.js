const { EmbedBuilder } = require("discord.js");
const { sanitizeText } = require("../utils/sanitize");

const CONFESSION_CHANNEL_ID = "1507081398283014205";

module.exports = {
  customId: "confession_submit",
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const text = sanitizeText(interaction.fields.getTextInputValue("confession_text"), 1000);
    if (!text || text.trim().length < 5) {
      return interaction.editReply({ content: "❌ Confissão muito curta ou inválida." });
    }

    const channel = interaction.guild.channels.cache.get(CONFESSION_CHANNEL_ID);
    const confessionNumber = Math.floor(Math.random() * 9000) + 1000;

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle(`🕵️ Confissão Anônima #${confessionNumber}`)
      .setDescription(`> *${text}*`)
      .setFooter({ text: "Identidade completamente oculta • Dark Love System" })
      .setTimestamp();

    if (channel) {
      await channel.send({ embeds: [embed] });
      return interaction.editReply({ content: `✅ Sua confissão foi publicada anonimamente em <#${channel.id}>! 🕵️` });
    }

    await interaction.followUp({ embeds: [embed], ephemeral: false });
    return interaction.editReply({ content: "✅ Confissão publicada com sucesso!" });
  },
};
