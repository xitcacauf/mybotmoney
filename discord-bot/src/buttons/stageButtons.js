const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const { addBondXP } = require("../systems/ObsessionSystem");
const { addMemory } = require("../systems/MemorySystem");
const { addHeat } = require("../systems/SocialHeat");
const { pendingStage } = require("../utils/pendingState");

const stageLabels = {
  conhecendo: "👀 Conhecendo",
  flertando: "😏 Flertando",
  ficante: "💫 Ficante",
  namorando: "💕 Namorando",
  alianca: "💍 Aliança",
};

const stageMemoryType = {
  namorando: "started_dating",
};

module.exports = {
  customId: /^stage_(accept|reject)_/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const parts = interaction.customId.split("_");
    const action = parts[1];
    const proposerId = parts[2];
    const targetId = parts[3];

    const pendingKey = `stage_${proposerId}_${targetId}`;
    const pending = pendingStage?.get(pendingKey);
    if (!pending) {
      return interaction.editReply({ content: "❌ Este pedido expirou ou já foi respondido." });
    }

    if (interaction.user.id !== targetId) {
      return interaction.editReply({ content: "❌ Este pedido não é para você!" });
    }

    pendingStage.delete(pendingKey);
    try { await interaction.message.edit({ components: [] }); } catch {}

    if (action === "reject") {
      await interaction.editReply({ content: "❌ Você recusou o convite." });
      return interaction.message.reply({ content: `💔 <@${targetId}> recusou o convite de <@${proposerId}>.` }).catch(() => {});
    }

    const now = new Date().toISOString();
    const nextStage = pending.nextStage;
    const cost = pending.cost || 0;

    // Cobrar custo
    if (cost > 0) {
      const sender = await User.findOne({ userId: proposerId, guildId: interaction.guild.id });
      if (!sender || (sender.economy?.wallet || 0) < cost) {
        return interaction.editReply({ content: `❌ <@${proposerId}> não tem mais ${cost} 💰 para esta etapa.` });
      }
      await User.findOneAndUpdate(
        { userId: proposerId, guildId: interaction.guild.id },
        { $inc: { "economy.wallet": -cost } }
      );
    }

    // Atualizar ambos
    await User.findOneAndUpdate(
      { userId: proposerId, guildId: interaction.guild.id },
      {
        $set: {
          "relationship.stage": nextStage,
          "relationship.stageStartedAt": now,
          "relationship.partnerId": targetId,
          "relationship.partnerName": interaction.user.username,
          "relationship.status": nextStage === "namorando" || nextStage === "alianca" ? "dating" : "single",
        },
      }
    );
    await User.findOneAndUpdate(
      { userId: targetId, guildId: interaction.guild.id },
      {
        $set: {
          "relationship.stage": nextStage,
          "relationship.stageStartedAt": now,
          "relationship.partnerId": proposerId,
          "relationship.partnerName": pending.proposerName,
          "relationship.status": nextStage === "namorando" || nextStage === "alianca" ? "dating" : "single",
        },
      }
    );

    await addBondXP(proposerId, interaction.guild.id, targetId, 10);
    await addBondXP(targetId, interaction.guild.id, proposerId, 10);
    await addHeat(interaction.guild.id, 5).catch(() => {});

    if (stageMemoryType[nextStage]) {
      await addMemory(proposerId, interaction.guild.id, stageMemoryType[nextStage], `Começou a namorar com ${interaction.user.username}`);
      await addMemory(targetId, interaction.guild.id, stageMemoryType[nextStage], `Começou a namorar com ${pending.proposerName}`);
    }

    const embed = new EmbedBuilder()
      .setColor(config.colors.success)
      .setTitle(`💕 ${stageLabels[nextStage] || nextStage}`)
      .setDescription(
        `<@${proposerId}> e <@${targetId}> agora estão em **${stageLabels[nextStage] || nextStage}**! 🎉\n\n` +
        `*A jornada continua... Use \`!namoro @user\` para evoluir mais!*`
      )
      .setTimestamp();

    await interaction.editReply({ content: "💕 Você aceitou!" });
    return interaction.message.reply({ embeds: [embed] }).catch(() => {});
  },
};
