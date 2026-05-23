const { EmbedBuilder, ActionRowBuilder, StringSelectMenuBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const config = require("../../config/config");
const { checkPermission } = require("../../utils/permissions");

module.exports = {
  name: "ajuda",
  aliases: ["help", "h", "menu", "comandos"],
  description: "Painel principal — todos os comandos organizados",
  cooldown: 5,
  async execute(message, args, client) {
    const isStaff = checkPermission(message, "staff");
    const prefix = config.prefix;

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle("🌸 Love Link — Central de Comandos")
      .setDescription(
        `Olá, **${message.author.username}**! 👋\n` +
        `Prefixo: \`${prefix}\` • Selecione uma categoria no menu abaixo.\n\n` +
        `**📌 Atalhos rápidos:**\n` +
        `\`${prefix}perfil\` • \`${prefix}saldo\` • \`${prefix}banco\` • \`${prefix}darklove\` • \`${prefix}ranking\``
      )
      .addFields(
        {
          name: "💳 Banco & Economia",
          value: "`!saldo` `!banco` `!extrato` `!cartao` `!patrimonio` `!investir` `!pix`",
          inline: false,
        },
        {
          name: "🛒 Ganhar & Gastar",
          value: "`!diario` `!trabalhar` `!crime` `!roubar` `!loja` `!comprar` `!usar` `!presente`",
          inline: false,
        },
        {
          name: "❤️ Social & Relacionamentos",
          value: "`!perfil` `!namoro` `!casar` `!divorcio` `!cantada` `!segredo` `!vinculo` `!duo` `!feed`",
          inline: false,
        },
        {
          name: "🧠 Psicologia & Identidade",
          value: "`!personalidade` `!memorias` `!status` `!reputacao` `!calor` `!niveis`",
          inline: false,
        },
        {
          name: "🖤 Dark Love",
          value: "`!darklove` `!coleira` `!tirarcoleira` `!contrato` `!desafio` `!prova` `!confissao`",
          inline: false,
        },
        {
          name: "🏠 Vida Virtual",
          value: "`!casa` `!filhos` `!pet` `!inventario` `!ranking` `!evento` `!tesouro`",
          inline: false,
        },
        {
          name: "ℹ️ Utilitários",
          value: "`!ping` `!serverinfo` `!userinfo` `!ticket` `!bio` `!apoie`",
          inline: false,
        },
        isStaff
          ? {
              name: "🛡️ Staff",
              value: "`!ban` `!kick` `!mute` `!warn` `!warns` `!clear` `!unban` `!config`",
              inline: false,
            }
          : {
              name: "🎮 Gamer",
              value: "`!duo` `!ranking xp` `!ranking msgs` `!ranking casais` `!ranking ativos`",
              inline: false,
            }
      )
      .setThumbnail(message.guild.iconURL({ dynamic: true }))
      .setFooter({
        text: `Use o menu ↓ para detalhes de cada categoria`,
        iconURL: message.author.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("help_menu")
      .setPlaceholder("📚 Selecione uma categoria para ver detalhes...")
      .addOptions([
        { label: "💳 Banco & Economia", description: "Saldo, banco, extrato, cartão, patrimônio", value: "economy", emoji: "💳" },
        { label: "🛒 Ganhar & Gastar", description: "Trabalho, crime, loja, compras, presentes", value: "earn", emoji: "🛒" },
        { label: "❤️ Social & Namoro", description: "Perfil, namoro, casar, cantada, segredo, feed", value: "dating", emoji: "❤️" },
        { label: "🧠 Identidade & Psico", description: "Arquétipo, memórias, status, reputação, calor", value: "identity", emoji: "🧠" },
        { label: "🖤 Dark Love", description: "Coleira, contrato, desafio, confissão", value: "darklove", emoji: "🖤" },
        { label: "🏠 Vida Virtual", description: "Casa, filhos, pet, inventário, eventos", value: "life", emoji: "🏠" },
        { label: "ℹ️ Utilitários", description: "Ping, info, níveis, duo, ticket", value: "info", emoji: "ℹ️" },
        ...(isStaff ? [{ label: "🛡️ Moderação", description: "Ban, kick, mute, warn, clear, config", value: "moderation", emoji: "🛡️" }] : []),
      ]);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    await message.reply({ embeds: [embed], components: [row] });
  },
};
