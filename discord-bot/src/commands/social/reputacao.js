const { successEmbed, errorEmbed, warningEmbed } = require("../../utils/embed");
const User = require("../../models/User");

const repCooldown = new Map();

module.exports = {
  name: "reputacao",
  aliases: ["rep", "reputar"],
  description: "Dê +1 de reputação a alguém. Ex: !reputacao @user",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Erro", "Mencione quem vai receber reputação.")] });
    if (target.id === message.author.id) return message.reply({ embeds: [errorEmbed("Erro", "Você não pode se dar reputação.")] });
    if (target.bot) return message.reply({ embeds: [errorEmbed("Erro", "Bots não recebem reputação.")] });

    const key = `${message.author.id}-${target.id}`;
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;
    if (repCooldown.has(key) && now - repCooldown.get(key) < cooldownMs) {
      const remaining = Math.floor((cooldownMs - (now - repCooldown.get(key))) / 3600000);
      return message.reply({ embeds: [warningEmbed("Cooldown", `Você já deu reputação para <@${target.id}> hoje. Tente em **${remaining}h**.`)] });
    }

    repCooldown.set(key, now);
    const updated = await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      { $inc: { "profile.reputation": 1 } },
      { new: true }
    );

    await message.reply({ embeds: [successEmbed("⭐ Reputação!", `Você deu +1 ⭐ reputação para <@${target.id}>!\nEles agora têm **${updated?.profile?.reputation || 1}** ⭐.`)] });
  },
};
