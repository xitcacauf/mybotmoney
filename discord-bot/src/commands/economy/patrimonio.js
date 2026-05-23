const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { cardTiers } = require("./cartao");

const houseLevels = [
  { level: 0, name: "Sem Casa", value: 0 },
  { level: 1, name: "Barraco 🏠", value: 5000 },
  { level: 2, name: "Apartamento 🏢", value: 15000 },
  { level: 3, name: "Casa Gourmet 🏡", value: 35000 },
  { level: 4, name: "Chalé Premium 🏘️", value: 60000 },
  { level: 5, name: "Mansão 🏰", value: 100000 },
];

module.exports = {
  name: "patrimonio",
  aliases: ["wealth", "riqueza", "networth", "fortuna"],
  description: "Visão completa de toda sua riqueza virtual",
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);

    const wallet = dbUser.economy?.wallet || 0;
    const bank = dbUser.economy?.bank || 0;
    const houseLevel = dbUser.house?.level || 0;
    const houseValue = houseLevels[houseLevel]?.value || 0;
    const houseName = houseLevels[houseLevel]?.name || "Sem Casa";

    // Calcular valor de itens raros
    const rarePrices = {
      ring_gift: 2000, heart: 3000, crown_gift: 5000, mansion: 8000, star: 10000,
      collar_gold: 10000, aura_divino: 25000, aura_venenoso: 12000, aura_magnetico: 8000,
      badge_vip: 5000, pet_dragon: 15000,
    };
    const inventory = dbUser.inventory || [];
    const inventoryValue = inventory.reduce((acc, item) => acc + (rarePrices[item.itemId] || 0) * (item.quantity || 1), 0);

    const totalNet = wallet + bank + houseValue + inventoryValue;

    const card = (cardTiers || []).find((c) => totalNet >= (c.min || 0)) || { name: "🟢 Standard" };

    // Progressão de riqueza
    const ranks = [
      { name: "🪨 Pobre", min: 0 },
      { name: "🟤 Trabalhador", min: 5000 },
      { name: "🟡 Classe Média", min: 20000 },
      { name: "🟠 Próspero", min: 50000 },
      { name: "🔴 Abastado", min: 100000 },
      { name: "💜 Elite", min: 250000 },
      { name: "⚫ Magnata", min: 500000 },
      { name: "👑 Oligarca", min: 1000000 },
    ];
    const rank = [...ranks].reverse().find((r) => totalNet >= r.min) || ranks[0];
    const nextRank = ranks[ranks.indexOf(rank) + 1];

    // Barra de progresso para próximo rank
    const progressBar = nextRank
      ? (() => {
          const pct = Math.min(100, Math.floor(((totalNet - rank.min) / (nextRank.min - rank.min)) * 100));
          const filled = Math.floor(pct / 5);
          return "█".repeat(filled) + "░".repeat(20 - filled) + ` ${pct}%`;
        })()
      : "█".repeat(20) + " 100% MAX";

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`🏦 Patrimônio — ${target.username}`)
      .setDescription(`**${rank.name}** ${nextRank ? `→ ${nextRank.name}` : "✅ Rank Máximo!"}`)
      .addFields(
        { name: "👜 Carteira", value: `${wallet.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "🏦 Banco", value: `${bank.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "🏠 Imóvel", value: `${houseValue.toLocaleString("pt-BR")} 💰\n*(${houseName})*`, inline: true },
        { name: "🎒 Itens Raros", value: `${inventoryValue.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "💎 Patrimônio Líquido", value: `**${totalNet.toLocaleString("pt-BR")} 💰**`, inline: true },
        { name: "💳 Cartão", value: card.name, inline: true },
        {
          name: nextRank ? `📊 Progresso → ${nextRank.name}` : "📊 Progresso",
          value: progressBar,
          inline: false,
        },
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "!banco | !investir | !cartao | !ranking ricos" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
