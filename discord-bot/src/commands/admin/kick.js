const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "kick",
  aliases: ["expulsar"],
  description: "Expulsa um membro do servidor",
  cooldown: 3,
  staffOnly: true,
  async execute(message, args, client) {
    const target = message.mentions.members.first();
    if (!target) return message.reply("❌ Mencione um membro para expulsar.");
    if (!target.kickable) return message.reply("❌ Não posso expulsar este usuário.");

    const reason = args.slice(1).join(" ") || "Sem motivo informado";

    await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      { $push: { punishments: { type: "kick", reason, moderatorId: message.author.id } } }
    );

    await target.kick(reason);

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle("👢 Membro Expulso")
      .addFields(
        { name: "👤 Usuário", value: target.user.tag, inline: true },
        { name: "🛡️ Moderador", value: message.author.tag, inline: true },
        { name: "📝 Motivo", value: reason }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
