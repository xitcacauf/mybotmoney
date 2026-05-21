const { Collection } = require("discord.js");

const cooldowns = new Collection();

function checkCooldown(userId, commandName, seconds) {
  if (!cooldowns.has(commandName)) {
    cooldowns.set(commandName, new Collection());
  }
  const timestamps = cooldowns.get(commandName);
  const now = Date.now();
  const cooldownAmount = seconds * 1000;

  if (timestamps.has(userId)) {
    const expirationTime = timestamps.get(userId) + cooldownAmount;
    if (now < expirationTime) {
      const timeLeft = (expirationTime - now) / 1000;
      return { onCooldown: true, timeLeft: timeLeft.toFixed(1) };
    }
  }

  timestamps.set(userId, now);
  setTimeout(() => timestamps.delete(userId), cooldownAmount);
  return { onCooldown: false };
}

module.exports = { checkCooldown };
