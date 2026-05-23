const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const JsonDB = require("../../utils/JsonDB");

const ledgerDB = new JsonDB("ledger");

async function addEntry(userId, guildId, type, amount, description) {
  await ledgerDB.create({
    userId,
    guildId,
    type,
    amount,
    description,
    timestamp: new Date().toISOString(),
  }).catch(() => {});
}

const typeEmojis = {
  earn: "💚 +",
  spend: "🔴 -",
  transfer_in: "💙 +",
  transfer_out: "🟠 -",
  interest: "📈 +",
  crime: "🔫",
  daily: "🎁 +",
  work: "💼 +",
  gift: "🎀",
  steal: "🦹",
};

module.exports = {
  name: "extrato",
  aliases: ["historico", "transacoes", "statement"],
  description: "Histórico financeiro — ganhos, gastos e transferências",
  cooldown: 5,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    const entries = await ledgerDB.find({ userId: message.author.id, guildId: message.guild.id });
    const list = (entries._results || []).slice(-12).reverse();

    const wallet = dbUser.economy?.wallet || 0;
    const bank = dbUser.economy?.bank || 0;
    const totalEarned = dbUser.economy?.totalEarned || 0;

    let description;
    if (!list.length) {
      description =
        "Nenhuma transação registrada ainda.\n\n" +
        "Faça seu primeiro `!diario`, `!trabalhar` ou `!crime` para começar!";
    } else {
      description = list
        .map((e) => {
          const emoji = typeEmojis[e.type] || "⚪";
          const signal = e.amount >= 0 ? "+" : "";
          const ts = `<t:${Math.floor(new Date(e.timestamp).getTime() / 1000)}:R>`;
          return `${emoji}**${signal}${(e.amount || 0).toLocaleString("pt-BR")} 💰** — ${e.description} ${ts}`;
        })
        .join("\n");
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`📋 Extrato Financeiro — ${message.author.username}`)
      .setDescription(description)
      .addFields(
        { name: "👜 Carteira", value: `${wallet.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "🏦 Banco", value: `${bank.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "💹 Total Acumulado", value: `${totalEarned.toLocaleString("pt-BR")} 💰`, inline: true },
      )
      .setFooter({ text: "Últimas 12 transações • !banco para gerenciar" })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
  addEntry,
};
