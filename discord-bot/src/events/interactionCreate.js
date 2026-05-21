const logger = require("../utils/logger");
const { errorEmbed } = require("../utils/embed");

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    try {
      if (interaction.isButton()) {
        let handler = client.buttons.get(interaction.customId);
        if (!handler && client._buttonPatterns) {
          const match = client._buttonPatterns.find((p) => p.pattern.test(interaction.customId));
          if (match) handler = match.handler;
        }
        if (!handler) return;
        await handler.execute(interaction, client);
        return;
      }

      if (interaction.isModalSubmit()) {
        let handler = client.modals.get(interaction.customId);
        if (!handler && client._modalPatterns) {
          const match = client._modalPatterns.find((p) => p.pattern.test(interaction.customId));
          if (match) handler = match.handler;
        }
        if (!handler) return;
        await handler.execute(interaction, client);
        return;
      }

      if (interaction.isStringSelectMenu()) {
        const menu = client.selectMenus.get(interaction.customId);
        if (!menu) return;
        await menu.execute(interaction, client);
        return;
      }
    } catch (err) {
      logger.error(`Erro no interactionCreate [${interaction.customId || "?"}]: ${err.message}`);
      const embed = errorEmbed("Erro", "Ocorreu um erro ao processar esta interação.");
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => {});
      } else {
        await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
      }
    }
  },
};
