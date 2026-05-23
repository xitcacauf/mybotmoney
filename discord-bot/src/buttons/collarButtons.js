const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const { postCollarNews, postNews } = require("../utils/newsChannel");

const COLLAR_CHANNEL_ID = "1507081479509905478";

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

    const announcementEmbed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setTitle("⛓️ Nova Coleira no Servidor!")
      .setDescription(
        `**<@${ownerId}>** colocou uma coleira em **<@${pending.targetId}>**!\n\n` +
        `🖤 *Um novo vínculo de submissão foi formado no Dark Love System.*`
      )
      .setTimestamp();

    const collarChannel = interaction.guild.channels.cache.get(COLLAR_CHANNEL_ID);
    if (collarChannel) {
      await collarChannel.send({ embeds: [announcementEmbed] }).catch(() => {});
    }

    const newsEmbed = new EmbedBuilder()
      .setColor(0x1a0a2e)
      .setDescription(`⛓️ **<@${ownerId}>** colocou coleira em **<@${pending.targetId}>**`)
      .setTimestamp();

    await postNews(client, interaction.guild.id, newsEmbed).catch(() => {});
  },
};
