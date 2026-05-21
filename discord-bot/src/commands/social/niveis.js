const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { xpToNextLevel } = require("../../systems/LevelSystem");

module.exports = {
  name: "nivel",
  aliases: ["xp", "level", "exp"],
  description: "Veja seu nível atual",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);

    const level = dbUser.social.level;
    const xp = dbUser.social.xp;
    const needed = xpToNextLevel(level);
    const percent = Math.floor((xp / needed) * 100);
    const bar = "█".repeat(Math.floor(percent / 10)) + "░".repeat(10 - Math.floor(percent / 10));

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle(`⭐ Nível de ${target.username}`)
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .addFields(
        { name: "⭐ Nível", value: `${level}`, inline: true },
        { name: "✨ XP", value: `${xp.toLocaleString("pt-BR")} / ${needed.toLocaleString("pt-BR")}`, inline: true },
        { name: "📊 Progresso", value: `\`[${bar}] ${percent}%\``, inline: false },
        { name: "💬 Mensagens", value: `${dbUser.social.messages.toLocaleString("pt-BR")}`, inline: true },
        { name: "🎤 Minutos em voz", value: `${dbUser.social.voiceMinutes.toLocaleString("pt-BR")}`, inline: true }
      )
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
