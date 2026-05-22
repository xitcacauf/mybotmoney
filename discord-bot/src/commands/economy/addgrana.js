const { EmbedBuilder } = require("discord.js");
const { errorEmbed } = require("../../utils/embed");
const User = require("../../models/User");
const config = require("../../config/config");

module.exports = {
  name: "addgrana",
  aliases: ["addmoney", "addsaldo"],
  description: "[ADMIN] Adiciona dinheiro a um usuário. Ex: !addgrana @user 1000",
  cooldown: 3,
  adminOnly: true,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target || target.bot) {
      return message.reply({ embeds: [errorEmbed("Erro", "Mencione um usuário válido. Ex: `!addgrana @user 1000`")] });
    }

    const amount = parseInt(args[1]);
    if (isNaN(amount) || amount === 0) {
      return message.reply({ embeds: [errorEmbed("Erro", "Informe um valor. Pode ser negativo para remover. Ex: `!addgrana @user 500`")] });
    }

    await User.findOrCreate(target.id, message.guild.id, target.username);
    const updated = await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      { $inc: { "economy.wallet": amount } }
    );

    const novoSaldo = (updated?.economy?.wallet || 0) + amount;
    const acao = amount > 0 ? "adicionou" : "removeu";
    const abs = Math.abs(amount).toLocaleString("pt-BR");
    const cor = amount > 0 ? config.colors.success : config.colors.error;

    const embed = new EmbedBuilder()
      .setColor(cor)
      .setTitle(`💸 Grana ${amount > 0 ? "Adicionada" : "Removida"}`)
      .setDescription(`<@${message.author.id}> ${acao} **${abs} 💰** ${amount > 0 ? "para" : "de"} <@${target.id}>.`)
      .addFields(
        { name: "👛 Novo saldo (carteira)", value: `${novoSaldo.toLocaleString("pt-BR")} 💰`, inline: true },
        { name: "✏️ Alteração", value: `${amount > 0 ? "+" : ""}${amount.toLocaleString("pt-BR")} 💰`, inline: true }
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
