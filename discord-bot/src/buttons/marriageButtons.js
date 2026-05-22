const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");

module.exports = {
  customId: /^marry_(accept|reject)_/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const isAccept = interaction.customId.startsWith("marry_accept_");
    const proposerId = interaction.customId.replace(/^marry_(accept|reject)_/, "");

    const pending = client.pendingMarriages?.get(proposerId);
    if (!pending) {
      return interaction.editReply({ content: "❌ Este pedido de casamento expirou ou já foi respondido." });
    }

    if (interaction.user.id !== pending.targetId) {
      return interaction.editReply({ content: "❌ Este pedido não é para você!" });
    }

    client.pendingMarriages.delete(proposerId);

    if (!isAccept) {
      try {
        await interaction.message.edit({ components: [] });
      } catch {}
      const rejectEmbed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle("💔 Pedido Recusado")
        .setDescription(`<@${pending.targetId}> recusou o pedido de casamento de <@${proposerId}>.`);
      await interaction.editReply({ content: "Você recusou." });
      return interaction.message.reply({ embeds: [rejectEmbed] }).catch(() => {});
    }

    const senderDb = await User.findOne({ userId: proposerId, guildId: interaction.guild.id });
    const targetDb = await User.findOne({ userId: pending.targetId, guildId: interaction.guild.id });

    if (senderDb?.relationship?.status === "married") {
      return interaction.editReply({ content: "❌ O autor do pedido já está casado!" });
    }
    if (targetDb?.relationship?.status === "married") {
      return interaction.editReply({ content: "❌ Você já está casado(a)!" });
    }

    await User.findOneAndUpdate(
      { userId: proposerId, guildId: interaction.guild.id },
      { $set: { "relationship.status": "married", "relationship.partnerId": pending.targetId, "relationship.partnerName": interaction.user.username, "relationship.marriedAt": new Date().toISOString() } }
    );
    await User.findOneAndUpdate(
      { userId: pending.targetId, guildId: interaction.guild.id },
      { $set: { "relationship.status": "married", "relationship.partnerId": proposerId, "relationship.partnerName": pending.proposerName, "relationship.marriedAt": new Date().toISOString() } }
    );

    try {
      await interaction.message.edit({ components: [] });
    } catch {}

    const successEmbed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle("💍 Casamento Realizado!")
      .setDescription(`🎊 <@${proposerId}> e <@${pending.targetId}> agora são casados! Parabéns! 🎊\n\nQue sejam muito felizes juntos! 💕`)
      .setTimestamp();

    await interaction.editReply({ content: "💍 Você aceitou!" });
    return interaction.message.reply({ embeds: [successEmbed] }).catch(() => {});
  },
};
