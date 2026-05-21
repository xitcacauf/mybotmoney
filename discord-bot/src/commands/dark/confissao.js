const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require("discord.js");
const config = require("../../config/config");

module.exports = {
  name: "confissao",
  aliases: ["confession", "anonimo"],
  description: "Envie uma confissão anônima no canal configurado",
  cooldown: 60,
  async execute(message, args, client) {
    const modal = new ModalBuilder()
      .setCustomId("confession_modal")
      .setTitle("🕵️ Confissão Anônima");

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder()
          .setCustomId("confession_text")
          .setLabel("Sua confissão (anônima, ninguém saberá quem é)")
          .setStyle(TextInputStyle.Paragraph)
          .setRequired(true)
          .setMaxLength(1000)
          .setPlaceholder("Escreva aqui... sua identidade será completamente ocultada.")
      )
    );

    const triggerEmbed = {
      color: 0x1a0a2e,
      title: "🕵️ Confissão Anônima",
      description: "Clique no botão abaixo para enviar sua confissão anonimamente.",
    };

    const { EmbedBuilder, ActionRowBuilder: AR, ButtonBuilder, ButtonStyle } = require("discord.js");
    const row = new AR().addComponents(
      new ButtonBuilder().setCustomId("open_confession_modal").setLabel("🕵️ Enviar Confissão").setStyle(ButtonStyle.Danger)
    );

    await message.reply({ embeds: [new EmbedBuilder().setColor(0x1a0a2e).setTitle("🕵️ Confissão Anônima").setDescription("Clique no botão para enviar anonimamente.")], components: [row] });
    await message.delete().catch(() => {});
  },
};
