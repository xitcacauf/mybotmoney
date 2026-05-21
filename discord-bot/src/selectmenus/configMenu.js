const { EmbedBuilder, ModalBuilder, ActionRowBuilder, TextInputBuilder, TextInputStyle } = require("discord.js");
const config = require("../config/config");

module.exports = {
  customId: "config_menu",
  async execute(interaction, client) {
    const value = interaction.values[0];

    const modals = {
      welcome: { title: "Configurar Boas-Vindas", fields: [
        { id: "channel_id", label: "ID do canal de boas-vindas", placeholder: "123456789..." },
        { id: "role_id", label: "ID do cargo automático (opcional)", placeholder: "123456789...", required: false },
        { id: "message", label: "Mensagem ({user} = menção)", placeholder: "Bem-vindo(a) {user}!" },
      ]},
      tickets: { title: "Configurar Tickets", fields: [
        { id: "category_id", label: "ID da categoria de tickets", placeholder: "123456789..." },
        { id: "staff_role_id", label: "ID do cargo staff", placeholder: "123456789..." },
      ]},
      calls: { title: "Configurar Calls Privadas", fields: [
        { id: "category_id", label: "ID da categoria de calls", placeholder: "123456789..." },
        { id: "join_channel_id", label: "ID do canal de entrar (cria call)", placeholder: "123456789..." },
      ]},
      logs: { title: "Configurar Logs", fields: [
        { id: "log_channel_id", label: "ID do canal de log geral", placeholder: "123456789..." },
        { id: "mod_log_channel_id", label: "ID do canal de log de mod", placeholder: "123456789..." },
      ]},
      economy: { title: "Configurar Economia", fields: [
        { id: "currency_name", label: "Nome da moeda", placeholder: "Moedas" },
        { id: "currency_emoji", label: "Emoji da moeda", placeholder: "💰" },
      ]},
    };

    const modalDef = modals[value];
    if (!modalDef) return interaction.reply({ content: "⚙️ Configuração em desenvolvimento.", ephemeral: true });

    const modal = new ModalBuilder().setCustomId(`config_save_${value}`).setTitle(`⚙️ ${modalDef.title}`);
    modal.addComponents(
      ...modalDef.fields.map((f) =>
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId(f.id)
            .setLabel(f.label)
            .setStyle(TextInputStyle.Short)
            .setRequired(f.required !== false)
            .setPlaceholder(f.placeholder)
        )
      )
    );

    await interaction.showModal(modal);
  },
};
