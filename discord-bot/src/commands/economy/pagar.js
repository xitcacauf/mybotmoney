const { successEmbed, errorEmbed } = require("../../utils/embed");
const User = require("../../models/User");

module.exports = {
  name: "pagar",
  aliases: ["pay", "transferir"],
  description: "Transfira moedas para outro usuário. Ex: !pagar @user 500",
  cooldown: 10,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target || target.bot) return message.reply({ embeds: [errorEmbed("Erro", "Mencione um usuário válido.")] });
    if (target.id === message.author.id) return message.reply({ embeds: [errorEmbed("Erro", "Você não pode pagar a si mesmo.")] });

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount < 1) return message.reply({ embeds: [errorEmbed("Erro", "Informe um valor válido.")] });

    const sender = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    if (sender.economy.wallet < amount) return message.reply({ embeds: [errorEmbed("Sem Saldo", `Você não tem ${amount} 💰 na carteira.`)] });

    await User.findOneAndUpdate({ userId: message.author.id, guildId: message.guild.id }, { $inc: { "economy.wallet": -amount } });
    await User.findOneAndUpdate({ userId: target.id, guildId: message.guild.id }, { $inc: { "economy.wallet": amount } });

    await message.reply({ embeds: [successEmbed("✅ Transferência Realizada", `Você enviou **${amount.toLocaleString("pt-BR")} 💰** para <@${target.id}>!`)] });
  },
};
