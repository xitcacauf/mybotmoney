const {
  ChannelType,
  PermissionFlagsBits,
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} = require("discord.js");
const config = require("../config/config");
const GuildConfig = require("../models/GuildConfig");
const Ticket = require("../models/Ticket");
const logger = require("../utils/logger");
const { withLock } = require("../utils/userLock");

module.exports = {
  customId: ["ticket_create", "ticket_list"],
  async execute(interaction, client) {
    if (interaction.customId === "ticket_list") {
      const tickets = await Ticket.find({
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        status: { $ne: "closed" },
      });
      if (!tickets.length) {
        return interaction.reply({ content: "✅ Você não tem tickets abertos.", ephemeral: true });
      }
      return interaction.reply({
        content: `📋 Seus tickets: ${tickets.map((t) => `<#${t.channelId}>`).join(", ")}`,
        ephemeral: true,
      });
    }

    await interaction.deferReply({ ephemeral: true });

    const key = `ticket_create:${interaction.user.id}:${interaction.guild.id}`;
    await withLock(key, async () => {
      const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);
      const existing = await Ticket.findOne({
        userId: interaction.user.id,
        guildId: interaction.guild.id,
        status: "open",
      });

      if (existing) {
        return interaction.editReply({
          content: `❌ Você já tem um ticket aberto: <#${existing.channelId}>`,
        });
      }

      const ticketNumber = (gConfig.tickets.count || 0) + 1;
      await GuildConfig.findOneAndUpdate(
        { guildId: interaction.guild.id },
        { $inc: { "tickets.count": 1 } }
      );

      const ticketId = `ticket-${ticketNumber.toString().padStart(4, "0")}`;

      const overwrites = [
        { id: interaction.guild.id, deny: [PermissionFlagsBits.ViewChannel] },
        {
          id: interaction.user.id,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.AttachFiles,
          ],
        },
      ];

      if (gConfig.tickets.staffRoleId) {
        overwrites.push({
          id: gConfig.tickets.staffRoleId,
          allow: [
            PermissionFlagsBits.ViewChannel,
            PermissionFlagsBits.SendMessages,
            PermissionFlagsBits.ManageMessages,
          ],
        });
      }

      let channel;
      try {
        channel = await interaction.guild.channels.create({
          name: ticketId,
          type: ChannelType.GuildText,
          parent: gConfig.tickets.categoryId || null,
          permissionOverwrites: overwrites,
        });
      } catch (err) {
        logger.error(`Erro ao criar ticket: ${err.message}`);
        return interaction.editReply({ content: "❌ Erro ao criar ticket. Verifique as permissões do bot." });
      }

      await Ticket.create({
        ticketId,
        guildId: interaction.guild.id,
        channelId: channel.id,
        userId: interaction.user.id,
        username: interaction.user.tag,
      });

      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`🎫 Ticket ${ticketId}`)
        .setDescription(
          `Olá <@${interaction.user.id}>! Obrigado por abrir um ticket.\nDescreva seu problema e aguarde a staff!`
        )
        .addFields({ name: "👤 Aberto por", value: interaction.user.tag, inline: true })
        .setTimestamp();

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Fechar").setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId("ticket_claim").setLabel("✋ Assumir").setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId("ticket_add_member").setLabel("➕ Adicionar").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("ticket_transcript").setLabel("📋 Transcript").setStyle(ButtonStyle.Secondary),
        new ButtonBuilder().setCustomId("ticket_private_call").setLabel("🔊 Call Privada").setStyle(ButtonStyle.Success)
      );

      await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });
      await interaction.editReply({ content: `✅ Ticket criado: <#${channel.id}>` });
    });
  },
};
