const GuildConfig = require("../models/GuildConfig");
const User = require("../models/User");
const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const logger = require("../utils/logger");

module.exports = {
  name: "guildMemberAdd",
  async execute(member, client) {
    try {
      await User.findOrCreate(member.id, member.guild.id, member.user.username);

      const gConfig = await GuildConfig.findOrCreate(member.guild.id);

      if (gConfig.roles?.memberRoleId) {
        const role = member.guild.roles.cache.get(gConfig.roles.memberRoleId);
        if (role) await member.roles.add(role).catch(() => {});
      }

      if (!gConfig.welcome?.enabled || !gConfig.welcome?.channelId) return;

      const channel = member.guild.channels.cache.get(gConfig.welcome.channelId);
      if (!channel) return;

      const msg = (gConfig.welcome.message || "Bem-vindo(a) {user}!")
        .replace("{user}", `<@${member.id}>`)
        .replace("{username}", member.user.username)
        .replace("{server}", member.guild.name)
        .replace("{count}", member.guild.memberCount.toString());

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`🌸 Bem-vindo(a) ao ${member.guild.name}!`)
        .setDescription(msg)
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true, size: 256 }))
        .addFields(
          { name: "👤 Membro", value: `${member.user.tag}`, inline: true },
          { name: "📊 Membro Nº", value: `#${member.guild.memberCount}`, inline: true }
        )
        .setFooter({ text: `ID: ${member.id}` })
        .setTimestamp();

      await channel.send({ content: `<@${member.id}>`, embeds: [embed] });
    } catch (err) {
      logger.error(`Erro no guildMemberAdd: ${err.message}`);
    }
  },
};
