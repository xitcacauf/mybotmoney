const { EmbedBuilder } = require("discord.js");
const config = require("../config/config");

const pages = {
  dating: {
    title: "❤️ Namoro & Social",
    fields: [
      { name: "!namoro", value: "Criar/ver perfil de web namoro" },
      { name: "!duo", value: "Procurar parceiro de jogo" },
      { name: "!perfil [@user]", value: "Ver perfil social" },
      { name: "!casar @user", value: "Pedido de casamento" },
      { name: "!divorcio", value: "Solicitar divórcio" },
      { name: "!cantada @user", value: "Enviar cantada" },
      { name: "!reputacao @user", value: "Dar +1 reputação" },
      { name: "!bio <texto>", value: "Definir sua bio" },
    ],
  },
  darklove: {
    title: "🖤 Dark Love",
    fields: [
      { name: "!darklove", value: "Painel Dark Love completo" },
      { name: "!coleira @user", value: "Colocar coleira digital" },
      { name: "!confissao", value: "Confissão anônima" },
    ],
  },
  economy: {
    title: "💰 Economia",
    fields: [
      { name: "!saldo [@user]", value: "Ver saldo" },
      { name: "!diario", value: "Recompensa diária (500 💰)" },
      { name: "!trabalhar", value: "Trabalhar (100-300 💰 / 1h)" },
      { name: "!crime", value: "Tentar crime (risco alto!)" },
      { name: "!pagar @user <valor>", value: "Transferir moedas" },
      { name: "!loja", value: "Ver loja de itens" },
      { name: "!inventario", value: "Ver seus itens" },
      { name: "!ranking [ricos|xp|msgs]", value: "Rankings do servidor" },
    ],
  },
  life: {
    title: "🏠 Vida & Relacionamentos",
    fields: [
      { name: "!casa", value: "Gerenciar sua casa" },
      { name: "!casar @user", value: "Casar (precisa de 💍 Anel)" },
      { name: "!divorcio", value: "Divórcio" },
      { name: "!perfil", value: "Ver todos os seus dados de vida" },
    ],
  },
  games: {
    title: "🎮 Gamer",
    fields: [
      { name: "!duo", value: "Procurar duo no seu jogo" },
      { name: "!ranking", value: "Rankings gerais" },
    ],
  },
  info: {
    title: "ℹ️ Informações",
    fields: [
      { name: "!ping", value: "Latência do bot" },
      { name: "!serverinfo", value: "Informações do servidor" },
      { name: "!userinfo [@user]", value: "Informações de usuário" },
      { name: "!nivel [@user]", value: "Ver nível e XP" },
      { name: "!ajuda", value: "Este menu de ajuda" },
    ],
  },
  moderation: {
    title: "🛡️ Moderação (Staff Only)",
    fields: [
      { name: "!ban @user [motivo]", value: "Banir membro" },
      { name: "!kick @user [motivo]", value: "Expulsar membro" },
      { name: "!mute @user <tempo> [motivo]", value: "Silenciar (ex: 10m, 1h)" },
      { name: "!warn @user [motivo]", value: "Advertir membro" },
      { name: "!warns [@user]", value: "Ver advertências" },
      { name: "!unban <id>", value: "Desbanir por ID" },
      { name: "!softban @user", value: "Softban (bane e desbane)" },
      { name: "!clear <1-100>", value: "Limpar mensagens" },
      { name: "!config", value: "Painel de configuração" },
      { name: "!ticket", value: "Painel de tickets" },
    ],
  },
};

module.exports = {
  customId: "help_menu",
  async execute(interaction, client) {
    const value = interaction.values[0];
    const page = pages[value];
    if (!page) return interaction.reply({ content: "❌ Categoria inválida.", ephemeral: true });

    const embed = new EmbedBuilder()
      .setColor(config.colors.primary)
      .setTitle(page.title)
      .addFields(page.fields.map((f) => ({ name: `\`${f.name}\``, value: f.value, inline: true })))
      .setFooter({ text: `Prefixo: ${config.prefix} • Use !ajuda para voltar ao menu` })
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
