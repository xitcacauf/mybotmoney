const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const Shop = require("../../models/Shop");

const defaultItems = [
  { itemId: "house_small", name: "Casa Simples", type: "furniture", price: 5000, emoji: "🏠", description: "Uma casa pequena mas aconchegante" },
  { itemId: "house_medium", name: "Casa Média", type: "furniture", price: 15000, emoji: "🏡", description: "Uma casa confortável" },
  { itemId: "house_big", name: "Mansão", type: "furniture", price: 50000, emoji: "🏰", description: "Uma mansão imponente" },
  { itemId: "pet_cat", name: "Gatinho", type: "pet", price: 2000, emoji: "🐱", description: "Um gatinho fofo" },
  { itemId: "pet_dog", name: "Cachorro", type: "pet", price: 2500, emoji: "🐶", description: "Um cachorro leal" },
  { itemId: "effect_vip", name: "Status VIP", type: "effect", price: 3000, emoji: "👑", description: "Badge VIP no perfil" },
  { itemId: "ring", name: "Anel de Noivado", type: "other", price: 8000, emoji: "💍", description: "Para pedir em casamento" },
  { itemId: "flower", name: "Buquê de Flores", type: "other", price: 500, emoji: "💐", description: "Presente romântico" },
];

module.exports = {
  name: "loja",
  aliases: ["shop", "comprar"],
  description: "Veja a loja do servidor",
  cooldown: 5,
  async execute(message, args, client) {
    let items = await Shop.find({ guildId: message.guild.id, available: true });
    if (!items.length) {
      await Shop.insertMany(defaultItems.map((i) => ({ ...i, guildId: message.guild.id })));
      items = defaultItems;
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("🛒 Loja do Servidor")
      .setDescription("Use `!comprar <id_item>` para comprar um item.")
      .setTimestamp();

    items.slice(0, 9).forEach((item) => {
      embed.addFields({
        name: `${item.emoji} ${item.name}`,
        value: `${item.description || ""}\n**Preço:** ${item.price.toLocaleString("pt-BR")} 💰\n**ID:** \`${item.itemId}\``,
        inline: true,
      });
    });

    embed.setFooter({ text: `${items.length} itens disponíveis` });
    await message.reply({ embeds: [embed] });
  },
};
