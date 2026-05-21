const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "warn",
  aliases: ["avisar", "advertir"],
  description: "Adverte um membro",
  cooldown: 3,
  staffOnly: true,
  async execute(message, args, client) {
    const target = message.mentions.members.first();
    if (!target) return message.reply("❌ Mencione um membro para advertir.");

    const reason = args.slice(1).join(" ") || "Sem motivo informado";

    const dbUser = await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      { $push: { warnings: { reason, moderatorId: message.author.id } } },
      { new: true }
    );

    const warnCount = dbUser?.warnings?.length || 1;

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle("⚠️ Advertência Aplicada")
      .addFields(
        { name: "👤 Usuário", value: target.user.tag, inline: true },
        { name: "⚠️ Total de warns", value: `${warnCount}`, inline: true },
        { name: "📝 Motivo", value: reason }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle(`⚠️ Você recebeu uma advertência em ${message.guild.name}`)
      .addFields(
        { name: "Motivo", value: reason },
        { name: "Total de warns", value: `${warnCount}` }
      );
    await target.send({ embeds: [dmEmbed] }).catch(() => {});
  },
};
