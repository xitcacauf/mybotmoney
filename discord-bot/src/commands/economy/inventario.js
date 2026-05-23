const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const typeEmojis = {
  house: "🏠", pet: "🐾", gift: "🎁", status: "✨", consumable: "⚗️",
  other: "📦", dark: "⛓️",
};

const typeCats = {
  house: "🏠 Imóveis",
  pet: "🐾 Pets",
  gift: "🎁 Presentes",
  status: "✨ Status & Aura",
  consumable: "⚗️ Consumíveis",
  dark: "⛓️ Dark Love",
  other: "📦 Outros",
};

module.exports = {
  name: "inventario",
  aliases: ["inv", "itens", "inventory", "bolsa"],
  description: "Seu inventário completo — itens, pets e equipamentos",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);

    const inventory = dbUser.inventory || [];

    // Agrupar por tipo
    const grouped = {};
    for (const item of inventory) {
      const cat = typeCats[item.type] || "📦 Outros";
      if (!grouped[cat]) grouped[cat] = [];
      const existing = grouped[cat].find((i) => i.itemId === item.itemId);
      if (existing) {
        existing.quantity = (existing.quantity || 1) + (item.quantity || 1);
      } else {
        grouped[cat].push({ ...item });
      }
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`🎒 Inventário — ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }));

    if (!inventory.length) {
      embed.setDescription(
        "Inventário vazio!\n\n" +
        "🛒 Use `!loja` para ver itens disponíveis\n" +
        "💳 Use `!comprar <id>` para comprar\n" +
        "⚗️ Use `!usar <id>` para ativar consumíveis"
      );
    } else {
      for (const [cat, items] of Object.entries(grouped)) {
        const value = items
          .map((i) => `${i.emoji || "📦"} **${i.name}** x${i.quantity || 1}`)
          .join("\n");
        embed.addFields({ name: cat, value: value.slice(0, 1020), inline: false });
      }
    }

    // Pet ativo
    if (dbUser.pet?.adopted) {
      const petHunger = dbUser.pet?.hunger || 0;
      const petHappy = dbUser.pet?.happiness || 0;
      const bar = (val) => {
        const f = Math.floor(val / 10);
        return "█".repeat(f) + "░".repeat(10 - f);
      };
      embed.addFields({
        name: `${dbUser.pet.emoji} Pet Ativo: ${dbUser.pet.name}`,
        value:
          `Fome: ${bar(petHunger)} ${petHunger}%\n` +
          `Felicidade: ${bar(petHappy)} ${petHappy}%\n` +
          `*Use \`!pet cuidar\` para alimentar*`,
        inline: false,
      });
    }

    // Status de aura ativa
    if (dbUser.profile?.aura && dbUser.profile?.aura !== "comum") {
      const auraExpiry = dbUser.profile?.auraExpiry;
      const auraStatus = auraExpiry && new Date(auraExpiry) > new Date()
        ? `Expira <t:${Math.floor(new Date(auraExpiry).getTime() / 1000)}:R>`
        : "Ativa (permanente)";
      embed.addFields({
        name: "✨ Aura Ativa",
        value: `${dbUser.profile.aura} — ${auraStatus}`,
        inline: false,
      });
    }

    embed
      .addFields(
        { name: "💰 Carteira", value: `${(dbUser.economy?.wallet || 0).toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "🏦 Banco", value: `${(dbUser.economy?.bank || 0).toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "🎒 Total de Itens", value: `${inventory.length}`, inline: true },
      )
      .setFooter({ text: "!usar <id> para consumíveis • !presente @user <id> para presentear" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
