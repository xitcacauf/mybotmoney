const { successEmbed, warningEmbed, errorEmbed } = require("../utils/embed");
const User = require("../models/User");
const { addBondXP } = require("../systems/ObsessionSystem");

const repCooldownMap = new Map();

module.exports = {
  customId: /^rep_/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const targetId = interaction.customId.replace("rep_", "");
    if (targetId === interaction.user.id) {
      return interaction.editReply({ embeds: [errorEmbed("Erro", "Você não pode se dar reputação.")] });
    }

    const key = `${interaction.user.id}-${targetId}`;
    const now = Date.now();
    const cooldownMs = 24 * 60 * 60 * 1000;
    if (repCooldownMap.has(key) && now - repCooldownMap.get(key) < cooldownMs) {
      const hoursLeft = Math.ceil((cooldownMs - (now - repCooldownMap.get(key))) / 3600000);
      return interaction.editReply({ embeds: [warningEmbed("Cooldown", `Você já deu reputação hoje! Aguarde **${hoursLeft}h**.`)] });
    }

    repCooldownMap.set(key, now);
    const updated = await User.findOneAndUpdate(
      { userId: targetId, guildId: interaction.guild.id },
      { $inc: { "profile.reputation": 1 } },
      { new: true }
    );

    await addBondXP(interaction.user.id, interaction.guild.id, targetId, 5).catch(() => {});

    return interaction.editReply({
      embeds: [successEmbed("⭐ Reputação Dada!", `Você deu +1 ⭐ para <@${targetId}>!\nEle(a) agora tem **${updated?.profile?.reputation || 1}** ⭐.`)],
    });
  },
};
