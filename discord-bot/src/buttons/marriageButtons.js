const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const { addMemory } = require("../systems/MemorySystem");
const logger = require("../utils/logger");

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
    try { await interaction.message.edit({ components: [] }); } catch {}

    if (!isAccept) {
      const rejectEmbed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle("💔 Pedido Recusado")
        .setDescription(`<@${pending.targetId}> recusou o pedido de casamento de <@${proposerId}>.`);
      await interaction.editReply({ content: "Você recusou." });
      await interaction.channel.send({ embeds: [rejectEmbed] }).catch(() => {});
      return;
    }

    try {
      const senderDb = await User.findOrCreate(proposerId, interaction.guild.id, pending.proposerName);
      const targetDb = await User.findOrCreate(pending.targetId, interaction.guild.id, interaction.user.username);

      if (senderDb?.relationship?.status === "married") {
        return interaction.editReply({ content: "❌ O autor do pedido já está casado!" });
      }
      if (targetDb?.relationship?.status === "married") {
        return interaction.editReply({ content: "❌ Você já está casado(a)!" });
      }

      const now = new Date().toISOString();

      const proposerInventory = (senderDb.inventory || []).filter((i) => {
        if (i.itemId === "ring" && !i._consumed) { i._consumed = true; return false; }
        return true;
      });

      await User.findOneAndUpdate(
        { userId: proposerId, guildId: interaction.guild.id },
        {
          $set: {
            inventory: proposerInventory,
            "relationship.status": "married",
            "relationship.partnerId": pending.targetId,
            "relationship.partnerName": interaction.user.username,
            "relationship.marriedAt": now,
            "relationship.anniversary": now,
            "relationship.stage": "casado",
            "relationship.stageStartedAt": now,
          },
        }
      );

      await User.findOneAndUpdate(
        { userId: pending.targetId, guildId: interaction.guild.id },
        {
          $set: {
            "relationship.status": "married",
            "relationship.partnerId": proposerId,
            "relationship.partnerName": pending.proposerName,
            "relationship.marriedAt": now,
            "relationship.anniversary": now,
            "relationship.stage": "casado",
            "relationship.stageStartedAt": now,
          },
        }
      );

      await addMemory(proposerId, interaction.guild.id, "got_married", `Casou com ${interaction.user.username}`);
      await addMemory(pending.targetId, interaction.guild.id, "got_married", `Casou com ${pending.proposerName}`);

      const successEmbed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle("💍 Casamento Realizado!")
        .setDescription(
          `🎊 <@${proposerId}> e <@${pending.targetId}> agora são casados! Parabéns! 🎊\n\nQue sejam muito felizes juntos! 💕\n\n*Use \`!memorias\` para ver as memórias do casal.*`
        )
        .setTimestamp();

      await interaction.editReply({ content: "💍 Você aceitou!" });
      await interaction.channel.send({ embeds: [successEmbed] }).catch(() => {});
    } catch (err) {
      logger.error(`[MARRIAGE BUTTON] ${err.message}\n${err.stack}`);
      interaction.editReply({ content: "❌ Erro ao processar casamento. Tente novamente." }).catch(() => {});
    }
  },
};
