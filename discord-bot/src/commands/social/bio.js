const { EmbedBuilder } = require("discord.js");
const { successEmbed, errorEmbed } = require("../../utils/embed");
const User = require("../../models/User");
const { sanitizeText } = require("../../utils/sanitize");
const config = require("../../config/config");

module.exports = {
  name: "bio",
  aliases: ["setbio", "descricao"],
  description: "Defina sua bio. Ex: !bio Sou um gamer louco!",
  cooldown: 10,
  async execute(message, args, client) {
    if (!args.length) {
      const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
      const bio = dbUser.profile?.bio || "Sem bio definida.";
      return message.reply({ embeds: [new EmbedBuilder()
        .setColor(config.colors.accent)
        .setTitle(`📝 Bio de ${message.author.username}`)
        .setDescription(`*${bio}*`)
        .setFooter({ text: "Use !bio <texto> para atualizar sua bio" })
        .setTimestamp()] });
    }

    const bio = sanitizeText(args.join(" "), 200);
    if (!bio) return message.reply({ embeds: [errorEmbed("Erro", "Informe sua bio. Ex: `!bio Sou gamer!`")] });

    await User.findOrCreate(message.author.id, message.guild.id, message.author.username);
    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $set: { "profile.bio": bio } }
    );

    await message.reply({ embeds: [successEmbed("✅ Bio Atualizada!", `Sua nova bio:\n> *${bio}*`)] });
  },
};
