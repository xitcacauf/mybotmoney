const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "warns",
  aliases: ["advertencias", "warnlist"],
  description: "Lista advertências de um membro",
  cooldown: 5,
  staffOnly: true,
  async execute(message, args, client) {
    const target = message.mentions.members.first() || message.member;
    const dbUser = await User.findOne({ userId: target.id, guildId: message.guild.id });

    if (!dbUser || !dbUser.warnings.length) {
      return message.reply(`✅ **${target.user.username}** não possui advertências.`);
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(`⚠️ Advertências de ${target.user.username}`)
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }));

    dbUser.warnings.slice(-10).forEach((w, i) => {
      embed.addFields({
        name: `Warn #${i + 1}`,
        value: `**Motivo:** ${w.reason}\n**Por:** <@${w.moderatorId}>\n**Em:** ${new Date(w.createdAt).toLocaleDateString("pt-BR")}`,
        inline: false,
      });
    });

    await message.reply({ embeds: [embed] });
  },
};
