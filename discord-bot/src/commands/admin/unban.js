const { successEmbed, errorEmbed } = require("../../utils/embed");

module.exports = {
  name: "unban",
  aliases: ["desbanir"],
  description: "Desbane um usuário pelo ID. Ex: !unban 123456789",
  cooldown: 5,
  staffOnly: true,
  async execute(message, args, client) {
    const userId = args[0];
    if (!userId) return message.reply({ embeds: [errorEmbed("Erro", "Informe o ID do usuário.")] });

    try {
      await message.guild.bans.remove(userId);
      await message.reply({ embeds: [successEmbed("✅ Desbanido", `Usuário \`${userId}\` foi desbanido.`)] });
    } catch {
      await message.reply({ embeds: [errorEmbed("Erro", "Usuário não encontrado na lista de banidos.")] });
    }
  },
};
