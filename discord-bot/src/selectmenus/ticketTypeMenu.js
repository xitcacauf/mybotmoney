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

const typeLabels = {
  suporte: { label: "Suporte Geral", emoji: "🆘" },
  denuncia: { label: "Denúncia", emoji: "🚨" },
  duvida: { label: "Dúvida", emoji: "❓" },
  parceria: { label: "Parceria", emoji: "🤝" },
  outro: { label: "Outro", emoji: "💬" },
};

module.exports = {
  customId: "ticket_type_select",
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const ticketType = interaction.values[0];
    const typeInfo = typeLabels[ticketType] || { label: "Ticket", emoji: "🎫" };

    const existing = await Ticket.findOne({
      userId: interaction.user.id,
      guildId: interaction.guild.id,
      status: "open",
    });

    if (existing) {
      return interaction.editReply({ content: `❌ Você já tem um ticket aberto: <#${existing.channelId}>\nFeche-o antes de abrir outro.` });
    }

    const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);
    const ticketNumber = (gConfig.tickets?.count || 0) + 1;
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
          PermissionFlagsBits.ReadMessageHistory,
        ],
      },
    ];

    const staffRoleId = gConfig.tickets?.staffRoleId;
    if (staffRoleId) {
      overwrites.push({
        id: staffRoleId,
        allow: [
          PermissionFlagsBits.ViewChannel,
          PermissionFlagsBits.SendMessages,
          PermissionFlagsBits.ManageMessages,
          PermissionFlagsBits.ReadMessageHistory,
        ],
      });
    } else {
      const adminRoles = interaction.guild.roles.cache.filter(
        (r) => r.permissions.has(PermissionFlagsBits.ManageMessages) && !r.managed && r.id !== interaction.guild.id
      );
      adminRoles.forEach((r) => {
        overwrites.push({
          id: r.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ManageMessages],
        });
      });
    }

    let channel;
    try {
      channel = await interaction.guild.channels.create({
        name: `${typeInfo.emoji}・${ticketId}`,
        type: ChannelType.GuildText,
        parent: gConfig.tickets?.categoryId || null,
        topic: `Ticket de ${interaction.user.tag} | Tipo: ${typeInfo.label}`,
        permissionOverwrites: overwrites,
      });
    } catch (err) {
      logger.error(`Erro ao criar ticket: ${err.message}`);
      return interaction.editReply({ content: "❌ Erro ao criar o ticket. Verifique se o bot tem permissão de **Gerenciar Canais**." });
    }

    await Ticket.create({
      ticketId,
      guildId: interaction.guild.id,
      channelId: channel.id,
      userId: interaction.user.id,
      username: interaction.user.tag,
      type: ticketType,
      status: "open",
    });

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(`${typeInfo.emoji} ${ticketId} — ${typeInfo.label}`)
      .setDescription(
        `Olá <@${interaction.user.id}>! Seu ticket foi criado com sucesso.\n\nDescreva seu problema com detalhes e aguarde nossa equipe!`
      )
      .addFields(
        { name: "👤 Aberto por", value: `<@${interaction.user.id}> (${interaction.user.tag})`, inline: true },
        { name: "📋 Tipo", value: `${typeInfo.emoji} ${typeInfo.label}`, inline: true },
        { name: "📌 Status", value: "🟢 Aberto", inline: true }
      )
      .setFooter({ text: "Nossa equipe responderá em breve!" })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("ticket_close").setLabel("🔒 Fechar Ticket").setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId("ticket_claim").setLabel("✋ Assumir").setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId("ticket_transcript").setLabel("📋 Transcript").setStyle(ButtonStyle.Secondary)
    );

    await channel.send({ content: `<@${interaction.user.id}>`, embeds: [embed], components: [row] });

    const onlineStaff = await findOnlineStaff(interaction.guild, staffRoleId);
    if (onlineStaff) {
      await channel.send({ content: `📣 <@${onlineStaff.id}> — novo ticket aberto aguardando atendimento!` });
    } else if (!staffRoleId) {
      const adminMembers = interaction.guild.members.cache.filter(
        (m) => !m.user.bot && m.permissions.has(PermissionFlagsBits.ManageMessages)
      );
      const onlineAdmin = adminMembers.find((m) => m.presence?.status === "online" || m.presence?.status === "dnd");
      if (onlineAdmin) {
        await channel.send({ content: `📣 <@${onlineAdmin.id}> — novo ticket aberto!` });
      }
    }

    await interaction.editReply({ content: `✅ Ticket criado! Vá para <#${channel.id}>` });
  },
};

async function findOnlineStaff(guild, staffRoleId) {
  if (!staffRoleId) return null;
  const role = guild.roles.cache.get(staffRoleId);
  if (!role) return null;
  const online = role.members.filter(
    (m) => !m.user.bot && (m.presence?.status === "online" || m.presence?.status === "dnd" || m.presence?.status === "idle")
  );
  if (online.size === 0) return role.members.filter((m) => !m.user.bot).random() || null;
  return online.random();
}
