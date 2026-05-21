const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const ms = require("ms");
const User = require("../../models/User");

module.exports = {
  name: "mute",
  aliases: ["silenciar", "timeout"],
  description: "Silencia um membro. Ex: !mute @user 10m motivo",
  cooldown: 3,
  staffOnly: true,
  async execute(message, args, client) {
    const target = message.mentions.members.first();
    if (!target) return message.reply("❌ Mencione um membro para silenciar.");

    const duration = ms(args[1]);
    if (!duration) return message.reply("❌ Informe a duração. Ex: `10m`, `1h`, `1d`");

    const reason = args.slice(2).join(" ") || "Sem motivo informado";

    await target.timeout(duration, reason);

    await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      {
        $push: {
          punishments: {
            type: "mute",
            reason,
            moderatorId: message.author.id,
            duration,
            expiresAt: new Date(Date.now() + duration),
          },
        },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle("🔇 Membro Silenciado")
      .addFields(
        { name: "👤 Usuário", value: target.user.tag, inline: true },
        { name: "⏱️ Duração", value: args[1], inline: true },
        { name: "📝 Motivo", value: reason }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
