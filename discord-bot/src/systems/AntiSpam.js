const { Collection } = require("discord.js");
const logger = require("../utils/logger");

const messageCache = new Collection();
const MAX_MESSAGES = 5;
const TIME_WINDOW = 5000;

module.exports = {
  async check(message, client) {
    const key = `${message.author.id}-${message.guild.id}`;
    const now = Date.now();

    if (!messageCache.has(key)) {
      messageCache.set(key, []);
    }

    const timestamps = messageCache.get(key).filter((t) => now - t < TIME_WINDOW);
    timestamps.push(now);
    messageCache.set(key, timestamps);

    if (timestamps.length >= MAX_MESSAGES) {
      try {
        await message.delete().catch(() => {});
        const warning = await message.channel.send(
          `⚠️ <@${message.author.id}>, pare com o spam! Você será punido se continuar.`
        );
        setTimeout(() => warning.delete().catch(() => {}), 5000);

        if (timestamps.length >= MAX_MESSAGES + 3) {
          const member = message.guild.members.cache.get(message.author.id);
          if (member) {
            await member
              .timeout(5 * 60 * 1000, "Anti-Spam automático")
              .catch(() => {});
            logger.info(`Anti-spam: ${message.author.tag} silenciado por spam`);
          }
        }
        return true;
      } catch (err) {
        logger.error(`Erro no AntiSpam: ${err.message}`);
      }
    }
    return false;
  },
};
