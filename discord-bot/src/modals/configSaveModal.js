const { successEmbed, errorEmbed } = require("../utils/embed");
const GuildConfig = require("../models/GuildConfig");

module.exports = {
  customId: /^config_save_/,
  async execute(interaction, client) {
    const type = interaction.customId.replace("config_save_", "");

    try {
      let update = {};

      if (type === "welcome") {
        const channelId = interaction.fields.getTextInputValue("channel_id").trim();
        const roleId = interaction.fields.getTextInputValue("role_id").trim();
        const message = interaction.fields.getTextInputValue("message").trim();
        update = {
          "welcome.enabled": true,
          "welcome.channelId": channelId,
          "welcome.roleId": roleId || null,
          "welcome.message": message,
        };
      } else if (type === "tickets") {
        const categoryId = interaction.fields.getTextInputValue("category_id").trim();
        const staffRoleId = interaction.fields.getTextInputValue("staff_role_id").trim();
        update = {
          "tickets.enabled": true,
          "tickets.categoryId": categoryId,
          "tickets.staffRoleId": staffRoleId,
        };
      } else if (type === "calls") {
        const categoryId = interaction.fields.getTextInputValue("category_id").trim();
        const joinChannelId = interaction.fields.getTextInputValue("join_channel_id").trim();
        update = {
          "privateCalls.enabled": true,
          "privateCalls.categoryId": categoryId,
          "privateCalls.joinChannelId": joinChannelId,
        };
      } else if (type === "logs") {
        const logChannelId = interaction.fields.getTextInputValue("log_channel_id").trim();
        const modLogChannelId = interaction.fields.getTextInputValue("mod_log_channel_id").trim();
        update = {
          "moderation.logChannelId": logChannelId,
          "moderation.modLogChannelId": modLogChannelId,
        };
      } else if (type === "economy") {
        const currencyName = interaction.fields.getTextInputValue("currency_name").trim();
        const currencyEmoji = interaction.fields.getTextInputValue("currency_emoji").trim();
        update = {
          "economy.currencyName": currencyName,
          "economy.currency": currencyEmoji,
        };
      }

      await GuildConfig.findOneAndUpdate({ guildId: interaction.guild.id }, { $set: update }, { upsert: true });
      await interaction.reply({ embeds: [successEmbed("✅ Configuração Salva", `Sistema \`${type}\` configurado com sucesso!`)], ephemeral: true });
    } catch (err) {
      await interaction.reply({ embeds: [errorEmbed("Erro", `Falha ao salvar: ${err.message}`)], ephemeral: true });
    }
  },
};
