const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const { getMemories } = require("../systems/MemorySystem");

module.exports = {
  customId: /^profile_memorias_/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const targetId = interaction.customId.replace("profile_memorias_", "");
    const memories = await getMemories(targetId, interaction.guild.id);

    if (!memories.length) {
      return interaction.editReply({ content: "📸 Nenhuma memória registrada ainda." });
    }

    const memList = memories
      .slice(-8)
      .reverse()
      .map((m) => `${m.emoji || "📝"} **${m.label}**\n└ ${m.description}\n└ <t:${Math.floor(new Date(m.timestamp).getTime() / 1000)}:R>`)
      .join("\n\n");

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("📸 Álbum de Memórias")
      .setDescription(memList)
      .setFooter({ text: `${memories.length} memória(s) • Use !memorias para ver tudo` })
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};
