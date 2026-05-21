const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "userinfo",
  aliases: ["ui", "usuario"],
  description: "Informações de um usuário",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.member;
    const dbUser = await User.findOne({ userId: target.id, guildId: message.guild.id });

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`👤 ${target.user.username}`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "🏷️ Tag", value: target.user.tag, inline: true },
        { name: "🆔 ID", value: target.id, inline: true },
        { name: "📅 Conta criada", value: target.user.createdAt.toLocaleDateString("pt-BR"), inline: true },
        { name: "📥 Entrou no servidor", value: target.joinedAt?.toLocaleDateString("pt-BR") || "N/A", inline: true },
        { name: "⭐ Nível", value: `${dbUser?.social?.level || 1}`, inline: true },
        { name: "💬 Mensagens", value: `${dbUser?.social?.messages || 0}`, inline: true },
        { name: "💰 Carteira", value: `${dbUser?.economy?.wallet || 1000} moedas`, inline: true },
        { name: "❤️ Status", value: dbUser?.relationship?.status === "married" ? `💍 Casado(a) com <@${dbUser.relationship.partnerId}>` : "Solteiro(a)", inline: true }
      )
      .setFooter({ text: `Pedido por ${message.author.username}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
