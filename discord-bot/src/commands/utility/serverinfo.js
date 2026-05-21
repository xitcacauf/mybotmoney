const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");

module.exports = {
  name: "serverinfo",
  aliases: ["servidor", "si"],
  description: "Informações do servidor",
  cooldown: 10,
  async execute(message, args, client) {
    const guild = message.guild;
    await guild.members.fetch();

    const bots = guild.members.cache.filter((m) => m.user.bot).size;
    const humans = guild.memberCount - bots;
    const channels = guild.channels.cache;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`📊 ${guild.name}`)
      .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
      .addFields(
        { name: "👑 Dono", value: `<@${guild.ownerId}>`, inline: true },
        { name: "📅 Criado em", value: guild.createdAt.toLocaleDateString("pt-BR"), inline: true },
        { name: "👥 Membros", value: `${humans} humanos | ${bots} bots`, inline: true },
        { name: "💬 Canais de texto", value: `${channels.filter(c => c.type === 0).size}`, inline: true },
        { name: "🔊 Canais de voz", value: `${channels.filter(c => c.type === 2).size}`, inline: true },
        { name: "🎭 Cargos", value: `${guild.roles.cache.size}`, inline: true },
        { name: "🆔 ID", value: guild.id, inline: false }
      )
      .setFooter({ text: `Pedido por ${message.author.username}` })
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
