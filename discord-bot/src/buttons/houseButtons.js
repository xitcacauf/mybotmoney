const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");
const User = require("../models/User");
const { successEmbed, errorEmbed } = require("../utils/embed");

const houseLevels = [
  { level: 0, name: "Sem Casa", emoji: "🏚️", cost: 0, perks: [] },
  { level: 1, name: "Barraco", emoji: "🏠", cost: 5000, perks: ["+5% XP em calls"] },
  { level: 2, name: "Apartamento", emoji: "🏢", cost: 15000, perks: ["+10% XP em calls", "Chat privado"] },
  { level: 3, name: "Casa Gourmet", emoji: "🏡", cost: 35000, perks: ["+15% bônus econômico", "Visitas ilimitadas"] },
  { level: 4, name: "Chalé Premium", emoji: "🏘️", cost: 60000, perks: ["+20% em tudo", "Badge exclusiva"] },
  { level: 5, name: "Mansão", emoji: "🏰", cost: 100000, perks: ["+30% em tudo", "Acesso VIP a eventos"] },
];

module.exports = {
  customId: /^house_(upgrade|info)_/,
  async execute(interaction, client) {
    const parts = interaction.customId.split("_");
    const action = parts[1];
    const userId = parts.slice(2).join("_");

    if (userId !== interaction.user.id) {
      return interaction.reply({ content: "❌ Isso não é seu!", ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });

    const dbUser = await User.findOrCreate(interaction.user.id, interaction.guild.id, interaction.user.username);
    const currentLevel = dbUser.house?.level || 0;

    if (action === "upgrade") {
      const next = houseLevels[currentLevel + 1];
      if (!next) {
        return interaction.editReply({ embeds: [errorEmbed("Nível Máximo", "Sua casa já está no nível máximo! 🏰")] });
      }

      if ((dbUser.economy?.wallet || 0) < next.cost) {
        const missing = next.cost - (dbUser.economy?.wallet || 0);
        return interaction.editReply({
          embeds: [errorEmbed("Sem Saldo", `Você precisa de mais **${missing.toLocaleString("pt-BR")} 💰** para melhorar a casa.`)],
        });
      }

      await User.findOneAndUpdate(
        { userId: interaction.user.id, guildId: interaction.guild.id },
        {
          $inc: { "house.level": 1, "economy.wallet": -next.cost },
          $set: { "house.name": next.name, "house.value": next.cost },
        }
      );

      const embed = new EmbedBuilder()
        .setColor(config.colors.success)
        .setTitle(`${next.emoji} Casa Melhorada!`)
        .setDescription(`Sua casa foi melhorada para **${next.emoji} ${next.name}**!\n\n**Benefícios desbloqueados:**\n${next.perks.join("\n") || "—"}`)
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }

    if (action === "info") {
      const current = houseLevels[currentLevel];
      const next = houseLevels[currentLevel + 1];
      const embed = new EmbedBuilder()
        .setColor(config.colors.info)
        .setTitle(`${current.emoji} Detalhes — ${current.name}`)
        .addFields(
          { name: "🏠 Nível", value: `${currentLevel}/5`, inline: true },
          { name: "💰 Valor", value: `${current.cost.toLocaleString("pt-BR")} 💰`, inline: true },
          { name: "🎁 Benefícios", value: current.perks.join("\n") || "Nenhum ainda", inline: false },
          next
            ? { name: `⬆️ Próximo: ${next.emoji} ${next.name}`, value: `Custo: ${next.cost.toLocaleString("pt-BR")} 💰\nBenefícios: ${next.perks.join(", ")}`, inline: false }
            : { name: "✅ Nível Máximo", value: "Você está no topo!", inline: false }
        )
        .setTimestamp();
      return interaction.editReply({ embeds: [embed] });
    }
  },
};
