const { successEmbed, errorEmbed } = require("../../utils/embed");

module.exports = {
  name: "softban",
  aliases: ["sb"],
  description: "Bane e desbane imediatamente (limpa mensagens)",
  cooldown: 5,
  staffOnly: true,
  async execute(message, args, client) {
    const target = message.mentions.members.first();
    if (!target) return message.reply({ embeds: [errorEmbed("Erro", "Mencione um membro.")] });
    if (!target.bannable) return message.reply({ embeds: [errorEmbed("Erro", "Não posso banir este usuário.")] });

    const reason = args.slice(1).join(" ") || "Softban";

    await target.ban({ reason, deleteMessageSeconds: 7 * 24 * 3600 });
    await message.guild.bans.remove(target.id, "Softban - remoção automática").catch(() => {});

    await message.reply({
      embeds: [successEmbed("🧹 Softban Aplicado", `**${target.user.tag}** foi softbanido. Mensagens limpas.`)],
    });
  },
};
