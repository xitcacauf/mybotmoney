const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
} = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");

module.exports = {
  customId: "duo_select_game",
  async execute(interaction, client) {
    const game = interaction.values[0];

    const modal = new ModalBuilder()
      .setCustomId(`duo_create_${game}`)
      .setTitle(`🎮 Duo — ${game}`);

    modal.addComponents(
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("rank").setLabel("Seu rank/nível").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(30)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("platform").setLabel("Plataforma (PC/Mobile/Console)").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("objective").setLabel("Objetivo (Rankeada/Casual/Treino...)").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("schedule").setLabel("Horário disponível").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(50)
      ),
      new ActionRowBuilder().addComponents(
        new TextInputBuilder().setCustomId("playstyle").setLabel("Estilo de jogo (Agressivo/Passivo/Flex...)").setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(50)
      )
    );

    await interaction.showModal(modal);
  },
};
