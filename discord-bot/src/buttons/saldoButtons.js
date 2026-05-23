const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const JsonDB = require("../utils/JsonDB");

const ledgerDB = new JsonDB("ledger");

const typeEmojis = {
  earn: "💚", spend: "🔴", transfer_in: "💙", transfer_out: "🟠",
  interest: "📈", crime: "🔫", daily: "🎁", work: "💼", gift: "🎀", steal: "🦹",
};

const INTEREST_RATE = 0.02;

module.exports = {
  customId: ["saldo_banco", "saldo_extrato", "saldo_cartao"],
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const id = interaction.customId;
    const dbUser = await User.findOrCreate(interaction.user.id, interaction.guild.id, interaction.user.username);

    if (id === "saldo_banco") {
      const wallet = dbUser.economy?.wallet || 0;
      const bank = dbUser.economy?.bank || 0;
      const projectedInterest = Math.floor(bank * INTEREST_RATE);
      const lastInterest = dbUser.economy?.lastInterest;
      const hoursSince = lastInterest ? (Date.now() - new Date(lastInterest).getTime()) / 3600000 : 25;
      const nextInterest = hoursSince >= 24 ? "Disponível agora!" : `em ${Math.ceil(24 - hoursSince)}h`;

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("🏦 Painel Bancário")
        .addFields(
          { name: "👜 Carteira", value: `${wallet.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "🏦 Saldo no Banco", value: `${bank.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "💎 Total", value: `${(wallet + bank).toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "📈 Taxa de Juros", value: `${(INTEREST_RATE * 100).toFixed(0)}%/dia`, inline: true },
          { name: "💹 Rendimento Previsto", value: `+${projectedInterest.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "🕐 Próximo Rendimento", value: nextInterest, inline: true },
        )
        .setFooter({ text: "!banco depositar <valor> | !banco sacar <valor>" })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (id === "saldo_extrato") {
      const entries = await ledgerDB.find({ userId: interaction.user.id, guildId: interaction.guild.id });
      const list = (entries._results || []).slice(-10).reverse();

      const description = list.length
        ? list.map((e) => {
            const emoji = typeEmojis[e.type] || "⚪";
            const signal = (e.amount || 0) >= 0 ? "+" : "";
            return `${emoji} **${signal}${(e.amount || 0).toLocaleString("pt-BR")} 💰** — ${e.description} <t:${Math.floor(new Date(e.timestamp).getTime() / 1000)}:R>`;
          }).join("\n")
        : "Nenhuma transação registrada ainda. Use `!trabalhar`, `!diario` ou `!crime`!";

      const embed = new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle("📋 Extrato Rápido")
        .setDescription(description)
        .setFooter({ text: "Últimas 10 transações • !extrato para ver histórico completo" })
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (id === "saldo_cartao") {
      const total = (dbUser.economy?.wallet || 0) + (dbUser.economy?.bank || 0);
      const cardTiers = [
        { name: "⚫ Black Elite", min: 100000, color: 0x000000, perks: "Juros 3% • Crime +15% • Loja -10%" },
        { name: "💜 Dominador", min: 50000, color: 0x4b0082, perks: "Juros 2.5% • Crime +10% • Transfer VIP" },
        { name: "🔴 Luxúria", min: 25000, color: 0x8b0000, perks: "Juros 2% • Presente dobrado" },
        { name: "🟣 Neon", min: 10000, color: 0x9b59b6, perks: "Juros 2% • XP +10%" },
        { name: "🟢 Standard", min: 0, color: 0x27ae60, perks: "Juros 2% • Acesso básico" },
      ];
      const card = cardTiers.find((c) => total >= c.min) || cardTiers[cardTiers.length - 1];
      const nextCard = cardTiers[cardTiers.indexOf(card) - 1];

      const embed = new EmbedBuilder()
        .setColor(card.color)
        .setTitle(`💳 Seu Cartão: ${card.name}`)
        .setDescription(
          `\`\`\`\n╔══════════════════════════╗\n║  ${card.name.padEnd(26)}║\n║                          ║\n║  **** **** **** ████     ║\n║  ${interaction.user.username.slice(0, 26).padEnd(26)}║\n╚══════════════════════════╝\n\`\`\``
        )
        .addFields(
          { name: "🎁 Benefícios", value: card.perks, inline: false },
          { name: "💎 Patrimônio", value: `${total.toLocaleString("pt-BR")} 💰`, inline: true },
          nextCard
            ? { name: `⬆️ Próximo: ${nextCard.name}`, value: `Faltam ${(nextCard.min - total).toLocaleString("pt-BR")} 💰`, inline: true }
            : { name: "✅ Tier Máximo", value: "Você chegou ao topo!", inline: true }
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
