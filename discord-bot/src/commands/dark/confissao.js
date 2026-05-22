const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");

module.exports = {
  name: "confissao",
  aliases: ["confession", "anonimo", "confessar"],
  description: "Envie uma confissão anônima no canal configurado",
  cooldown: 60,
  async execute(message, args, client) {
    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("🕵️ Confissão Anônima")
      .setDescription(
        "Clique no botão abaixo para enviar sua confissão.\n\n" +
        "🔒 **Sua identidade é 100% protegida** — ninguém, nem os admins, saberão quem enviou."
      )
      .setFooter({ text: "Dark Love System • Confissões são anônimas" });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId("open_confession_modal")
        .setLabel("🕵️ Enviar Confissão Anônima")
        .setStyle(ButtonStyle.Danger)
    );

    await message.reply({ embeds: [embed], components: [row] });
    await message.delete().catch(() => {});
  },
};
