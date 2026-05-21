const { PermissionFlagsBits } = require("discord.js");
const Ticket = require("../models/Ticket");

module.exports = {
  customId: "ticket_add_modal",
  async execute(interaction, client) {
    const raw = interaction.fields.getTextInputValue("member_id").trim();
    const userId = raw.replace(/[<@!>]/g, "");

    const member = interaction.guild.members.cache.get(userId) ||
      await interaction.guild.members.fetch(userId).catch(() => null);

    if (!member) {
      return interaction.reply({ content: "❌ Usuário não encontrado.", ephemeral: true });
    }

    await interaction.channel.permissionOverwrites.edit(member, {
      ViewChannel: true,
      SendMessages: true,
    });

    await Ticket.findOneAndUpdate(
      { channelId: interaction.channel.id },
      { $addToSet: { members: userId } }
    );

    await interaction.reply({ content: `✅ <@${userId}> adicionado ao ticket.` });
  },
};
