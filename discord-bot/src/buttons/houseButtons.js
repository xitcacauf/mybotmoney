const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const { successEmbed, errorEmbed } = require("../utils/embed");

const houseLevels = [
  { level: 0, name: "Sem Casa", cost: 0 },
  { level: 1, name: "Barraco", cost: 5000 },
  { level: 2, name: "Apartamento", cost: 15000 },
  { level: 3, name: "Casa Gourmet", cost: 35000 },
  { level: 4, name: "Chalé", cost: 60000 },
  { level: 5, name: "Mansão", cost: 100000 },
];

module.exports = {
  customId: /^house_upgrade_/,
  async execute(interaction, client) {
    const userId = interaction.customId.replace("house_upgrade_", "");
    if (userId !== interaction.user.id) {
      return interaction.reply({ content: "❌ Isso não é seu!", ephemeral: true });
    }

    const dbUser = await User.findOrCreate(interaction.user.id, interaction.guild.id, interaction.user.username);
    const currentLevel = dbUser.house.level;
    const next = houseLevels[currentLevel + 1];
    if (!next) return interaction.reply({ embeds: [errorEmbed("Nível Máximo", "Sua casa já está no nível máximo!")], ephemeral: true });

    if (dbUser.economy.wallet < next.cost) {
      return interaction.reply({ embeds: [errorEmbed("Sem saldo", `Você precisa de **${next.cost.toLocaleString("pt-BR")} 💰** para melhorar.`)], ephemeral: true });
    }

    await User.findOneAndUpdate(
      { userId: interaction.user.id, guildId: interaction.guild.id },
      { $inc: { "house.level": 1, "economy.wallet": -next.cost }, $set: { "house.name": next.name, "house.value": next.cost } }
    );

    await interaction.reply({ embeds: [successEmbed("🏠 Casa Melhorada!", `Sua casa foi melhorada para **${next.name}**!`)] });
  },
};
