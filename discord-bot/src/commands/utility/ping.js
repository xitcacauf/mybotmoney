const { infoEmbed } = require("../../utils/embed");

module.exports = {
  name: "ping",
  aliases: ["p", "latencia"],
  description: "Mostra a latência do bot",
  cooldown: 5,
  async execute(message, args, client) {
    const sent = await message.reply({ embeds: [infoEmbed("⏳ Calculando...", "Aguarde...")] });
    const latency = sent.createdTimestamp - message.createdTimestamp;
    const wsLatency = client.ws.ping;

    const embed = infoEmbed(
      "🏓 Pong!",
      `**Latência:** \`${latency}ms\`\n**WebSocket:** \`${wsLatency}ms\``
    );
    await sent.edit({ embeds: [embed] });
  },
};
