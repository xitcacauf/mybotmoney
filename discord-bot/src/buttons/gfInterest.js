const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");

module.exports = {
  customId: /^gf_interest_/,
  async execute(interaction, client) {
    await interaction.deferReply({ ephemeral: true });

    const profileOwnerId = interaction.customId.replace("gf_interest_", "");

    if (interaction.user.id === profileOwnerId) {
      return interaction.editReply({ content: "❌ Você não pode demonstrar interesse em si mesmo." });
    }

    const ownerDb = await User.findOrCreate(profileOwnerId, interaction.guild.id, "");

    const embed = new EmbedBuilder()
      .setColor(config.colors.secondary)
      .setTitle("💌 Interesse Demonstrado!")
      .setDescription(
        `Você demonstrou interesse no perfil de <@${profileOwnerId}>!\n\n` +
        `Use \`!cantada @${ownerDb.username || "user"}\` para iniciar a conversa, ` +
        `ou \`!namoro @user\` para evoluir o relacionamento.`
      )
      .setTimestamp();

    try {
      const ownerUser = await interaction.client.users.fetch(profileOwnerId);
      await ownerUser.send({
        embeds: [
          new EmbedBuilder()
            .setColor(config.colors.secondary)
            .setTitle("💌 Alguém demonstrou interesse em você!")
            .setDescription(
              `**${interaction.user.username}** está interessado(a) no seu perfil de \`!gf\` no servidor **${interaction.guild.name}**!\n\n` +
              `Toque o coração com \`!cantada @${interaction.user.username}\` para responder. 💕`
            )
            .setTimestamp(),
        ],
      }).catch(() => {});
    } catch {}

    return interaction.editReply({ embeds: [embed] });
  },
};
