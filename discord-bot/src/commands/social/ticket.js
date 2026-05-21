const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const GuildConfig = require("../../models/GuildConfig");

module.exports = {
  name: "ticket",
  aliases: ["suporte", "help-ticket"],
  description: "Abre um ticket de suporte",
  cooldown: 30,
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("🎫 Sistema de Tickets")
      .setDescription(
        "Clique no botão abaixo para abrir um ticket de suporte.\n\nUm membro da staff irá te atender em breve!"
      )
      .addFields(
        { name: "📋 O que posso abrir?", value: "• Dúvidas gerais\n• Problemas no servidor\n• Denúncias\n• Parceria\n• Suporte técnico", inline: false }
      )
      .setFooter({ text: "Tickets são registrados e monitorados pela staff." })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("ticket_create")
        .setLabel("🎫 Abrir Ticket")
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId("ticket_list")
        .setLabel("📋 Meus Tickets")
        .setStyle(ButtonStyle.Secondary)
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
