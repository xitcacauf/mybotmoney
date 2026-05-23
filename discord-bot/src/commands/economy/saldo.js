const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { getGuildHeat, getHeatBonus } = require("../../systems/SocialHeat");

const cardTiers = [
  { name: "⚫ Black Elite", min: 100000, color: 0x111111, perks: "Juros 3%/dia • Crime +15% • Loja -10%" },
  { name: "💜 Dominador",   min: 50000,  color: 0x4b0082, perks: "Juros 2.5%/dia • Crime +10% • Transfer VIP" },
  { name: "🔴 Luxúria",    min: 25000,  color: 0x8b0000, perks: "Juros 2%/dia • Presente bônus duplo" },
  { name: "🟣 Neon",       min: 10000,  color: 0x9b59b6, perks: "Juros 2%/dia • XP +10%" },
  { name: "🟢 Standard",   min: 0,      color: 0x27ae60, perks: "Juros 2%/dia • Acesso básico" },
];

function getCard(total) {
  return cardTiers.find((c) => total >= c.min) || cardTiers[cardTiers.length - 1];
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
    const bank   = dbUser.economy?.bank   || 0;
    const total  = wallet + bank;
    const totalEarned = dbUser.economy?.totalEarned || 0;
    const streak      = dbUser.economy?.streak      || 0;
    const card        = getCard(total);

    // Calcula bônus de calor corretamente
    let econMult = 1;
    try {
      const heatRec = await getGuildHeat(message.guild.id);
      econMult = getHeatBonus(heatRec.heat || 0).econMult;
    } catch {}

    const projectedInterest = Math.floor(bank * 0.02);

    const isOwn = target.id === message.author.id;

    // Próximo cartão
    const cardIdx  = cardTiers.findIndex((c) => total >= c.min);
    let nextCardLine;
    if (cardIdx <= 0) {
      nextCardLine = "✅ Tier máximo atingido!";
    } else {
      const next   = cardTiers[cardIdx - 1];
      const needed = next.min - total;
      nextCardLine = `${next.name}: faltam **${needed.toLocaleString("pt-BR")} 💰**`;
    }

    const embed = new EmbedBuilder()
      .setColor(card.color)
      .setAuthor({
        name: `${card.name} • ${target.username}`,
        iconURL: target.displayAvatarURL({ dynamic: true }),
      })
      .setDescription(`> *${card.perks}*`)
      .addFields(
        { name: "👜 Carteira",           value: `**${wallet.toLocaleString("pt-BR")}** 💰`,           inline: true },
        { name: "🏦 Banco",             value: `**${bank.toLocaleString("pt-BR")}** 💰`,             inline: true },
        { name: "💎 Patrimônio",        value: `**${total.toLocaleString("pt-BR")}** 💰`,            inline: true },
        { name: "📈 Rendimento/dia",    value: `+${projectedInterest.toLocaleString("pt-BR")} 💰`,  inline: true },
        { name: "🌡️ Bônus Servidor",    value: `${econMult}x`,                                      inline: true },
        { name: "🔥 Streak Diária",     value: `${streak} dia(s)`,                                  inline: true },
        { name: "💹 Total Acumulado",   value: `${totalEarned.toLocaleString("pt-BR")} 💰`,          inline: true },
        { name: "🏆 Próximo Cartão",    value: nextCardLine,                                         inline: false },
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
  cardTiers,
  getCard,
};
