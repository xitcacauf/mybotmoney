const logger = require("../utils/logger");
const { errorEmbed } = require("../utils/embed");

// Dedup: Discord can occasionally deliver the same interaction twice.
// We claim each interaction ID once — subsequent deliveries are silently dropped.
const processedInteractions = new Set();

module.exports = {
  name: "interactionCreate",
  async execute(interaction, client) {
    try {
      // Layer 1: interaction ID dedup (synchronous, same-process)
      if (processedInteractions.has(interaction.id)) return;
      processedInteractions.add(interaction.id);
      setTimeout(() => processedInteractions.delete(interaction.id), 15_000);

      // Layer 2: guard against already-acknowledged interactions
      if (interaction.replied || interaction.deferred) return;

      if (interaction.isButton()) {
        let handler = client.buttons.get(interaction.customId);
        if (!handler && client._buttonPatterns) {
          const match = client._buttonPatterns.find((p) => p.pattern.test(interaction.customId));
          if (match) handler = match.handler;
        }
        if (!handler) {
          if (!interaction.replied && !interaction.deferred) {
            await interaction.reply({ content: "❌ Este botão não está mais disponível.", ephemeral: true }).catch(() => {});
          }
          return;
        }
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
      const embed = errorEmbed("Erro", "Ocorreu um erro ao processar esta interação. Tente novamente.");
      try {
        if (interaction.deferred) {
          await interaction.editReply({ embeds: [embed] }).catch(() => {});
        } else if (!interaction.replied) {
          await interaction.reply({ embeds: [embed], ephemeral: true }).catch(() => {});
        } else {
          await interaction.followUp({ embeds: [embed], ephemeral: true }).catch(() => {});
        }
      } catch {}
    }
  },
};
