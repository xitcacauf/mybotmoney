const { successEmbed, errorEmbed } = require("../../utils/embed");

module.exports = {
  name: "clear",
  aliases: ["purge", "limpar", "apagar"],
  description: "Apaga mensagens do canal. Ex: !clear 10",
  cooldown: 5,
  staffOnly: true,
  async execute(message, args, client) {
    const amount = parseInt(args[0]);
    if (isNaN(amount) || amount < 1 || amount > 100) {
      return message.reply({ embeds: [errorEmbed("Erro", "Informe um número de 1 a 100.")] });
    }

    await message.delete().catch(() => {});
    const deleted = await message.channel.bulkDelete(amount, true).catch(() => null);

    if (!deleted) {
      return message.channel
        .send({ embeds: [errorEmbed("Erro", "Não foi possível apagar mensagens (podem ter mais de 14 dias).")] })
        .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
    }

    const msg = await message.channel.send({
      embeds: [successEmbed("Chat Limpo", `🗑️ **${deleted.size}** mensagens apagadas.`)],
    });
    setTimeout(() => msg.delete().catch(() => {}), 4000);
  },
};
