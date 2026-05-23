const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");

module.exports = {
  customId: /^collar_(accept|reject)_/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const isAccept = interaction.customId.startsWith("collar_accept_");
    const ownerId = interaction.customId.replace(/^collar_(accept|reject)_/, "");

    const pending = client.pendingCollars?.get(ownerId);
    if (!pending) {
      return interaction.editReply({ content: "❌ Este pedido de coleira expirou ou já foi respondido." });
    }

    if (interaction.user.id !== pending.targetId) {
      return interaction.editReply({ content: "❌ Esta coleira não é para você!" });
    }

    client.pendingCollars.delete(ownerId);
    try { await interaction.message.edit({ components: [] }); } catch {}

    if (!isAccept) {
      const rejectEmbed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle("❌ Coleira Recusada")
        .setDescription(`<@${pending.targetId}> recusou a coleira de <@${ownerId}>.`);
      await interaction.editReply({ content: "Você recusou a coleira." });
      await interaction.channel.send({ embeds: [rejectEmbed] }).catch(() => {});
      return;
    }

    const targetDb = await User.findOne({ userId: pending.targetId, guildId: interaction.guild.id });
    if (targetDb?.darkLove?.coleira) {
      return interaction.editReply({ content: `❌ Você já possui uma coleira de <@${targetDb.darkLove.coleira}>!` });
    }

    await User.findOneAndUpdate(
      { userId: pending.targetId, guildId: interaction.guild.id },
      { $set: { "darkLove.coleira": ownerId, "darkLove.coleiradoAt": new Date().toISOString() } }
    );

    const successEmbed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("⛓️ Coleira Colocada!")
      .setDescription(`<@${pending.targetId}> agora usa a coleira de <@${ownerId}>. 🖤\n\nO vínculo foi estabelecido no Dark Love System.`)
      .setTimestamp();

    await interaction.editReply({ content: "⛓️ Você aceitou a coleira." });
    await interaction.channel.send({ embeds: [successEmbed] }).catch(() => {});
  },
};
