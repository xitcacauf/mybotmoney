const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const Shop = require("../../models/Shop");

const defaultItems = [
  // Casas
  { itemId: "house_upgrade", name: "Upgrade de Casa", type: "house", price: 5000, emoji: "🏠", description: "Melhora sua casa um nível (use !casa)", available: true },
  // Pets
  { itemId: "pet_cat", name: "Gatinho", type: "pet", price: 2000, emoji: "🐱", description: "Um gatinho fofo para adotar", available: true },
  { itemId: "pet_dog", name: "Cachorro", type: "pet", price: 2500, emoji: "🐶", description: "Um cachorro leal e brincalhão", available: true },
  { itemId: "pet_rabbit", name: "Coelhinho", type: "pet", price: 1800, emoji: "🐰", description: "Um coelhinho fofinho", available: true },
  { itemId: "pet_dragon", name: "Dragão Mini", type: "pet", price: 15000, emoji: "🐉", description: "Pet raro! Dragãozinho de estimação", available: true },
  // Relacionamento
  { itemId: "ring", name: "Anel de Noivado", type: "other", price: 8000, emoji: "💍", description: "Para pedir alguém em casamento (!casar)", available: true },
  // Presentes
  { itemId: "flower", name: "Buquê de Flores", type: "gift", price: 500, emoji: "💐", description: "Presente romântico (+5 vínculo)", available: true },
  { itemId: "chocolate", name: "Caixa de Chocolates", type: "gift", price: 800, emoji: "🍫", description: "Um presente doce (+7 vínculo)", available: true },
  // Status / Aparência
  { itemId: "badge_vip", name: "Badge VIP", type: "status", price: 5000, emoji: "👑", description: "Badge VIP no perfil por 30 dias", available: true },
  { itemId: "aura_magnetico", name: "Aura Magnética", type: "status", price: 8000, emoji: "🟡", description: "Define sua aura como magnético por 7 dias", available: true },
  { itemId: "aura_venenoso", name: "Aura Venenosa", type: "status", price: 12000, emoji: "🟣", description: "Define sua aura como venenoso por 7 dias", available: true },
  { itemId: "aura_divino", name: "Aura Divina", type: "status", price: 25000, emoji: "✨", description: "Aura mais rara! Divino por 7 dias", available: true },
  { itemId: "crown", name: "Coroa de Ouro", type: "status", price: 15000, emoji: "👑", description: "Badge de coroa no perfil", available: true },
  // Consumíveis
  { itemId: "potion_xp", name: "Poção de XP", type: "consumable", price: 1500, emoji: "⚗️", description: "Dobra XP por 1 hora (!usar potion_xp)", available: true },
  { itemId: "potion_luck", name: "Poção da Sorte", type: "consumable", price: 2000, emoji: "🍀", description: "+50% chance em crimes por 30min", available: true },
  { itemId: "charm_boost", name: "Poção de Charme", type: "consumable", price: 3000, emoji: "💋", description: "+5 charme permanente nos atributos RPG", available: true },
  // Dark Love
  { itemId: "collar_gold", name: "Coleira de Ouro", type: "dark", price: 10000, emoji: "⛓️", description: "Coleira premium para o Dark Love System", available: true },
];

const categoryNames = {
  house: "🏠 Casas & Imóveis",
  pet: "🐾 Pets",
  gift: "🎁 Presentes",
  status: "✨ Status & Aparência",
  consumable: "⚗️ Consumíveis",
  other: "📦 Outros",
  dark: "🖤 Dark Love",
};

module.exports = {
  name: "loja",
  aliases: ["shop", "mercado"],
  description: "Veja a loja do servidor. Ex: !loja | !loja status | !loja pets",
  cooldown: 5,
  async execute(message, args, client) {
    const filterCat = args[0]?.toLowerCase();
    const catMap = { status: "status", pets: "pet", pet: "pet", presentes: "gift", dark: "dark", consumiveis: "consumable" };
    const filterKey = catMap[filterCat];

    let items = await Shop.find({ guildId: message.guild.id, available: true });
    if (!items.length) {
      await Shop.insertMany(defaultItems.map((i) => ({ ...i, guildId: message.guild.id })));
      items = defaultItems.map((i) => ({ ...i, guildId: message.guild.id }));
    }

    const results = items._results || items;
    const filtered = filterKey ? results.filter((i) => i.type === filterKey) : results;

    const grouped = {};
    filtered.forEach((item) => {
      const cat = categoryNames[item.type] || "📦 Outros";
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(item);
    });

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("🛒 Loja do Servidor")
      .setDescription(
        "Use **`!comprar <id>`** para comprar.\n" +
        "Filtre por categoria: `!loja status` `!loja pets` `!loja presentes` `!loja dark`"
      )
      .setTimestamp();

    for (const [cat, catItems] of Object.entries(grouped)) {
      const value = catItems
        .map((i) => `${i.emoji} **${i.name}** — \`${i.price.toLocaleString("pt-BR")} 💰\`\n└ ${i.description} \`!comprar ${i.itemId}\``)
        .join("\n");
      embed.addFields({ name: cat, value: value.slice(0, 1024), inline: false });
    }

    embed.setFooter({ text: `${filtered.length} itens • !inventario para ver seus itens • !usar <id> para consumíveis` });
    await message.reply({ embeds: [embed] });
  },
};
