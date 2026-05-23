const { EmbedBuilder } = require("discord.js");
const { getActiveEvent } = require("../../systems/EventSystem");

module.exports = {
  name: "evento",
  aliases: ["event", "eventos"],
  description: "Veja o evento ativo no momento",
  cooldown: 10,
  async execute(message, args, client) {
    const ev = getActiveEvent();

    if (!ev || Date.now() > ev.endsAt) {
      const embed = new EmbedBuilder()
        .setColor(0x555555)
        .setTitle("🎉 Eventos do Servidor")
        .setDescription(
          "Nenhum evento ativo no momento.\n\nEventos acontecem automaticamente a cada 2-4 horas!\nFique ligado para não perder os bônus. 🎯"
        )
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const timeLeft = Math.max(0, Math.floor((ev.endsAt - Date.now()) / 60000));
    const embed = new EmbedBuilder()
      .setColor(ev.color || 0xffd700)
      .setTitle(`🎉 EVENTO ATIVO: ${ev.name}`)
      .setDescription(ev.description)
      .addFields(
        { name: "⏱️ Tempo Restante", value: `${timeLeft} minuto(s)`, inline: true },
        { name: "📂 Tipo", value: ev.type || "Geral", inline: true },
      )
      .setFooter({ text: "Aproveite enquanto dura!" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
