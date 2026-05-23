const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");

module.exports = {
  name: "apoie",
  aliases: ["donate", "doar", "apoiar", "suporte"],
  description: "Apoie o servidor com uma doação e mantenha tudo no ar!",
  cooldown: 10,
  async execute(message) {
    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary || 0xe91e8c)
      .setTitle("💖 Apoie o Love Link!")
      .setDescription(
        `Olá, **${message.author.username}**! 🌸\n\n` +
        `O Love Link é mantido com muito carinho e dedicação.\n` +
        `Se você curte a comunidade, considere fazer uma doação — qualquer valor ajuda a manter o bot online e melhorando!\n\n` +
        `🔗 **Link de doação:**\nhttps://trashdonate.netlify.app/\n\n` +
        `*Todo apoio é extremamente valorizado. Obrigado por fazer parte da família Love Link!* 💕`
      )
      .addFields(
        { name: "🎁 O que sua doação faz", value: "Mantém o bot online 24/7\nFinancia novos recursos\nApoio ao desenvolvedor", inline: true },
        { name: "💳 Como doar", value: "Acesse o link abaixo\nEscolha o valor\nQualquer quantia ajuda!", inline: true },
      )
      .setFooter({ text: `Solicitado por ${message.author.username}` })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel("💖 Fazer Doação")
        .setStyle(ButtonStyle.Link)
        .setURL("https://trashdonate.netlify.app/")
    );

    return message.reply({ embeds: [embed], components: [row] });
  },
};
