const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const JsonDB = require("../../utils/JsonDB");
const { addHeat } = require("../../systems/SocialHeat");

const investDB = new JsonDB("investments");

const investTypes = {
  acoes: {
    name: "📊 Ações Fictícias",
    minReturn: -0.30,
    maxReturn: 0.60,
    risk: "Médio",
    minDays: 1,
    maxDays: 3,
    desc: "Mercado de ações virtual — pode subir muito ou cair",
    emoji: "📊",
  },
  crypto: {
    name: "🪙 Criptomoedas",
    minReturn: -0.50,
    maxReturn: 1.50,
    risk: "Alto",
    minDays: 1,
    maxDays: 5,
    desc: "Alta volatilidade — pode triplicar ou derreter",
    emoji: "🪙",
  },
  imovel: {
    name: "🏗️ Imóveis",
    minReturn: 0.05,
    maxReturn: 0.25,
    risk: "Baixo",
    minDays: 3,
    maxDays: 7,
    desc: "Seguro e estável — retorno garantido mas menor",
    emoji: "🏗️",
  },
  negocio: {
    name: "🏪 Negócio",
    minReturn: -0.20,
    maxReturn: 0.80,
    risk: "Médio-Alto",
    minDays: 2,
    maxDays: 4,
    desc: "Abrir um negócio fictício no servidor",
    emoji: "🏪",
  },
  cassino: {
    name: "🎰 Cassino Virtual",
    minReturn: -0.90,
    maxReturn: 3.00,
    risk: "Extremo",
    minDays: 0,
    maxDays: 0,
    desc: "Resultado imediato! Pode ganhar 4x ou perder quase tudo",
    emoji: "🎰",
  },
};

module.exports = {
  name: "investir",
  aliases: ["invest", "aplicar", "aportar"],
  description: "Invista seu dinheiro em ativos fictícios. Ex: !investir 5000 crypto",
  cooldown: 10,
  async execute(message, args, client) {
    const sub = args[0]?.toLowerCase();

    // !investir resgatar — resgatar investimento pronto
    if (sub === "resgatar" || sub === "sacar" || sub === "retirar") {
      const active = await investDB.findOne({ userId: message.author.id, guildId: message.guild.id, resolved: false });
      if (!active) return message.reply("❌ Você não tem nenhum investimento ativo no momento.");

      const readyAt = new Date(active.readyAt);
      if (readyAt > new Date()) {
        return message.reply(
          `⏳ Seu investimento ainda não está pronto!\n` +
          `**${active.typeName}** estará disponível <t:${Math.floor(readyAt.getTime() / 1000)}:R>.`
        );
      }

      const profit = active.projectedProfit;
      const total = active.amount + profit;

      await investDB.findOneAndUpdate(
        { _id: active._id },
        { $set: { resolved: true } }
      ).catch(() => {});

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "economy.wallet": Math.max(0, total), "economy.totalEarned": Math.max(0, profit) } }
      );

      const won = profit >= 0;
      const embed = new EmbedBuilder()
        .setColor(won ? config.colors.success : config.colors.error)
        .setTitle(won ? `${investTypes[active.type]?.emoji || "📈"} Investimento Resgatado!` : `${investTypes[active.type]?.emoji || "📉"} Prejuízo Realizado`)
        .addFields(
          { name: "💰 Investido", value: `${active.amount.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: profit >= 0 ? "💹 Lucro" : "📉 Prejuízo", value: `${profit >= 0 ? "+" : ""}${profit.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "💎 Total Recebido", value: `${Math.max(0, total).toLocaleString("pt-BR")} 💰`, inline: true },
        )
        .setDescription(
          won
            ? `✅ Seu investimento em **${active.typeName}** deu retorno de **${(active.returnRate * 100).toFixed(1)}%**!`
            : `💀 Seu investimento em **${active.typeName}** teve queda de **${(Math.abs(active.returnRate) * 100).toFixed(1)}%**.`
        )
        .setFooter({ text: "!investir para novo aporte" })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (!sub || sub === "ver" || sub === "lista") {
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle("📈 Central de Investimentos")
        .setDescription("Invista suas moedas e aguarde o retorno!\n`!investir <valor> <tipo>`")
        .addFields(
          Object.entries(investTypes).map(([key, inv]) => ({
            name: `${inv.emoji} ${inv.name} — \`${key}\``,
            value: `Risco: **${inv.risk}** | Retorno: ${(inv.minReturn * 100).toFixed(0)}% a ${(inv.maxReturn * 100).toFixed(0)}% | Prazo: ${inv.minDays === inv.maxDays ? `${inv.minDays} dias` : `${inv.minDays}-${inv.maxDays} dias`}\n*${inv.desc}*`,
            inline: false,
          }))
        )
        .setFooter({ text: "Atenção: investimentos têm risco! Não invista mais do que pode perder." })
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const amount = parseInt(args[0]);
    const typeKey = args[1]?.toLowerCase();

    if (!amount || isNaN(amount) || amount < 100) {
      return message.reply("❌ Valor mínimo de investimento: **100 💰**.\nEx: `!investir 5000 crypto`");
    }

    if (!typeKey || !investTypes[typeKey]) {
      const types = Object.keys(investTypes).join("`, `");
      return message.reply(`❌ Tipo inválido. Tipos: \`${types}\`\nEx: \`!investir 5000 acoes\``);
    }

    const inv = investTypes[typeKey];
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    if ((dbUser.economy?.wallet || 0) < amount) {
      return message.reply(`❌ Você tem apenas **${(dbUser.economy?.wallet || 0).toLocaleString("pt-BR")} 💰** na carteira.`);
    }

    // Verificar investimento ativo
    const active = await investDB.findOne({ userId: message.author.id, guildId: message.guild.id, resolved: false });
    if (active) {
      const readyAt = new Date(active.readyAt);
      if (readyAt > new Date()) {
        return message.reply(
          `⏳ Você já tem um investimento ativo em **${active.type}**!\n` +
          `Retorno previsto: <t:${Math.floor(readyAt.getTime() / 1000)}:R>\n` +
          `Use \`!investir resgatar\` quando estiver pronto.`
        );
      }
    }

    // Cassino: resultado imediato
    if (typeKey === "cassino") {
      const returnRate = inv.minReturn + Math.random() * (inv.maxReturn - inv.minReturn);
      const profit = Math.floor(amount * returnRate);
      const newAmount = amount + profit;
      const net = profit;

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "economy.wallet": -amount + newAmount, "economy.totalEarned": Math.max(0, net) } }
      );

      await addHeat(message.guild.id, 3).catch(() => {});

      const won = net >= 0;
      const embed = new EmbedBuilder()
        .setColor(won ? config.colors.success : config.colors.error)
        .setTitle(won ? "🎰 JACKPOT!" : "🎰 Você perdeu...")
        .setDescription(
          `**Investido:** ${amount.toLocaleString("pt-BR")} 💰\n` +
          `**Retorno:** ${(returnRate * 100).toFixed(1)}%\n` +
          `**Resultado:** ${net >= 0 ? "+" : ""}${net.toLocaleString("pt-BR")} 💰\n\n` +
          (won
            ? `🤑 Você recebeu de volta **${newAmount.toLocaleString("pt-BR")} 💰**!`
            : `💀 Você recebeu de volta apenas **${Math.max(0, newAmount).toLocaleString("pt-BR")} 💰**.`)
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    // Investimento com prazo
    const daysRange = inv.maxDays - inv.minDays;
    const days = inv.minDays + Math.floor(Math.random() * (daysRange + 1));
    const readyAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
    const returnRate = inv.minReturn + Math.random() * (inv.maxReturn - inv.minReturn);
    const projectedProfit = Math.floor(amount * returnRate);

    await investDB.create({
      userId: message.author.id,
      guildId: message.guild.id,
      type: typeKey,
      typeName: inv.name,
      amount,
      returnRate,
      projectedProfit,
      readyAt,
      resolved: false,
    });

    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $inc: { "economy.wallet": -amount } }
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.info)
      .setTitle(`${inv.emoji} Investimento Realizado!`)
      .setDescription(`Você investiu em **${inv.name}**!\n\n*${inv.desc}*`)
      .addFields(
        { name: "💰 Investido", value: `${amount.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "⏱️ Prazo", value: `${days} dia(s)`, inline: true },
        { name: "📅 Retorno em", value: `<t:${Math.floor(new Date(readyAt).getTime() / 1000)}:R>`, inline: true },
        { name: "📊 Projeção*", value: `${projectedProfit >= 0 ? "+" : ""}${projectedProfit.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "⚡ Risco", value: inv.risk, inline: true },
      )
      .setFooter({ text: "*Projeção aproximada. Use !investir resgatar quando estiver pronto." })
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  },
};
