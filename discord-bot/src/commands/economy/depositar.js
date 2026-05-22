const { EmbedBuilder } = require("discord.js");
const { errorEmbed } = require("../../utils/embed");
const User = require("../../models/User");
const config = require("../../config/config");

module.exports = {
  name: "depositar",
  aliases: ["dep", "sacar"],
  description: "Deposite ou saque do banco. Ex: !depositar 500 | !sacar 500",
  cooldown: 5,
  async execute(message, args, client) {
    const isSaque = message.content.toLowerCase().startsWith(`${config.prefix}sacar`);
    const amount = parseInt(args[0]);

    if (isNaN(amount) || amount < 1) {
      return message.reply({ embeds: [errorEmbed("Erro", `Informe um valor válido.\n\`!depositar 500\` — carteira → banco\n\`!sacar 500\` — banco → carteira`)] });
    }

    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    const wallet = dbUser.economy.wallet;
    const bank = dbUser.economy.bank;

    if (!isSaque) {
      if (wallet < amount) {
        return message.reply({ embeds: [errorEmbed("Sem Saldo", `Você tem apenas **${wallet.toLocaleString("pt-BR")} 💰** na carteira.`)] });
      }
      await User.findOneAndUpdate(
        { userId: message.author.id, guildId: message.guild.id },
        { $inc: { "economy.wallet": -amount, "economy.bank": amount } }
      );
      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("🏦 Depósito Realizado!")
        .setDescription(`Você depositou **${amount.toLocaleString("pt-BR")} 💰** no banco.`)
        .addFields(
          { name: "👛 Carteira", value: `${(wallet - amount).toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "🏦 Banco", value: `${(bank + amount).toLocaleString("pt-BR")} 💰`, inline: true }
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    if (bank < amount) {
      return message.reply({ embeds: [errorEmbed("Sem Saldo no Banco", `Você tem apenas **${bank.toLocaleString("pt-BR")} 💰** no banco.`)] });
    }
    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $inc: { "economy.wallet": amount, "economy.bank": -amount } }
    );
    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle("💸 Saque Realizado!")
      .setDescription(`Você sacou **${amount.toLocaleString("pt-BR")} 💰** do banco.`)
      .addFields(
        { name: "👛 Carteira", value: `${(wallet + amount).toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "🏦 Banco", value: `${(bank - amount).toLocaleString("pt-BR")} 💰`, inline: true }
      )
      .setTimestamp();
    return message.reply({ embeds: [embed] });
  },
};
