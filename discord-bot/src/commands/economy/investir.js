const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { addHeat } = require("../../systems/SocialHeat");
const { addLedgerEntry } = require("./extrato");

const investTypes = {
  acoes: {
    name: "📊 Ações Fictícias", emoji: "📊",
    minReturn: -0.30, maxReturn: 0.60,
    risk: "Médio", minDays: 1, maxDays: 3,
    desc: "Mercado de ações virtual — pode subir muito ou cair",
  },
  crypto: {
    name: "🪙 Criptomoedas", emoji: "🪙",
    minReturn: -0.50, maxReturn: 1.50,
    risk: "Alto", minDays: 1, maxDays: 5,
    desc: "Alta volatilidade — pode triplicar ou derreter",
  },
  imovel: {
    name: "🏗️ Imóveis", emoji: "🏗️",
    minReturn: 0.05, maxReturn: 0.25,
    risk: "Baixo", minDays: 3, maxDays: 7,
    desc: "Seguro e estável — retorno garantido mas menor",
  },
  negocio: {
    name: "🏪 Negócio", emoji: "🏪",
    minReturn: -0.20, maxReturn: 0.80,
    risk: "Médio-Alto", minDays: 2, maxDays: 4,
    desc: "Abrir um negócio fictício no servidor",
  },
  cassino: {
    name: "🎰 Cassino Virtual", emoji: "🎰",
    minReturn: -0.90, maxReturn: 3.00,
    risk: "Extremo", minDays: 0, maxDays: 0,
    desc: "Resultado imediato! Pode ganhar 4x ou perder quase tudo",
  },
};

module.exports = {
  name: "investir",
  aliases: ["invest", "aplicar", "aportar"],
  description: "Invista em ações, crypto, imóveis. Ex: !investir 5000 crypto | !investir resgatar",
  cooldown: 10,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    // ── LISTAR INVESTIMENTOS ──────────────────────────────────────────────────
    if (!sub || sub === "ver" || sub === "lista") {
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle("📈 Central de Investimentos")
        .setDescription("Invista suas moedas e aguarde o retorno!\n`!investir <valor> <tipo>` ou `!investir resgatar`")
        .addFields(
          Object.entries(investTypes).map(([key, inv]) => ({
            name: `${inv.emoji} ${inv.name} — \`${key}\``,
            value:
              `Risco: **${inv.risk}** | Retorno: ${(inv.minReturn * 100).toFixed(0)}% a ${(inv.maxReturn * 100).toFixed(0)}%\n` +
              `Prazo: ${inv.minDays === inv.maxDays ? `${inv.minDays === 0 ? "Imediato" : `${inv.minDays} dia(s)`}` : `${inv.minDays}-${inv.maxDays} dias`}\n` +
              `*${inv.desc}*`,
            inline: false,
          }))
        )
        .setFooter({ text: "Atenção: investimentos têm risco! Use !investir resgatar quando o prazo terminar." })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    // ── RESGATAR ─────────────────────────────────────────────────────────────
    if (sub === "resgatar" || sub === "sacar" || sub === "retirar") {
      const inv = dbUser.economy?.activeInvestment;
      if (!inv) {
        return message.reply("❌ Você não tem nenhum investimento ativo.\nUse `!investir <valor> <tipo>` para começar.");
      }

      const readyAt = new Date(inv.readyAt);
      if (readyAt > new Date()) {
        return message.reply(
          `⏳ Seu investimento ainda não está pronto!\n` +
          `**${inv.typeName}** estará disponível <t:${Math.floor(readyAt.getTime() / 1000)}:R>.`
        );
      }

      const profit    = inv.projectedProfit;
      const total     = Math.max(0, inv.amount + profit);
      const won       = profit >= 0;

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        {
          $inc: { "economy.wallet": total, "economy.totalEarned": Math.max(0, profit) },
          $set: { "economy.activeInvestment": null },
        }
      );
      await addLedgerEntry(message.author.id, message.guild.id, won ? "earn" : "spend", profit, `Investimento: ${inv.typeName}`).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(won ? config.colors.success : config.colors.error)
        .setTitle(won ? `${investTypes[inv.type]?.emoji || "📈"} Investimento Resgatado!` : `${investTypes[inv.type]?.emoji || "📉"} Prejuízo Realizado`)
        .setDescription(
          won
            ? `✅ Seu investimento em **${inv.typeName}** deu retorno de **${(inv.returnRate * 100).toFixed(1)}%**!`
            : `💀 Seu investimento em **${inv.typeName}** teve queda de **${(Math.abs(inv.returnRate) * 100).toFixed(1)}%**.`
        )
        .addFields(
          { name: "💰 Investido",      value: `${inv.amount.toLocaleString("pt-BR")} 💰`,        inline: true },
          { name: profit >= 0 ? "💹 Lucro" : "📉 Prejuízo",
                                        value: `${profit >= 0 ? "+" : ""}${profit.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "💎 Você Recebeu",   value: `${total.toLocaleString("pt-BR")} 💰`,             inline: true },
        )
        .setFooter({ text: "!investir para novo aporte" })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // ── NOVO INVESTIMENTO ─────────────────────────────────────────────────────
    const amount  = parseInt(args[0]);
    const typeKey = args[1]?.toLowerCase();

    if (!amount || isNaN(amount) || amount < 100) {
      return message.reply("❌ Valor mínimo: **100 💰**. Ex: `!investir 5000 crypto`\nTipos: `acoes` `crypto` `imovel` `negocio` `cassino`");
    }
    if (!typeKey || !investTypes[typeKey]) {
      return message.reply(`❌ Tipo inválido. Escolha: \`${Object.keys(investTypes).join("`, `")}\`\nEx: \`!investir 5000 acoes\``);
    }

    if ((dbUser.economy?.wallet || 0) < amount) {
      return message.reply(`❌ Saldo insuficiente! Você tem **${(dbUser.economy?.wallet || 0).toLocaleString("pt-BR")} 💰** na carteira.`);
    }

    // Bloquear se já tem investimento ativo
    const existing = dbUser.economy?.activeInvestment;
    if (existing) {
      const ready = new Date(existing.readyAt);
      if (ready > new Date()) {
        return message.reply(
          `⏳ Você já tem um investimento ativo em **${existing.typeName}**!\n` +
          `Retorno em: <t:${Math.floor(ready.getTime() / 1000)}:R>\n` +
          `Use \`!investir resgatar\` quando estiver pronto.`
        );
      }
    }

    const inv = investTypes[typeKey];

    // ── CASSINO: resultado imediato ───────────────────────────────────────────
    if (typeKey === "cassino") {
      const rate   = inv.minReturn + Math.random() * (inv.maxReturn - inv.minReturn);
      const profit = Math.floor(amount * rate);
      const total  = Math.max(0, amount + profit);
      const won    = profit >= 0;

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "economy.wallet": -amount + total, "economy.totalEarned": Math.max(0, profit) } }
      );
      await addHeat(message.guild.id, 3).catch(() => {});

      const embed = new EmbedBuilder()
        .setColor(won ? config.colors.success : config.colors.error)
        .setTitle(won ? "🎰 JACKPOT!" : "🎰 Você perdeu...")
        .addFields(
          { name: "💰 Apostado",  value: `${amount.toLocaleString("pt-BR")} 💰`,                   inline: true },
          { name: "📊 Resultado", value: `${rate >= 0 ? "+" : ""}${(rate * 100).toFixed(1)}%`,     inline: true },
          { name: won ? "💹 Lucro" : "📉 Prejuízo",
                                   value: `${profit >= 0 ? "+" : ""}${profit.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "💎 Recebido",  value: `${total.toLocaleString("pt-BR")} 💰`,                   inline: true },
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // ── INVESTIMENTO COM PRAZO ────────────────────────────────────────────────
    const daysRange = inv.maxDays - inv.minDays;
    const days      = inv.minDays + Math.floor(Math.random() * (daysRange + 1));
    const readyAt   = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const returnRate    = inv.minReturn + Math.random() * (inv.maxReturn - inv.minReturn);
    const projectedProfit = Math.floor(amount * returnRate);

    const activeInvestment = {
      type: typeKey, typeName: inv.name,
      amount, returnRate, projectedProfit, readyAt,
    };

    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      {
        $inc: { "economy.wallet": -amount },
        $set: { "economy.activeInvestment": activeInvestment },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(`${inv.emoji} Investimento Realizado!`)
      .setDescription(`Você investiu em **${inv.name}**!\n*${inv.desc}*`)
      .addFields(
        { name: "💰 Investido",    value: `${amount.toLocaleString("pt-BR")} 💰`,                               inline: true },
        { name: "⏱️ Prazo",        value: `${days} dia(s)`,                                                      inline: true },
        { name: "📅 Retorno em",   value: `<t:${Math.floor(new Date(readyAt).getTime() / 1000)}:R>`,             inline: true },
        { name: "📊 Projeção*",    value: `${projectedProfit >= 0 ? "+" : ""}${projectedProfit.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "⚡ Risco",        value: inv.risk,                                                               inline: true },
      )
      .setFooter({ text: "*Projeção aproximada. Use !investir resgatar quando o prazo terminar." })
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  },
};
