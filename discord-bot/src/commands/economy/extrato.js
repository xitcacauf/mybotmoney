const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

const typeEmojis = {
  earn: "💚", spend: "🔴", transfer_in: "💙", transfer_out: "🟠",
  interest: "📈", crime: "🔫", daily: "🎁", work: "💼", gift: "🎀", steal: "🦹",
};

// Adiciona entrada no ledger do usuário (armazenado dentro do User model)
async function addLedgerEntry(userId, guildId, type, amount, description) {
  try {
    const dbUser = await User.findOrCreate(userId, guildId, "");
    const ledger = dbUser.economy?.ledger || [];
    const entry = { type, amount, description, timestamp: new Date().toISOString() };
    const newLedger = [...ledger, entry].slice(-20); // manter últimas 20
    await User.findOneAndUpdate(
      { userId, guildId },
      { $set: { "economy.ledger": newLedger } }
    );
  } catch {}
}

module.exports = {
  name: "extrato",
  aliases: ["historico", "transacoes", "statement"],
  description: "Histórico financeiro — ganhos, gastos e transferências",
  cooldown: 5,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    const ledger = dbUser.economy?.ledger || [];
    const list   = [...ledger].reverse().slice(0, 12);

    const wallet      = dbUser.economy?.wallet      || 0;
    const bank        = dbUser.economy?.bank        || 0;
    const totalEarned = dbUser.economy?.totalEarned || 0;

    let description;
    if (!list.length) {
      description =
        "Nenhuma transação registrada ainda.\n\n" +
        "Faça seu primeiro `!diario`, `!trabalhar` ou `!crime` para começar!";
    } else {
      description = list
        .map((e) => {
          const emoji  = typeEmojis[e.type] || "⚪";
          const signal = (e.amount || 0) >= 0 ? "+" : "";
          const ts     = `<t:${Math.floor(new Date(e.timestamp).getTime() / 1000)}:R>`;
          return `${emoji} **${signal}${(e.amount || 0).toLocaleString("pt-BR")} 💰** — ${e.description} ${ts}`;
        })
        .join("\n");
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`📋 Extrato Financeiro — ${message.author.username}`)
      .setDescription(description)
      .addFields(
        { name: "👜 Carteira",     value: `${wallet.toLocaleString("pt-BR")} 💰`,       inline: true },
        { name: "🏦 Banco",       value: `${bank.toLocaleString("pt-BR")} 💰`,         inline: true },
        { name: "💹 Acumulado",   value: `${totalEarned.toLocaleString("pt-BR")} 💰`,  inline: true },
      )
      .setFooter({ text: "Últimas 12 transações • !banco para gerenciar" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
  addLedgerEntry,
};
