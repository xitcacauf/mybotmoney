const { EmbedBuilder } = require("discord.js");
const { errorEmbed } = require("../../utils/embed");
const User = require("../../models/User");
const config = require("../../config/config");
const { withLock } = require("../../utils/userLock");

module.exports = {
  name: "pagar",
  aliases: ["pay"],
  description: "Transfira moedas para outro usuário. Ex: !pagar @user 500",
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target || target.bot) return message.reply({ embeds: [errorEmbed("Erro", "Mencione um usuário válido.")] });
    if (target.id === message.author.id) return message.reply({ embeds: [errorEmbed("Erro", "Você não pode pagar a si mesmo.")] });

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 1) return message.reply({ embeds: [errorEmbed("Erro", "Informe um valor válido. Ex: `!pagar @user 500`")] });

    const key = `pagar:${message.author.id}:${message.guild.id}`;
    await withLock(key, async () => {
      const sender = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      if (sender.economy.wallet < amount) {
        return message.reply({ embeds: [errorEmbed("Sem Saldo", `Você tem **${sender.economy.wallet.toLocaleString("pt-BR")} 💰** na carteira, mas tentou pagar **${amount.toLocaleString("pt-BR")} 💰**.`)] });
      }

      await User.findOrCreate(target.id, message.guild.id, target.username);
      await User.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $inc: { "economy.wallet": -amount } });
      await User.findOneAndUpdate({ userId: target.id, guildId: message.guild.id }, { $inc: { "economy.wallet": amount } });

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("✅ Transferência Realizada!")
        .setDescription(`<@${message.author.id}> enviou **${amount.toLocaleString("pt-BR")} 💰** para <@${target.id}>!`)
        .addFields(
          { name: "💰 Seu novo saldo", value: `${(sender.economy.wallet - amount).toLocaleString("pt-BR")} 💰`, inline: true }
        )
        .setTimestamp();

      await message.reply({ embeds: [embed] });
    });
  },
};
