const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "saldo",
  aliases: ["bal", "carteira", "coins"],
  description: "Veja seu saldo ou de outro usuário",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`💰 Saldo de ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "👜 Carteira", value: `\`${dbUser.economy.wallet.toLocaleString("pt-BR")}\` 💰`, inline: true },
        { name: "🏦 Banco", value: `\`${dbUser.economy.bank.toLocaleString("pt-BR")}\` 💰`, inline: true },
        { name: "💎 Total", value: `\`${(dbUser.economy.wallet + dbUser.economy.bank).toLocaleString("pt-BR")}\` 💰`, inline: true }
      )
      .setFooter({ text: `Pedido por ${message.author.username}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
