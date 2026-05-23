const { EmbedBuilder } = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");
const { getMemories } = require("../../systems/MemorySystem");

module.exports = {
  name: "memorias",
  aliases: ["memories", "historia", "album"],
  description: "Veja as memórias do casal. Ex: !memorias [@user]",
  cooldown: 5,
  async execute(message, args, client) {
    const target = message.mentions.users.first() || message.author;
    const dbUser = await User.findOrCreate(target.id, message.guild.id, target.username);

    const memories = await getMemories(target.id, message.guild.id);

    if (!memories.length) {
      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle("📸 Álbum de Memórias")
        .setDescription("Nenhuma memória registrada ainda.\nInteraja com outras pessoas para criar memórias juntos!")
        .setTimestamp();
      return message.reply({ embeds: [embed] });
    }

    const memList = memories
      .slice(-10)
      .reverse()
      .map((m) => `${m.emoji || "📝"} **${m.label}**\n└ ${m.description}\n└ <t:${Math.floor(new Date(m.timestamp).getTime() / 1000)}:R>`)
      .join("\n\n");

    const partnerId = dbUser.relationship?.partnerId;
    const marriedAt = dbUser.relationship?.marriedAt;
    let durationStr = "";
    if (marriedAt) {
      const days = Math.floor((Date.now() - new Date(marriedAt).getTime()) / 86400000);
      durationStr = `\n💍 Casados há **${days} dia(s)**`;
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle(`📸 Álbum de Memórias — ${target.username}`)
      .setDescription(
        (partnerId ? `❤️ Parceiro(a): <@${partnerId}>${durationStr}\n\n` : "") +
        memList
      )
      .setFooter({ text: `${memories.length} memória(s) no total • últimas 10 mostradas` })
      .setTimestamp();

    return message.reply({ embeds: [embed] });
  },
};
