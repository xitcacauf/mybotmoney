const {
  EmbedBuilder,
  ChannelType,
  PermissionFlagsBits,
} = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const GuildConfig = require("../models/GuildConfig");

function getCompatEmoji(compat) {
  if (compat >= 90) return "💞 Almas Gêmeas";
  if (compat >= 75) return "❤️ Muito Compatíveis";
  if (compat >= 60) return "💛 Boa Sintonia";
  return "🤝 Podem se entender";
}

module.exports = {
  customId: ["duo_accept", "duo_deactivate"],
  async execute(interaction, client) {
    const id = interaction.customId;

    await interaction.deferReply({ ephemeral: id === "duo_deactivate" });

    if (id === "duo_deactivate") {
      await User.findOneAndUpdate(
        { userId: interaction.user.id, guildId: interaction.guild.id },
        { $set: { "duo.active": false } }
      );
      try { await interaction.message.edit({ components: [] }); } catch {}
      return interaction.editReply({ content: "✅ Perfil de duo desativado. Use `!duo` para criar um novo." });
    }

    if (id === "duo_accept") {
      try {
        const compat = Math.floor(60 + Math.random() * 40);
        const gConfig = await GuildConfig.findOrCreate(interaction.guild.id);

        const privateCall = await interaction.guild.channels.create({
          name: `🎮 Duo Match`,
          type: ChannelType.GuildVoice,
          parent: gConfig.privateCalls?.categoryId || null,
          permissionOverwrites: [
            { id: interaction.guild.id, deny: [PermissionFlagsBits.Connect] },
            { id: interaction.user.id, allow: [PermissionFlagsBits.Connect] },
          ],
        }).catch(() => null);

        const embed = new EmbedBuilder()
          .setColor(config.colors.primary)
          .setTitle("🎮 Duo Match Encontrado!")
          .setDescription(
            `<@${interaction.user.id}> aceitou o duo!\n\n` +
            `**Compatibilidade:** ${compat}% — ${getCompatEmoji(compat)}`
          )
          .setTimestamp();

        if (privateCall) {
          embed.addFields({ name: "🔊 Call Privada Criada", value: `<#${privateCall.id}>`, inline: true });
        }

        return interaction.editReply({ embeds: [embed] });
      } catch (err) {
        return interaction.editReply({ content: "✅ Duo aceito! Combinem os detalhes por mensagem." });
      }
    }
  },
};
