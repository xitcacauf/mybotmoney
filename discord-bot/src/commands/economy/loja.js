const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const Shop = require("../../models/Shop");

const defaultItems = [
  { itemId: "house_upgrade", name: "Upgrade de Casa", type: "house", price: 5000, emoji: "🏠", description: "Melhora sua casa um nível (use !casa)", available: true },
  { itemId: "pet_cat", name: "Gatinho", type: "pet", price: 2000, emoji: "🐱", description: "Um gatinho fofo para adotar", available: true },
  { itemId: "pet_dog", name: "Cachorro", type: "pet", price: 2500, emoji: "🐶", description: "Um cachorro leal e brincalhão", available: true },
  { itemId: "pet_rabbit", name: "Coelhinho", type: "pet", price: 1800, emoji: "🐰", description: "Um coelhinho fofinho", available: true },
  { itemId: "pet_dragon", name: "Dragão Mini", type: "pet", price: 15000, emoji: "🐉", description: "Pet raro! Dragãozinho de estimação", available: true },
  { itemId: "pet_fox", name: "Raposa", type: "pet", price: 5000, emoji: "🦊", description: "Uma raposa esperta e carinhosa", available: true },
  { itemId: "ring", name: "Anel de Noivado", type: "other", price: 8000, emoji: "💍", description: "Para pedir alguém em casamento (!casar)", available: true },
  { itemId: "flower", name: "Buquê de Flores", type: "gift", price: 500, emoji: "💐", description: "Presente romântico (+5 vínculo)", available: true },
  { itemId: "chocolate", name: "Caixa de Chocolates", type: "gift", price: 800, emoji: "🍫", description: "Um presente doce (+7 vínculo)", available: true },
  { itemId: "perfume", name: "Perfume Especial", type: "gift", price: 1200, emoji: "🌸", description: "Um presente sofisticado (+10 vínculo)", available: true },
  { itemId: "teddy_bear", name: "Ursinho de Pelúcia", type: "gift", price: 600, emoji: "🧸", description: "Presente fofo para alguém especial (+6 vínculo)", available: true },
  { itemId: "love_letter", name: "Carta de Amor", type: "gift", price: 300, emoji: "💌", description: "Uma carta escrita à mão (+8 vínculo)", available: true },
  { itemId: "jewelry", name: "Joias", type: "gift", price: 3000, emoji: "💎", description: "Joias luxuosas de presente (+20 vínculo)", available: true },
  { itemId: "badge_vip", name: "Badge VIP", type: "status", price: 5000, emoji: "👑", description: "Badge VIP no perfil por 30 dias", available: true },
  { itemId: "aura_magnetico", name: "Aura Magnética", type: "status", price: 8000, emoji: "🟡", description: "Define sua aura como magnético por 7 dias", available: true },
  { itemId: "aura_venenoso", name: "Aura Venenosa", type: "status", price: 12000, emoji: "🟣", description: "Define sua aura como venenoso por 7 dias", available: true },
  { itemId: "aura_divino", name: "Aura Divina", type: "status", price: 25000, emoji: "✨", description: "Aura mais rara! Divino por 7 dias", available: true },
  { itemId: "aura_sombrio", name: "Aura Sombria", type: "status", price: 10000, emoji: "🌑", description: "Aura dark e misteriosa por 7 dias", available: true },
  { itemId: "aura_flamejante", name: "Aura Flamejante", type: "status", price: 9000, emoji: "🔥", description: "Aura de fogo ardente por 7 dias", available: true },
  { itemId: "crown", name: "Coroa de Ouro", type: "status", price: 15000, emoji: "👑", description: "Badge de coroa dourada no perfil", available: true },
  { itemId: "title_elite", name: "Título de Elite", type: "status", price: 20000, emoji: "🏆", description: "Título exclusivo de Elite no perfil", available: true },
  { itemId: "frame_gold", name: "Moldura Dourada", type: "status", price: 7000, emoji: "🖼️", description: "Moldura dourada no perfil por 14 dias", available: true },
  { itemId: "potion_xp", name: "Poção de XP", type: "consumable", price: 1500, emoji: "⚗️", description: "Dobra XP por 1 hora (!usar potion_xp)", available: true },
  { itemId: "potion_luck", name: "Poção da Sorte", type: "consumable", price: 2000, emoji: "🍀", description: "+50% chance em crimes por 30min", available: true },
  { itemId: "charm_boost", name: "Poção de Charme", type: "consumable", price: 3000, emoji: "💋", description: "+5 charme permanente nos atributos RPG", available: true },
  { itemId: "energy_drink", name: "Energético", type: "consumable", price: 1000, emoji: "⚡", description: "Reduz cooldown do !trabalhar para 15 min", available: true },
  { itemId: "daily_boost", name: "Bônus Diário", type: "consumable", price: 2500, emoji: "🎁", description: "+100% no próximo !diario", available: true },
  { itemId: "collar_gold", name: "Coleira de Ouro", type: "dark", price: 10000, emoji: "⛓️", description: "Coleira premium para o Dark Love System", available: true },
  { itemId: "collar_dark", name: "Coleira das Trevas", type: "dark", price: 20000, emoji: "🖤", description: "Coleira ultra-rara com aura dark especial", available: true },
  { itemId: "whip", name: "Chicote de Couro", type: "dark", price: 5000, emoji: "🪶", description: "Item do Dark Love System", available: true },
  { itemId: "contract_scroll", name: "Pergaminho de Contrato", type: "dark", price: 3000, emoji: "📜", description: "Formaliza um !contrato no Dark Love System", available: true },
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
  description: "Veja a loja do servidor. Ex: !loja | !loja status | !loja pets | !loja presentes | !loja dark",
  cooldown: 5,
  async execute(message, args, client) {
    const filterCat = args[0]?.toLowerCase();
    const catMap = {
      status: "status",
      pets: "pet", pet: "pet",
      presentes: "gift", presente: "gift", gift: "gift",
      dark: "dark",
      consumiveis: "consumable", consumivel: "consumable",
      house: "house", casa: "house",
      outros: "other",
    };
    const filterKey = catMap[filterCat];

    let dbItems = [];
    try {
      const raw = await Shop.find({ guildId: message.guild.id, available: true });
      dbItems = Array.isArray(raw) ? raw : [];
    } catch {}

    const dbItemIds = new Set(dbItems.map((i) => i.itemId));
    const allItems = [
      ...dbItems,
      ...defaultItems.filter((i) => !dbItemIds.has(i.itemId)).map((i) => ({ ...i, guildId: message.guild.id })),
    ];

    const filtered = filterKey ? allItems.filter((i) => i.type === filterKey) : allItems;

    if (filtered.length === 0 && filterKey) {
      return message.reply({
        embeds: [new EmbedBuilder().setColor(config.colors.warning).setDescription(`❌ Nenhum item encontrado na categoria \`${filterCat}\`.`)],
      });
    }

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
        "Use **`!comprar <id>`** para comprar um item.\n" +
        "Filtre por categoria: `!loja status` · `!loja pets` · `!loja presentes` · `!loja dark` · `!loja consumiveis`"
      )
      .setTimestamp();

    for (const [cat, catItems] of Object.entries(grouped)) {
      const value = catItems
        .map((i) => `${i.emoji} **${i.name}** — \`${i.price.toLocaleString("pt-BR")} 💰\`\n└ ${i.description} \`!comprar ${i.itemId}\``)
        .join("\n");
      embed.addFields({ name: cat, value: value.slice(0, 1024), inline: false });
    }

    embed.setFooter({ text: `${filtered.length} item(s) • !inventario para ver seus itens • !usar <id> para consumíveis` });
    await message.reply({ embeds: [embed] });
  },
};
