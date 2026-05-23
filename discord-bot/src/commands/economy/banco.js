const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { BASE_URL } = require("../../web/server");

const INTEREST_RATE = 0.02; // 2% ao dia
const INTEREST_INTERVAL_HOURS = 24;

module.exports = {
  name: "banco",
  aliases: ["bank", "juros", "rendimento"],
  description: "Gerencie seu banco. Ex: !banco | !banco depositar 1000 | !banco sacar 500 | !banco juros",
  cooldown: 5,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const sub = args[0]?.toLowerCase();

    // Verificar e aplicar juros automaticamente
    const lastInterest = dbUser.economy.lastInterest ? new Date(dbUser.economy.lastInterest) : null;
    const hoursSince = lastInterest ? (Date.now() - lastInterest.getTime()) / 3600000 : INTEREST_INTERVAL_HOURS + 1;
    let interestEarned = 0;

    if (hoursSince >= INTEREST_INTERVAL_HOURS && (dbUser.economy.bank || 0) > 0) {
      interestEarned = Math.floor((dbUser.economy.bank || 0) * INTEREST_RATE);
      if (interestEarned > 0) {
        await User.findOneAndUpdate(
          { userId: message.author.id, guildId: message.guild.id },
          {
            $inc: { "economy.bank": interestEarned, "economy.totalEarned": interestEarned },
            $set: { "economy.lastInterest": new Date().toISOString() },
          }
        );
        const refreshed = await User.findOne({ userId: message.author.id, guildId: message.guild.id });
        if (refreshed) { dbUser.economy.bank = refreshed.economy.bank; dbUser.economy.wallet = refreshed.economy.wallet; }
      }
    }

    if (!sub || sub === "ver" || sub === "extrato") {
      const nextInterest = lastInterest
        ? Math.max(0, INTEREST_INTERVAL_HOURS - hoursSince)
        : 0;
      const projectedInterest = Math.floor((dbUser.economy.bank || 0) * INTEREST_RATE);

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("🏦 Seu Banco")
        .setDescription(interestEarned > 0 ? `✅ Juros aplicados: **+${interestEarned.toLocaleString("pt-BR")} 💰**\n` : "")
        .addFields(
          { name: "💳 Carteira", value: `${(dbUser.economy.wallet || 0).toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "🏦 Banco", value: `${(dbUser.economy.bank || 0).toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "💎 Total", value: `${((dbUser.economy.wallet || 0) + (dbUser.economy.bank || 0)).toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "📈 Taxa de Juros", value: `${(INTEREST_RATE * 100).toFixed(0)}% ao dia`, inline: true },
          { name: "🕐 Próximo Rendimento", value: nextInterest > 0 ? `em ${Math.ceil(nextInterest)}h` : "Disponível agora!", inline: true },
          { name: "💹 Rendimento Previsto", value: `+${projectedInterest.toLocaleString("pt-BR")} 💰`, inline: true },
        )
        .setFooter({ text: "Use !banco depositar | !banco sacar" })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setLabel("🌐 Abrir Bank UI")
          .setStyle(ButtonStyle.Link)
          .setURL(`${BASE_URL}/bank/${message.author.id}`)
      );
      return message.reply({ embeds: [embed], components: [row] });
    }

    if (sub === "depositar" || sub === "dep") {
      const amount = args[1] === "tudo" ? dbUser.economy.wallet : parseInt(args[1]);
      if (!amount || amount <= 0 || isNaN(amount)) return message.reply("❌ Valor inválido. Ex: `!banco depositar 1000` ou `!banco depositar tudo`");
      if ((dbUser.economy.wallet || 0) < amount) return message.reply(`❌ Você só tem **${(dbUser.economy.wallet || 0).toLocaleString("pt-BR")} 💰** na carteira.`);

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "economy.wallet": -amount, "economy.bank": amount } }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("🏦 Depósito Realizado")
        .setDescription(`Você depositou **${amount.toLocaleString("pt-BR")} 💰** no banco!\nSeu dinheiro agora rende **${(INTEREST_RATE * 100).toFixed(0)}% ao dia**.`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (sub === "sacar" || sub === "saque") {
      const amount = args[1] === "tudo" ? dbUser.economy.bank : parseInt(args[1]);
      if (!amount || amount <= 0 || isNaN(amount)) return message.reply("❌ Valor inválido. Ex: `!banco sacar 500` ou `!banco sacar tudo`");
      if ((dbUser.economy.bank || 0) < amount) return message.reply(`❌ Você tem apenas **${(dbUser.economy.bank || 0).toLocaleString("pt-BR")} 💰** no banco.`);

      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "economy.bank": -amount, "economy.wallet": amount } }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle("💳 Saque Realizado")
        .setDescription(`Você sacou **${amount.toLocaleString("pt-BR")} 💰** do banco.`)
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (sub === "juros") {
      if (hoursSince < INTEREST_INTERVAL_HOURS) {
        const hoursLeft = Math.ceil(INTEREST_INTERVAL_HOURS - hoursSince);
        return message.reply(`⏳ Seus juros serão aplicados em **${hoursLeft} hora(s)**.\nRendimento previsto: **+${Math.floor((dbUser.economy.bank || 0) * INTEREST_RATE).toLocaleString("pt-BR")} 💰**`);
      }
      return message.reply("✅ Seus juros já foram aplicados! Execute `!banco` para ver o extrato.");
    }

    return message.reply("❌ Sub-comando inválido. Use: `ver`, `depositar <valor>`, `sacar <valor>`, `juros`");
  },
};
