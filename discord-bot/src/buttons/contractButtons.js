const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const { addBondXP } = require("../systems/ObsessionSystem");
const { pendingContracts } = require("../utils/pendingState");
const { postNews } = require("../utils/newsChannel");

const contractTypes = {
  submissao: { label: "Submissão Total", emoji: "⛓️" },
  protecao: { label: "Pacto de Proteção", emoji: "🛡️" },
  fidelidade: { label: "Pacto de Fidelidade", emoji: "💎" },
  treino: { label: "Contrato de Treino", emoji: "📋" },
  adoracao: { label: "Adoração", emoji: "🌹" },
};

async function resetPersonagem(userId, guildId, executorId, guild) {
  const defaultUser = {
    "economy.wallet": 1000,
    "economy.bank": 0,
    "economy.totalEarned": 0,
    "economy.lastDaily": null,
    "economy.lastWork": null,
    "economy.lastCrime": null,
    "economy.streak": 0,
    "economy.ledger": [],
    "social.xp": 0,
    "social.level": 1,
    "social.messages": 0,
    "relationship.status": "single",
    "relationship.partnerId": null,
    "relationship.partnerName": "",
    "relationship.stage": "none",
    "relationship.marriedAt": null,
    "relationship.children": [],
    "relationship.obsessionLevel": 0,
    "relationship.bondXP": 0,
    "darkLove.coleira": null,
    "darkLove.coleiradoAt": null,
    "darkLove.contractWith": null,
    "darkLove.contractType": null,
    "career.facultyProgress": 0,
    "career.facultyCompleted": false,
    "bonds": {},
    "inventory": [],
  };
  await User.findOneAndUpdate({ userId, guildId }, { $set: defaultUser });

  const newsEmbed = new EmbedBuilder()
    .setColor(0xff0000)
    .setTitle("💀 Personagem Resetado!")
    .setDescription(
      `<@${userId}> teve seu personagem **completamente resetado** por <@${executorId}>.\n\n` +
      `*Economia, nível, relacionamentos e coleira foram zerados.*`
    )
    .setTimestamp();

  await postNews({ guilds: { cache: new Map([[guild.id, guild]]) } }, guild.id, newsEmbed).catch(() => {});
}

module.exports = {
  customId: /^contract_(accept|reject|do_reset|cancel_reset)_?/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const id = interaction.customId;

    if (id === "contract_cancel_reset") {
      return interaction.editReply({ content: "✅ Reset cancelado." });
    }

    if (id.startsWith("contract_do_reset_")) {
      const parts = id.split("_");
      const targetId = parts[3];
      const executorId = parts[4];

      if (interaction.user.id !== executorId) {
        return interaction.editReply({ content: "❌ Apenas quem solicitou pode confirmar." });
      }

      await resetPersonagem(targetId, interaction.guild.id, executorId, interaction.guild);

      const embed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("💀 Personagem Resetado")
        .setDescription(`O personagem de <@${targetId}> foi **completamente zerado**.`)
        .setTimestamp();

      try { await interaction.message.edit({ components: [] }); } catch {}
      await interaction.editReply({ content: "💀 Reset aplicado com sucesso." });
      await interaction.channel.send({ embeds: [embed] }).catch(() => {});
      return;
    }

    const parts = id.split("_");
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
      const rejectEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle("❌ Contrato Recusado")
        .setDescription(`<@${targetId}> recusou o contrato de <@${proposerId}>.`);
      await interaction.editReply({ content: "Você recusou o contrato." });
      await interaction.channel.send({ embeds: [rejectEmbed] }).catch(() => {});
      return;
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

    await addBondXP(proposerId, interaction.guild.id, targetId, 20).catch(() => {});
    await addBondXP(targetId, interaction.guild.id, proposerId, 20).catch(() => {});

    const embed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle(`${contract.emoji} Contrato Assinado!`)
      .setDescription(
        `<@${proposerId}> e <@${targetId}> assinaram um **contrato de ${contract.label}**!\n\n` +
        `O vínculo foi registrado no Dark Love System.\n` +
        `Use \`!contrato ver\` para visualizar as regras.\n\n` +
        `⚠️ *O não cumprimento pode resultar em reset do personagem.*`
      )
      .setTimestamp();

    const newsEmbed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setDescription(`${contract.emoji} **<@${proposerId}>** e **<@${targetId}>** assinaram contrato de **${contract.label}**`)
      .setTimestamp();

    await interaction.editReply({ content: "✍️ Você assinou o contrato." });
    await interaction.channel.send({ embeds: [embed] }).catch(() => {});
    await postNews(client, interaction.guild.id, newsEmbed).catch(() => {});
  },
};
