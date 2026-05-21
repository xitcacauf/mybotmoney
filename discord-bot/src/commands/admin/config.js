const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const config = require("../../config/config");
const GuildConfig = require("../../models/GuildConfig");

module.exports = {
  name: "config",
  aliases: ["configurar", "setup"],
  description: "Painel de configuração do bot",
  cooldown: 5,
  adminOnly: true,
  async execute(message, args, client) {
    const gConfig = await GuildConfig.findOrCreate(message.guild.id);

    const embed = new EmbedBuilder()
      .setColor(config.colors.accent)
      .setTitle("⚙️ Painel de Configuração")
      .setDescription("Use o menu abaixo para configurar os sistemas do bot.")
      .addFields(
        {
          name: "👋 Boas-vindas",
          value: gConfig.welcome.enabled
            ? `✅ Ativo — <#${gConfig.welcome.channelId || "não configurado"}>`
            : "❌ Desativado",
          inline: true,
        },
        {
          name: "🎫 Tickets",
          value: gConfig.tickets.enabled
            ? `✅ Ativo — ${gConfig.tickets.count} abertos`
            : "❌ Desativado",
          inline: true,
        },
        {
          name: "🔊 Calls Privadas",
          value: gConfig.privateCalls.enabled ? "✅ Ativo" : "❌ Desativado",
          inline: true,
        },
        {
          name: "🛡️ Anti-Nuke",
          value: gConfig.antiNuke.enabled ? "✅ Ativo" : "❌ Desativado",
          inline: true,
        }
      )
      .setFooter({ text: "Use os subcomandos: !config welcome | tickets | calls | logs" });

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("config_menu")
        .setPlaceholder("Selecione o que configurar...")
        .addOptions([
          { label: "👋 Boas-Vindas", value: "welcome", description: "Canal, cargo, mensagem" },
          { label: "🎫 Sistema de Tickets", value: "tickets", description: "Categoria, cargo staff" },
          { label: "🔊 Calls Privadas", value: "calls", description: "Categoria, canal de entrada" },
          { label: "📝 Canais de Log", value: "logs", description: "Log de moderação e geral" },
          { label: "🛡️ Anti-Nuke", value: "antinuke", description: "Proteção anti-raid" },
          { label: "💰 Economia", value: "economy", description: "Nome da moeda" },
        ])
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
