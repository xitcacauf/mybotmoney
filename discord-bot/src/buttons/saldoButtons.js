const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const { getGuildHeat, getHeatBonus } = require("../systems/SocialHeat");

const INTEREST_RATE = 0.02;

const cardTiers = [
  { name: "⚫ Black Elite", min: 100000, color: 0x111111, perks: "Juros 3%/dia • Crime +15% • Loja -10%" },
  { name: "💜 Dominador",   min: 50000,  color: 0x4b0082, perks: "Juros 2.5%/dia • Crime +10% • Transfer VIP" },
  { name: "🔴 Luxúria",    min: 25000,  color: 0x8b0000, perks: "Juros 2%/dia • Presente bônus duplo" },
  { name: "🟣 Neon",       min: 10000,  color: 0x9b59b6, perks: "Juros 2%/dia • XP +10%" },
  { name: "🟢 Standard",   min: 0,      color: 0x27ae60, perks: "Juros 2%/dia • Acesso básico" },
];

const typeEmojis = {
  earn: "💚", spend: "🔴", transfer_in: "💙", transfer_out: "🟠",
  interest: "📈", crime: "🔫", daily: "🎁", work: "💼", gift: "🎀", steal: "🦹",
};

module.exports = {
  customId: ["saldo_banco", "saldo_extrato", "saldo_cartao"],
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const id     = interaction.customId;
    const dbUser = await User.findOrCreate(interaction.user.id, interaction.guild.id, interaction.user.username);

    // ── BANCO ─────────────────────────────────────────────────────────────────
    if (id === "saldo_banco") {
      const wallet  = dbUser.economy?.wallet || 0;
      const bank    = dbUser.economy?.bank   || 0;
      const projected = Math.floor(bank * INTEREST_RATE);

      const lastInterest = dbUser.economy?.lastInterest;
      const hoursSince   = lastInterest
        ? (Date.now() - new Date(lastInterest).getTime()) / 3600000
        : 25;
      const nextInterest = hoursSince >= 24 ? "✅ Disponível agora!" : `em ${Math.ceil(24 - hoursSince)}h`;

      let econMult = 1;
      try {
        const rec = await getGuildHeat(interaction.guild.id);
        econMult = getHeatBonus(rec.heat || 0).econMult;
      } catch {}

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("🏦 Painel Bancário")
        .addFields(
          { name: "👜 Carteira",         value: `${wallet.toLocaleString("pt-BR")} 💰`,    inline: true },
          { name: "🏦 Banco",            value: `${bank.toLocaleString("pt-BR")} 💰`,      inline: true },
          { name: "💎 Total",            value: `${(wallet + bank).toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "📈 Juros/dia",        value: `${(INTEREST_RATE * 100).toFixed(0)}%`,    inline: true },
          { name: "💹 Rendimento Prev.", value: `+${projected.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "🕐 Próx. Rendimento", value: nextInterest,                              inline: true },
          { name: "🌡️ Bônus Servidor",   value: `${econMult}x`,                            inline: true },
        )
        .setFooter({ text: "!banco depositar <valor> | !banco sacar <valor>" })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    // ── EXTRATO ───────────────────────────────────────────────────────────────
    if (id === "saldo_extrato") {
      const ledger = dbUser.economy?.ledger || [];
      const list   = [...ledger].reverse().slice(0, 10);

      const description = list.length
        ? list.map((e) => {
            const emoji  = typeEmojis[e.type] || "⚪";
            const signal = (e.amount || 0) >= 0 ? "+" : "";
            const ts     = `<t:${Math.floor(new Date(e.timestamp).getTime() / 1000)}:R>`;
            return `${emoji} **${signal}${(e.amount || 0).toLocaleString("pt-BR")} 💰** — ${e.description} ${ts}`;
          }).join("\n")
        : "Nenhuma transação ainda. Use `!trabalhar`, `!diario` ou `!crime`!";

      const embed = new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle("📋 Extrato Rápido")
        .setDescription(description)
        .setFooter({ text: "Últimas 10 transações • !extrato para histórico completo" })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    // ── CARTÃO ────────────────────────────────────────────────────────────────
    if (id === "saldo_cartao") {
      const total = (dbUser.economy?.wallet || 0) + (dbUser.economy?.bank || 0);
      const card  = cardTiers.find((c) => total >= c.min) || cardTiers[cardTiers.length - 1];
      const idx   = cardTiers.indexOf(card);
      const next  = idx > 0 ? cardTiers[idx - 1] : null;

      const cardVisual =
        "```\n" +
        "╔══════════════════════════╗\n" +
        `║  ${card.name.padEnd(26)}║\n` +
        "║                          ║\n" +
        "║  **** **** **** ████     ║\n" +
        `║  ${interaction.user.username.slice(0, 26).padEnd(26)}║\n` +
        "╚══════════════════════════╝\n" +
        "```";

      const embed = new EmbedBuilder()
        .setColor(card.color)
        .setTitle(`💳 Seu Cartão: ${card.name}`)
        .setDescription(cardVisual)
        .addFields(
          { name: "🎁 Benefícios",  value: card.perks,                                                       inline: false },
          { name: "💎 Patrimônio",  value: `${total.toLocaleString("pt-BR")} 💰`,                           inline: true },
          next
            ? { name: `⬆️ Próximo: ${next.name}`, value: `Faltam ${(next.min - total).toLocaleString("pt-BR")} 💰`, inline: true }
            : { name: "✅ Tier Máximo", value: "Você chegou ao topo! 🏆",                                    inline: true },
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
