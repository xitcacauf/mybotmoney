const { EmbedBuilder } = require("discord.js");
const { successEmbed, errorEmbed, warningEmbed } = require("../../utils/embed");
const User = require("../../models/User");
const config = require("../../config/config");

const repCooldown = new Map();

module.exports = {
  name: "reputacao",
  aliases: ["rep", "reputar", "estrela"],
  description: "Dê +1 de reputação a alguém. Ex: !reputacao @user",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Erro", "Mencione quem vai receber reputação. Ex: `!rep @user`")] });
    if (target.id === message.author.id) return message.reply({ embeds: [errorEmbed("Erro", "Você não pode se dar reputação.")] });
    if (target.bot) return message.reply({ embeds: [errorEmbed("Erro", "Bots não recebem reputação.")] });

    const key = `${message.author.id}-${target.id}`;
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;
    if (repCooldown.has(key) && now - repCooldown.get(key) < cooldownMs) {
      const remaining = Math.ceil((cooldownMs - (now - repCooldown.get(key))) / 3600000);
      return message.reply({ embeds: [warningEmbed("Cooldown", `Você já deu reputação para <@${target.id}> hoje.\nTente novamente em **${remaining}h**.`)] });
    }

    repCooldown.set(key, now);

    await User.findOrCreate(target.id, message.guild.id, target.username);
    const updated = await User.findOneAndUpdate(
      { userId: target.id, guildId: message.guild.id },
      { $inc: { "profile.reputation": 1 } }
    );

    const newRep = (updated?.profile?.reputation || 0) + 1;

    const embed = new EmbedBuilder()
      .setColor(config.colors.warning)
      .setTitle("⭐ Reputação Dada!")
      .setDescription(`<@${message.author.id}> deu **+1 ⭐** para <@${target.id}>!`)
      .addFields(
        { name: "⭐ Reputação total", value: `**${newRep}** estrelas`, inline: true },
        { name: "👤 Recebido por", value: `<@${target.id}>`, inline: true }
      )
      .setThumbnail(target.displayAvatarURL({ dynamic: true }))
      .setTimestamp();

    await message.reply({ embeds: [embed] });
  },
};
