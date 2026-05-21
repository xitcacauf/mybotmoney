const User = require("../models/User");
const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");

function xpToNextLevel(level) {
  return Math.floor(100 * Math.pow(1.5, level - 1));
}

async function checkLevelUp(userId, guildId, channel) {
  const user = await User.findOne({ userId, guildId });
  if (!user) return;

  const currentLevel = user.social.level;
  const xpNeeded = xpToNextLevel(currentLevel);

  if (user.social.xp >= xpNeeded) {
    const newLevel = currentLevel + 1;
    await User.findOneAndUpdate(
      { userId, guildId },
      {
        $inc: { "social.level": 1 },
        $set: { "social.xp": 0 },
      }
    );

    if (channel) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.secondary)
        .setTitle("⭐ Level Up!")
        .setDescription(`<@${userId}> subiu para o nível **${newLevel}**! 🎉`)
        .setTimestamp();
      channel.send({ embeds: [embed] }).then((m) =>
        setTimeout(() => m.delete().catch(() => {}), 10000)
      );
    }
  }
}

module.exports = { xpToNextLevel, checkLevelUp };
