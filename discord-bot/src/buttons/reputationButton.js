const { successEmbed, warningEmbed, errorEmbed } = require("../utils/embed");
const User = require("../models/User");

const repCooldownMap = new Map();

module.exports = {
  customId: /^rep_/,
  async execute(interaction, client) {
    const targetId = interaction.customId.replace("rep_", "");
    if (targetId === interaction.user.id) {
      return interaction.reply({ embeds: [errorEmbed("Erro", "Você não pode se reputar.")], ephemeral: true });
    }

    const key = `${interaction.user.id}-${targetId}`;
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;
    if (repCooldownMap.has(key) && now - repCooldownMap.get(key) < cooldownMs) {
      return interaction.reply({ embeds: [warningEmbed("Cooldown", "Você já deu reputação hoje!")], ephemeral: true });
    }

    repCooldownMap.set(key, now);
    const updated = await User.findOneAndUpdate(
      { userId: targetId, guildId: interaction.guild.id },
      { $inc: { "profile.reputation": 1 } },
      { new: true }
    );

    await interaction.reply({
      embeds: [successEmbed("⭐ Reputação!", `Você deu +1 ⭐ para <@${targetId}>!\nEles agora têm **${updated?.profile?.reputation || 1}** ⭐.`)],
      ephemeral: true,
    });
  },
};
