const { EmbedBuilder } = require("discord.js");
const { getGuildHeat, getHeatLabel, getHeatBonus } = require("../../systems/SocialHeat");

module.exports = {
  name: "calor",
  aliases: ["heat", "atividade", "hype"],
  description: "Veja o calor social do servidor — quanto mais quente, mais bônus!",
  cooldown: 10,
  async execute(message, args, client) {
    const rec = await getGuildHeat(message.guild.id);
    const heat = rec.heat || 0;
    const { label, color } = getHeatLabel(heat);
    const { xpMult, econMult } = getHeatBonus(heat);

    const bar = buildBar(heat);

    const embed = new EmbedBuilder()
      .setColor(color)
      .setTitle("🌡️ Termômetro Social do Servidor")
      .setDescription(`**Status atual:** ${label}\n\n${bar}\n**${heat}/100** de calor`)
      .addFields(
        { name: "⭐ Bônus de XP", value: `${xpMult}x`, inline: true },
        { name: "💰 Bônus Econômico", value: `${econMult}x`, inline: true },
        { name: "📊 Interações Totais", value: `${rec.totalInteractions || 0}`, inline: true },
        {
          name: "🔥 Como aumentar?",
          value: "Mensagens, flertes, calls, casamentos, presentes e uso de comandos sociais aumentam o calor!\nQuanto mais quente, mais bônus para todos.",
          inline: false,
        },
      )
      .setFooter({ text: "O calor decai 5 pontos por hora sem atividade" })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};

function buildBar(heat) {
  const filled = Math.floor(heat / 5);
  const empty = 20 - filled;
  const bar = "🟥".repeat(filled) + "⬛".repeat(empty);
  return bar;
}
