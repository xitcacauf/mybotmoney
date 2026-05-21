const {
  EmbedBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
} = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const Match = require("../models/Match");
const { calcCompatibility, getCompatibilityEmoji } = require("../systems/CompatibilityEngine");
const { ChannelType, PermissionFlagsBits } = require("discord.js");
const GuildConfig = require("../models/GuildConfig");

module.exports = {
  customId: ["dating_open_modal", "dating_deactivate", "dating_edit"],
  async execute(interaction, client) {
    const id = interaction.customId;

    if (id === "dating_open_modal") {
      const modal = new ModalBuilder().setCustomId("dating_create").setTitle("❤️ Perfil de Web Namoro");
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("name").setLabel("Seu nome").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(32)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("age").setLabel("Sua idade").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("gender").setLabel("Gênero (Homem/Mulher/Outro)").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("bio").setLabel("Bio + hobbies + jogo favorito").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("location").setLabel("Localização (cidade/estado)").setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(50)
        )
      );
      return interaction.showModal(modal);
    }

    if (id === "dating_deactivate") {
      await User.findOneAndUpdate(
        { userId: interaction.user.id, guildId: interaction.guild.id },
        { $set: { "dating.active": false } }
      );
      return interaction.reply({ content: "✅ Perfil de namoro desativado.", ephemeral: true });
    }

    if (id === "dating_edit") {
      const modal = new ModalBuilder().setCustomId("dating_create").setTitle("✏️ Editar Perfil de Namoro");
      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("bio").setLabel("Nova bio").setStyle(TextInputStyle.Paragraph).setRequired(true).setMaxLength(300)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("location").setLabel("Nova localização").setStyle(TextInputStyle.Short).setRequired(false).setMaxLength(50)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("name").setLabel("Seu nome").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(32)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("age").setLabel("Sua idade").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(3)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder().setCustomId("gender").setLabel("Seu gênero").setStyle(TextInputStyle.Short).setRequired(true).setMaxLength(20)
        )
      );
      return interaction.showModal(modal);
    }
  },
};
