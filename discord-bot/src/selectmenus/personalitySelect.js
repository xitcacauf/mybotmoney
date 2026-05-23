const User = require("../models/User");
const { EmbedBuilder } = require("discord.js");

const archetypes = {
  inocente: { emoji: "🌸", color: 0xffb6c1 },
  possessivo: { emoji: "🔒", color: 0x800000 },
  dominante: { emoji: "👑", color: 0x4b0082 },
  manipulador: { emoji: "🕸️", color: 0x2f4f4f },
  romantico: { emoji: "💝", color: 0xff69b4 },
  misterioso: { emoji: "🌑", color: 0x1a1a2e },
  obsessivo: { emoji: "⛓️", color: 0x8b0000 },
  carente: { emoji: "🥺", color: 0x87ceeb },
  independente: { emoji: "🦅", color: 0x556b2f },
};

const rpgBonus = {
  inocente: { charm: 3 },
  possessivo: { dominance: 3 },
  dominante: { dominance: 5, charm: 2 },
  manipulador: { manipulation: 5, seduction: 3 },
  romantico: { charm: 5 },
  misterioso: {},
  obsessivo: { dominance: 2, carencia: 3 },
  carente: { carencia: 5 },
  independente: { intelligence: 5 },
};

module.exports = {
  customId: "personality_select",
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const chosen = interaction.values[0];
    const arch = archetypes[chosen];
    if (!arch) return interaction.editReply({ content: "❌ Arquétipo inválido." });

    const bonus = rpgBonus[chosen] || {};
    const rpgUpdate = {};
    for (const [k, v] of Object.entries(bonus)) rpgUpdate[`rpg.${k}`] = v;

    await User.findOneAndUpdate(
      { userId: interaction.user.id, guildId: interaction.guild.id },
      {
        $set: {
          "profile.archetype": chosen,
          "profile._lastArchetypeChange": new Date().toISOString(),
          ...rpgUpdate,
        },
      }
    );

    const embed = new EmbedBuilder()
      .setColor(arch.color)
      .setTitle(`${arch.emoji} Arquétipo Definido!`)
      .setDescription(`Seu arquétipo agora é **${arch.emoji} ${chosen}**!\n\nSeu perfil e bônus foram atualizados.`)
      .setTimestamp();

    return interaction.editReply({ embeds: [embed] });
  },
};
