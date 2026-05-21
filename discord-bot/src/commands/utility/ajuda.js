const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder } = require("discord.js");
const config = require("../../config/config");
const { checkPermission } = require("../../utils/permissions");

module.exports = {
  name: "ajuda",
  aliases: ["help", "h", "menu"],
  description: "Mostra o menu principal do bot",
  cooldown: 5,
  async execute(message, args, client) {
    const isStaff = checkPermission(message, "staff");

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("🌸 Menu Principal")
      .setDescription(
        `> Olá, **${message.author.username}**! Bem-vindo(a) ao painel interativo.\n> Use o menu abaixo para explorar os sistemas disponíveis.`
      )
      .addFields(
        {
          name: "❤️ Namoro & Social",
          value: "`!namoro` `!duo` `!perfil` `!reputacao` `!cantada`",
          inline: false,
        },
        {
          name: "🖤 Dark Love",
          value: "`!darklove` `!coleira` `!confissao`",
          inline: false,
        },
        {
          name: "💰 Economia",
          value: "`!saldo` `!diario` `!trabalhar` `!loja` `!inventario` `!pagar`",
          inline: false,
        },
        {
          name: "🏠 Vida & Casa",
          value: "`!casa` `!casar` `!divorcio` `!filhos` `!ranking`",
          inline: false,
        },
        {
          name: "🎮 Games",
          value: "`!duo` `!rank` `!squad`",
          inline: false,
        },
        {
          name: "🎫 Suporte",
          value: "`!ticket`",
          inline: false,
        },
        isStaff
          ? {
              name: "🛡️ Moderação (Staff)",
              value:
                "`!ban` `!kick` `!mute` `!warn` `!clear` `!softban` `!unban` `!unmute` `!warns` `!config`",
              inline: false,
            }
          : {
              name: "ℹ️ Informações",
              value: "`!ping` `!stats` `!serverinfo` `!userinfo`",
              inline: false,
            }
      )
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: `Prefixo: ${config.prefix} • Pedido por ${message.author.username}`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    const row = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("help_menu")
        .setPlaceholder("📚 Escolha uma categoria para detalhes...")
        .addOptions([
          { label: "❤️ Namoro & Social", value: "dating", emoji: "❤️" },
          { label: "🖤 Dark Love", value: "darklove", emoji: "🖤" },
          { label: "💰 Economia", value: "economy", emoji: "💰" },
          { label: "🏠 Vida & Relacionamentos", value: "life", emoji: "🏠" },
          { label: "🎮 Gamer", value: "games", emoji: "🎮" },
          { label: "ℹ️ Informações Gerais", value: "info", emoji: "ℹ️" },
          ...(isStaff
            ? [{ label: "🛡️ Moderação", value: "moderation", emoji: "🛡️" }]
            : []),
        ])
    );

    await message.reply({ embeds: [embed], components: [row] });
  },
};
