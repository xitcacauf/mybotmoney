const GuildConfig = require("../models/GuildConfig");
const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const logger = require("../utils/logger");

module.exports = {
  name: "guildMemberRemove",
  async execute(member, client) {
    try {
      const gConfig = await GuildConfig.findOrCreate(member.guild.id);
      const logChannelId = gConfig.moderation?.logChannelId;
      if (!logChannelId) return;

      const channel = member.guild.channels.cache.get(logChannelId);
      if (!channel) return;

      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle("📤 Membro Saiu")
        .setThumbnail(member.user.displayAvatarURL({ dynamic: true }))
        .addFields(
          { name: "👤 Usuário", value: `${member.user.tag}`, inline: true },
          { name: "🆔 ID", value: member.id, inline: true },
          { name: "📅 Entrou em", value: member.joinedAt ? member.joinedAt.toLocaleDateString("pt-BR") : "Desconhecido", inline: true }
        )
        .setTimestamp();

      await channel.send({ embeds: [embed] });
    } catch (err) {
      logger.error(`Erro no guildMemberRemove: ${err.message}`);
    }
  },
};
