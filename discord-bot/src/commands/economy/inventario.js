const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "inventario",
  aliases: ["inv", "itens", "inventory"],
  description: "Veja seu inventário",
  cooldown: 5,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`🎒 Inventário de ${message.author.username}`)
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

    if (!dbUser.inventory.length) {
      embed.setDescription("Seu inventário está vazio. Use `!loja` para comprar itens!");
    } else {
      const grouped = {};
      dbUser.inventory.forEach((item) => {
        if (!grouped[item.name]) grouped[item.name] = { ...item, count: 0 };
        grouped[item.name].count += item.quantity || 1;
      });
      const desc = Object.values(grouped)
        .map((i) => `• **${i.name}** x${i.count}`)
        .join("\n");
      embed.setDescription(desc);
    }

    embed.addFields({ name: "💰 Carteira", value: `${dbUser.economy.wallet.toLocaleString("pt-BR")} moedas`, inline: true });
    await message.reply({ embeds: [embed] });
  },
};
