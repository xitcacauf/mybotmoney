const {
  EmbedBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
} = require("discord.js");
const config = require("../../config/config");
const User = require("../../models/User");

module.exports = {
  name: "duo",
  aliases: ["pduo", "parceiro", "squad"],
  description: "Procure um parceiro de jogo (Duo)",
  cooldown: 10,
  async execute(message, args, client) {
    const dbUser = await User.findOrCreate(message.author.id, message.guild.id, message.author.username);

    if (dbUser.duo.active) {
      const p = dbUser.duo.profileData;
      const embed = new EmbedBuilder()
        .setColor(config.colors.primary)
        .setTitle(`🎮 ${message.author.username} — Procurando Duo`)
        .addFields(
          { name: "🎮 Jogo", value: p.game || "?", inline: true },
          { name: "🏆 Rank", value: p.rank || "?", inline: true },
          { name: "📱 Plataforma", value: p.platform || "?", inline: true },
          { name: "🎯 Modo", value: p.mode || "?", inline: true },
          { name: "🎮 Playstyle", value: p.playstyle || "?", inline: true },
          { name: "🎤 Microfone", value: p.microphone ? "✅ Sim" : "❌ Não", inline: true },
          { name: "⏰ Horário", value: p.schedule || "?", inline: true },
          { name: "🎯 Objetivo", value: p.objective || "?", inline: true }
        )
        .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

      const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId("duo_accept").setLabel("✅ Aceitar Duo").setStyle(ButtonStyle.Success),
        new ButtonBuilder().setCustomId("duo_deactivate").setLabel("❌ Desativar").setStyle(ButtonStyle.Danger)
      );
      return message.reply({ embeds: [embed], components: [row] });
    }

    const gameRow = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("duo_select_game")
        .setPlaceholder("🎮 Escolha seu jogo...")
        .addOptions([
          { label: "Free Fire", value: "Free Fire", emoji: "🔥" },
          { label: "Valorant", value: "Valorant", emoji: "⚡" },
          { label: "Roblox", value: "Roblox", emoji: "🧱" },
          { label: "Minecraft", value: "Minecraft", emoji: "⛏️" },
          { label: "League of Legends", value: "League of Legends", emoji: "⚔️" },
          { label: "Fortnite", value: "Fortnite", emoji: "🏗️" },
          { label: "CS2", value: "CS2", emoji: "🔫" },
          { label: "Outro", value: "Outro", emoji: "🎮" },
        ])
    );

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("🎮 Procurando Duo")
      .setDescription("Selecione seu jogo abaixo para criar seu perfil de duo!");

    await message.reply({ embeds: [embed], components: [gameRow] });
  },
};
