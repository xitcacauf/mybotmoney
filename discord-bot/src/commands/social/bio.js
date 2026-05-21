const { successEmbed, errorEmbed } = require("../../utils/embed");
const User = require("../../models/User");
const { sanitizeText } = require("../../utils/sanitize");

module.exports = {
  name: "bio",
  aliases: ["setbio", "descricao"],
  description: "Defina sua bio. Ex: !bio Sou um gamer louco!",
  cooldown: 10,
  async execute(message, args, client) {
    const bio = sanitizeText(args.join(" "), 200);
    if (!bio) return message.reply({ embeds: [errorEmbed("Erro", "Informe sua bio. Ex: `!bio Sou gamer!`")] });

    await User.findOneAndUpdate(
      { userId: message.author.id, guildId: message.guild.id },
      { $set: { "profile.bio": bio } }
    );

    await message.reply({ embeds: [successEmbed("✅ Bio Atualizada", `Sua nova bio: *${bio}*`)] });
  },
};
