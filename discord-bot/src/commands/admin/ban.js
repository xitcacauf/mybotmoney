const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const GuildConfig = require("../../models/GuildConfig");

module.exports = {
  name: "ban",
  aliases: ["banir"],
  description: "Bane um membro do servidor",
  cooldown: 3,
  staffOnly: true,
  async execute(message, args, client) {
    const target = message.mentions.members.first();
    if (!target)
      return message.reply("❌ Mencione um membro para banir. Ex: `!ban @user motivo`");

    if (target.id === message.author.id)
      return message.reply("❌ Você não pode se banir.");

    if (!target.bannable)
      return message.reply("❌ Não tenho permissão para banir este usuário.");

    const reason = args.slice(1).join(" ") || "Sem motivo informado";

    await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      {
        $push: {
          punishments: {
            type: "ban",
            reason,
            moderatorId: message.author.id,
          },
        },
      }
    );

    const dmEmbed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle(`🔨 Você foi banido de ${message.guild.name}`)
      .addFields(
        { name: "Motivo", value: reason },
        { name: "Moderador", value: message.author.tag }
      )
      .setTimestamp();

    await target.send({ embeds: [dmEmbed] }).catch(() => {});
    await target.ban({ reason });

    const embed = new EmbedBuilder()
      .setColor(config.colors.error)
      .setTitle("🔨 Membro Banido")
      .setThumbnail(target.user.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "👤 Usuário", value: target.user.tag, inline: true },
        { name: "🛡️ Moderador", value: message.author.tag, inline: true },
        { name: "📝 Motivo", value: reason }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });

    const gConfig = await GuildConfig.findOrCreate(message.guild.id);
    const logCh = message.guild.channels.cache.get(gConfig.moderation?.modLogChannelId);
    if (logCh) await logCh.send({ embeds: [embed] });
  },
};
