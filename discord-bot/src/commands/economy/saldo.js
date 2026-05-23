const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { getHeatBonus } = require("../../systems/SocialHeat");

const cardTypes = [
  { name: "⚫ Black Elite", min: 100000, color: 0x1a1a1a, perks: "Juros 3%/dia • Limite premium • Status máximo" },
  { name: "💜 Dominador", min: 50000, color: 0x4b0082, perks: "Juros 2.5%/dia • Crime +10% • Transferência VIP" },
  { name: "🔴 Luxúria", min: 25000, color: 0x8b0000, perks: "Juros 2%/dia • Presente dobrado • Loja -5%" },
  { name: "🟣 Neon", min: 10000, color: 0x9b59b6, perks: "Juros 2%/dia • Bônus de XP" },
  { name: "🟢 Standard", min: 0, color: 0x27ae60, perks: "Juros 2%/dia • Acesso básico" },
];

function getCard(total) {
  return cardTypes.find((c) => total >= c.min) || cardTypes[cardTypes.length - 1];
}

module.exports = {
  name: "saldo",
  aliases: ["bal", "carteira", "coins", "conta"],
  description: "Painel financeiro — saldo, banco, cartão e bônus",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);

    const wallet = dbUser.economy?.wallet || 0;
    const bank = dbUser.economy?.bank || 0;
    const total = wallet + bank;
    const totalEarned = dbUser.economy?.totalEarned || 0;
    const streak = dbUser.economy?.streak || 0;
    const card = getCard(total);

    const { econMult } = await getHeatBonus(message.guild.id).catch(() => ({ econMult: 1 }));
    const projectedInterest = Math.floor(bank * 0.02);

    const isOwn = target.id === message.author.id;

    const embed = new EmbedBuilder()
      .setColor(card.color)
      .setAuthor({
        name: `${card.name} • ${target.username}`,
        iconURL: target.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(`> *${card.perks}*`)
      .addFields(
        {
          name: "👜 Carteira",
          value: `**${wallet.toLocaleString("pt-BR")}** 💰`,
          inline: true,
        },
        {
          name: "🏦 Banco",
          value: `**${bank.toLocaleString("pt-BR")}** 💰`,
          inline: true,
        },
        {
          name: "💎 Patrimônio",
          value: `**${total.toLocaleString("pt-BR")}** 💰`,
          inline: true,
        },
        {
          name: "📈 Rendimento Previsto",
          value: `+${projectedInterest.toLocaleString("pt-BR")} 💰/dia`,
          inline: true,
        },
        {
          name: "🌡️ Bônus Servidor",
          value: `${econMult}x`,
          inline: true,
        },
        {
          name: "🔥 Streak Diária",
          value: `${streak} dia(s)`,
          inline: true,
        },
        {
          name: "💹 Total Ganho",
          value: `${totalEarned.toLocaleString("pt-BR")} 💰`,
          inline: true,
        },
        {
          name: "🏆 Próximo Cartão",
          value: (() => {
            const idx = cardTypes.findIndex((c) => total >= c.min);
            if (idx === 0) return "✅ Máximo atingido!";
            const next = cardTypes[idx - 1];
            const needed = next.min - total;
            return `${next.name}: faltam **${needed.toLocaleString("pt-BR")} 💰**`;
          })(),
          inline: false,
        }
      )
      .setFooter({ text: "!banco depositar | !trabalhar | !investir | !cartao" })
      .setTimestamp();

    const components = isOwn
      ? [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId("saldo_banco").setLabel("🏦 Banco").setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId("saldo_extrato").setLabel("📋 Extrato").setStyle(ButtonStyle.Secondary),
            new ButtonBuilder().setCustomId("saldo_cartao").setLabel("💳 Cartão").setStyle(ButtonStyle.Secondary)
          ),
        ]
      : [];

    await message.reply({ embeds: [embed], components });
  },
};
