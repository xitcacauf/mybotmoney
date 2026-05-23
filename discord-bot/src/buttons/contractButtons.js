const { EmbedBuilder } = require("discord.js");
const User = require("../models/User");
const { addBondXP } = require("../systems/ObsessionSystem");
const { pendingContracts } = require("../utils/pendingState");

const contractTypes = {
  submissao: { label: "Submissão Total", emoji: "⛓️" },
  protecao: { label: "Pacto de Proteção", emoji: "🛡️" },
  fidelidade: { label: "Pacto de Fidelidade", emoji: "💎" },
  treino: { label: "Contrato de Treino", emoji: "📋" },
  adoracao: { label: "Adoração", emoji: "🌹" },
};

module.exports = {
  customId: /^contract_(accept|reject)_/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const parts = interaction.customId.split("_");
    const action = parts[1];
    const proposerId = parts[2];
    const targetId = parts[3];

    const pendingKey = `${proposerId}_${targetId}`;
    const pending = pendingContracts?.get(pendingKey);
    if (!pending) {
      return interaction.editReply({ content: "❌ Este contrato expirou ou já foi respondido." });
    }

    if (interaction.user.id !== targetId) {
      return interaction.editReply({ content: "❌ Este contrato não é para você!" });
    }

    pendingContracts.delete(pendingKey);
    try { await interaction.message.edit({ components: [] }); } catch {}

    if (action === "reject") {
      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("❌ Contrato Recusado")
        .setDescription(`<@${targetId}> recusou o contrato de <@${proposerId}>.`);
      await interaction.editReply({ content: "Você recusou o contrato." });
      return interaction.message.reply({ embeds: [embed] }).catch(() => {});
    }

    const contract = contractTypes[pending.type] || { label: pending.type, emoji: "📜" };
    const now = new Date().toISOString();

    await User.findOneAndUpdate(
      { userId: proposerId, guildId: interaction.guild.id },
      { $set: { "darkLove.contractWith": targetId, "darkLove.contractType": pending.type, "darkLove.contractTerms": now } }
    );
    await User.findOneAndUpdate(
      { userId: targetId, guildId: interaction.guild.id },
      { $set: { "darkLove.contractWith": proposerId, "darkLove.contractType": pending.type, "darkLove.contractTerms": now } }
    );

    await addBondXP(proposerId, interaction.guild.id, targetId, 20);
    await addBondXP(targetId, interaction.guild.id, proposerId, 20);

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle(`${contract.emoji} Contrato Assinado!`)
      .setDescription(
        `<@${proposerId}> e <@${targetId}> assinaram um contrato de **${contract.label}**!\n\n` +
        `O vínculo foi registrado no Dark Love System.\n*Use \`!perfil\` para ver o contrato.*`
      )
      .setTimestamp();

    await interaction.editReply({ content: "✍️ Você assinou o contrato." });
    return interaction.message.reply({ embeds: [embed] }).catch(() => {});
  },
};
