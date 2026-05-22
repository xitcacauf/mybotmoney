const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const GuildConfig = require("../models/GuildConfig");
const { sanitizeText } = require("../utils/sanitize");

module.exports = {
  customId: "confession_submit",
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const text = sanitizeText(interaction.fields.getTextInputValue("confession_text"), 1000);
    if (!text) return interaction.editReply({ content: "❌ Confissão inválida ou muito curta." });

    const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);
    const confessionsChannelId = config.channels?.confessions || gConfig.channels?.confessions || null;
    const channel = confessionsChannelId
      ? interaction.guild.channels.cache.get(confessionsChannelId)
      : null;

    const confessionNumber = Math.floor(Math.random() * 9000) + 1000;

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle(`🕵️ Confissão Anônima #${confessionNumber}`)
      .setDescription(`> *${text}*`)
      .setFooter({ text: "Identidade completamente oculta • Dark Love System" })
      .setTimestamp();

    if (channel) {
      await channel.send({ embeds: [embed] });
      return interaction.editReply({ content: `✅ Sua confissão foi enviada anonimamente em <#${channel.id}>!` });
    }

    await interaction.followUp({ embeds: [embed], ephemeral: false });
    return interaction.editReply({ content: "✅ Confissão publicada! (Configure `CONFESSIONS_CHANNEL` para um canal dedicado)" });
  },
};
