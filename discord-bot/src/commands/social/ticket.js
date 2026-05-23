const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const config = require("../../config/config");

module.exports = {
  name: "ticket",
  aliases: ["help-ticket", "abrir"],
  description: "Abre um ticket de suporte",
  cooldown: 30,
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("🎫 Abrir Ticket de Suporte")
      .setDescription(
        "Selecione o **tipo de ticket** no menu abaixo.\n\nUm canal privado será criado automaticamente para você e nossa equipe de staff!"
      )
      .addFields(
        { name: "📋 Tipos disponíveis", value: "🆘 Suporte Geral\n🚨 Denúncia\n❓ Dúvida\n🤝 Parceria\n💬 Outro assunto", inline: false }
      )
      .setFooter({ text: "Tickets são monitorados pela staff. Use com responsabilidade." })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("ticket_type_select")
        .setPlaceholder("📋 Selecione o tipo de ticket...")
        .addOptions([
          { label: "Suporte Geral", value: "suporte", emoji: "🆘", description: "Problemas técnicos ou de servidor" },
          { label: "Denúncia", value: "denuncia", emoji: "🚨", description: "Reportar um usuário ou situação" },
          { label: "Dúvida", value: "duvida", emoji: "❓", description: "Tem uma dúvida? Tire aqui!" },
          { label: "Parceria", value: "parceria", emoji: "🤝", description: "Proposta de parceria com o servidor" },
          { label: "Outro", value: "outro", emoji: "💬", description: "Qualquer outro assunto" },
        ])
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
