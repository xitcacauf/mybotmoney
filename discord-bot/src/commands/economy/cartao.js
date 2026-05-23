const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const cardTiers = [
  {
    name: "⚫ Black Elite",
    min: 100000,
    color: 0x000000,
    bg: "```\n╔══════════════════════════╗\n║  ⚫ BLACK ELITE          ║\n║                          ║\n║  **** **** **** ████     ║\n║                          ║\n║  Juros 3%/dia            ║\n╚══════════════════════════╝\n```",
    perks: ["📈 Juros 3%/dia no banco", "🔫 Crime bônus +15%", "👑 Badge Black no perfil", "🛒 Loja com -10% de desconto", "⚡ Transferências sem limite"],
    limit: "Ilimitado",
    badge: "⚫ Black",
  },
  {
    name: "💜 Dominador",
    min: 50000,
    color: 0x4b0082,
    bg: "```\n╔══════════════════════════╗\n║  💜 DOMINADOR            ║\n║                          ║\n║  **** **** **** ████     ║\n║                          ║\n║  Juros 2.5%/dia          ║\n╚══════════════════════════╝\n```",
    perks: ["📈 Juros 2.5%/dia no banco", "🔫 Crime bônus +10%", "💜 Badge Dominador", "⚡ Transferências VIP"],
    limit: "500.000 💰",
    badge: "💜 Dominador",
  },
  {
    name: "🔴 Luxúria",
    min: 25000,
    color: 0x8b0000,
    bg: "```\n╔══════════════════════════╗\n║  🔴 LUXÚRIA              ║\n║                          ║\n║  **** **** **** ████     ║\n║                          ║\n║  Juros 2%/dia            ║\n╚══════════════════════════╝\n```",
    perks: ["📈 Juros 2%/dia no banco", "🎁 Presente com bônus duplo de vínculo", "🔴 Badge Luxúria"],
    limit: "200.000 💰",
    badge: "🔴 Luxúria",
  },
  {
    name: "🟣 Neon",
    min: 10000,
    color: 0x9b59b6,
    bg: "```\n╔══════════════════════════╗\n║  🟣 NEON                 ║\n║                          ║\n║  **** **** **** ████     ║\n║                          ║\n║  Juros 2%/dia            ║\n╚══════════════════════════╝\n```",
    perks: ["📈 Juros 2%/dia no banco", "⭐ Bônus de XP +10%", "🟣 Badge Neon"],
    limit: "100.000 💰",
    badge: "🟣 Neon",
  },
  {
    name: "🟢 Standard",
    min: 0,
    color: 0x27ae60,
    bg: "```\n╔══════════════════════════╗\n║  🟢 STANDARD             ║\n║                          ║\n║  **** **** **** ████     ║\n║                          ║\n║  Juros 2%/dia            ║\n╚══════════════════════════╝\n```",
    perks: ["📈 Juros 2%/dia no banco", "💳 Acesso básico à loja"],
    limit: "50.000 💰",
    badge: "🟢 Standard",
  },
];

function getCard(total) {
  return cardTiers.find((c) => total >= c.min) || cardTiers[cardTiers.length - 1];
}

module.exports = {
  name: "cartao",
  aliases: ["card", "credito", "conta_virtual"],
  description: "Veja seu cartão virtual e benefícios do seu tier",
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);

    const wallet = dbUser.economy?.wallet || 0;
    const bank = dbUser.economy?.bank || 0;
    const total = wallet + bank;
    const card = getCard(total);

    // Próximo tier
    const cardIdx = cardTiers.findIndex((c) => total >= c.min);
    const nextCard = cardIdx > 0 ? cardTiers[cardIdx - 1] : null;
    const progressToNext = nextCard
      ? Math.min(100, Math.floor((total / nextCard.min) * 100))
      : 100;

    const progressBar = (() => {
      const filled = Math.floor(progressToNext / 5);
      const empty = 20 - filled;
      return "█".repeat(filled) + "░".repeat(empty) + ` ${progressToNext}%`;
    })();

    const embed = new EmbedBuilder()
      .setColor(card.color)
      .setTitle(`💳 Cartão Virtual — ${target.username}`)
      .setDescription(card.bg)
      .addFields(
        { name: "🏷️ Tier Atual", value: card.name, inline: true },
        { name: "💎 Patrimônio", value: `${total.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "💳 Limite", value: card.limit, inline: true },
        {
          name: "🎁 Benefícios",
          value: card.perks.join("\n"),
          inline: false,
        },
        nextCard
          ? {
              name: `⬆️ Próximo: ${nextCard.name}`,
              value: `Faltam **${(nextCard.min - total).toLocaleString("pt-BR")} 💰**\n${progressBar}`,
              inline: false,
            }
          : { name: "✅ Tier Máximo", value: "Você está no topo do sistema bancário! 🏆", inline: false },
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setFooter({ text: "Cartão evolui automaticamente com o patrimônio • !saldo para ver detalhes" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
  getCard,
  cardTiers,
};
