const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const config = require("../../config/config");
const Shop = require("../../models/Shop");

const defaultItems = [
  { itemId: "house_small", name: "Casa Simples", type: "house", price: 5000, emoji: "🏠", description: "Uma casa pequena mas aconchegante", available: true },
  { itemId: "house_medium", name: "Casa Média", type: "house", price: 15000, emoji: "🏡", description: "Uma casa confortável com jardim", available: true },
  { itemId: "house_big", name: "Mansão", type: "house", price: 50000, emoji: "🏰", description: "Uma mansão imponente de luxo", available: true },
  { itemId: "pet_cat", name: "Gatinho", type: "pet", price: 2000, emoji: "🐱", description: "Um gatinho fofo para adotar", available: true },
  { itemId: "pet_dog", name: "Cachorro", type: "pet", price: 2500, emoji: "🐶", description: "Um cachorro leal e brincalhão", available: true },
  { itemId: "pet_rabbit", name: "Coelhinho", type: "pet", price: 1800, emoji: "🐰", description: "Um coelhinho fofinho", available: true },
  { itemId: "effect_vip", name: "Status VIP", type: "effect", price: 3000, emoji: "👑", description: "Badge VIP no perfil por 30 dias", available: true },
  { itemId: "ring", name: "Anel de Noivado", type: "other", price: 8000, emoji: "💍", description: "Para pedir alguém em casamento", available: true },
  { itemId: "flower", name: "Buquê de Flores", type: "other", price: 500, emoji: "💐", description: "Presente romântico para seu par", available: true },
  { itemId: "chocolate", name: "Caixa de Chocolates", type: "other", price: 800, emoji: "🍫", description: "Um presente doce e delicioso", available: true },
  { itemId: "crown", name: "Coroa de Ouro", type: "other", price: 12000, emoji: "👑", description: "Ostente sua riqueza com uma coroa", available: true },
  { itemId: "potion_xp", name: "Poção de XP", type: "consumable", price: 1500, emoji: "⚗️", description: "Dobra XP ganho por 1 hora", available: true },
];

module.exports = {
  name: "loja",
  aliases: ["shop"],
  description: "Veja a loja do servidor",
  cooldown: 5,
  async execute(message, args, client) {
    let items = await Shop.find({ guildId: message.guild.id, available: true });
    if (!items.length) {
      await Shop.insertMany(defaultItems.map((i) => ({ ...i, guildId: message.guild.id })));
      items = defaultItems.map((i) => ({ ...i, guildId: message.guild.id }));
    }

    const categories = { house: "🏠 Casas", pet: "🐾 Pets", effect: "✨ Efeitos", other: "🎁 Presentes/Outros", consumable: "⚗️ Consumíveis" };
    const grouped = {};
    items.forEach((item) => {
      const cat = categories[item.type] || "📦 Itens";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("🛒 Loja do Servidor")
      .setDescription("Use **`!comprar <id_item>`** para comprar um item.\nExemplo: `!comprar ring`")
      .setTimestamp();

    for (const [cat, catItems] of Object.entries(grouped)) {
      const value = catItems
        .map((i) => `${i.emoji} **${i.name}** — \`${i.price.toLocaleString("pt-BR")} 💰\`\n└ ${i.description} (\`${i.itemId}\`)`)
        .join("\n");
      embed.addFields({ name: cat, value, inline: false });
    }

    embed.setFooter({ text: `${items.length} itens disponíveis • Use !inventario para ver seus itens` });
    await message.reply({ embeds: [embed] });
  },
};
