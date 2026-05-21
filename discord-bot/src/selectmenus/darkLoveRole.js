const { successEmbed } = require("../utils/embed");
const User = require("../models/User");

module.exports = {
  customId: "darklove_role",
  async execute(interaction, client) {
    const role = interaction.values[0];
    await User.findOneAndUpdate(
      { userId: interaction.user.id, guildId: interaction.guild.id },
      { $set: { "darkLove.role": role } }
    );
    await interaction.reply({
      embeds: [successEmbed("🖤 Role Definido", `Seu role Dark Love é agora: **${role}**`)],
      ephemeral: true,
    });
  },
};
