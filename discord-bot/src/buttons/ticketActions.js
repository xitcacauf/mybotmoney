const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  PermissionFlagsBits,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const config = require("../config/config");
const Ticket = require("../models/Ticket");
const GuildConfig = require("../models/GuildConfig");
const { isStaff } = require("../utils/permissions");
const logger = require("../utils/logger");

module.exports = {
  customId: ["ticket_close", "ticket_claim", "ticket_add_member", "ticket_transcript", "ticket_private_call"],
  async execute(interaction, client) {
    const id = interaction.customId;

    // Modals must not be deferred first — handle them before defer
    if (id === "ticket_add_member") {
      if (!isStaff(interaction.member)) {
        return interaction.reply({ content: "❌ Sem permissão.", ephemeral: true });
      }
      const modal = new ModalBuilder().setCustomId("ticket_add_modal").setTitle("Adicionar Membro ao Ticket");
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("member_id").setLabel("ID ou @menção do usuário").setStyle(TextInputStyle.Short).setRequired(true)
        )
      );
      return interaction.showModal(modal);
    }

    // Defer all other button responses immediately to prevent double-click races
    await interaction.deferReply({ ephemeral: id !== "ticket_close" });

    const ticket = await Ticket.findOne({ channelId: interaction.channel.id, status: { $ne: "closed" } });
    if (!ticket) return interaction.editReply({ content: "❌ Nenhum ticket ativo neste canal." });

    if (id === "ticket_close") {
      const canClose = isStaff(interaction.member) || ticket.userId === interaction.user.id;
      if (!canClose) return interaction.editReply({ content: "❌ Sem permissão." });

      const embed = new EmbedBuilder()
        .setColor(config.colors.error)
        .setTitle("🔒 Ticket Fechado")
        .setDescription(`Fechado por <@${interaction.user.id}>`)
        .setTimestamp();

      await Ticket.findOneAndUpdate(
        { channelId: interaction.channel.id },
        { status: "closed", closedAt: new Date(), closedBy: interaction.user.id }
      );

      await interaction.editReply({ embeds: [embed] });
      setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
      return;
    }

    if (id === "ticket_claim") {
      if (!isStaff(interaction.member)) return interaction.editReply({ content: "❌ Apenas staff pode assumir." });
      await Ticket.findOneAndUpdate({ channelId: interaction.channel.id }, { status: "claimed", claimedBy: interaction.user.id });
      return interaction.editReply({ content: `✅ Ticket assumido por <@${interaction.user.id}>!` });
    }

    if (id === "ticket_transcript") {
      if (!isStaff(interaction.member)) return interaction.editReply({ content: "❌ Sem permissão." });
      const messages = await interaction.channel.messages.fetch({ limit: 50 });
      const log = messages
        .reverse()
        .map((m) => `[${m.createdAt.toLocaleString("pt-BR")}] ${m.author.tag}: ${m.content}`)
        .join("\n");
      const buf = Buffer.from(log, "utf-8");
      return interaction.editReply({ content: "📋 Transcript:", files: [{ attachment: buf, name: `transcript-${ticket.ticketId}.txt` }] });
    }

    if (id === "ticket_private_call") {
      if (!isStaff(interaction.member)) return interaction.editReply({ content: "❌ Sem permissão." });
      const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);
      const callChannel = await interaction.guild.channels.create({
        name: `📞 ${ticket.ticketId}`,
        type: ChannelType.GuildVoice,
        parent: gConfig.categories?.tickets || gConfig.tickets.categoryId || null,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionFlagsBits.Connect] },
          { id: ticket.userId, allow: [PermissionFlagsBits.Connect] },
          { id: interaction.user.id, allow: [PermissionFlagsBits.Connect, PermissionFlagsBits.MoveMembers] },
        ],
      });
      await interaction.editReply({ content: `🔊 Call privada criada: <#${callChannel.id}>` });
      const timerMs = config.privateCall.deleteAfterMinutes * 60 * 1000;
      const timer = setTimeout(async () => {
        const ch = interaction.guild.channels.cache.get(callChannel.id);
        if (ch && ch.members.size === 0) await ch.delete().catch(() => {});
      }, timerMs);
      client.privateCallTimers.set(callChannel.id, timer);
    }
  },
};
